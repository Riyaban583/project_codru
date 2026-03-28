const express = require('express');
const axios = require('axios');
const router = express.Router();
const Contact = require('../models/Contact');
const Message = require('../models/Message');
const User = require("../models/userSchema"); 
const sendAutoNotification = require("../utils/notify");

// ==========================================
// 1. GET: FETCH CHAT HISTORY
// ==========================================
router.get('/chats/:userNumber', async (req, res) => {
    try {
        const { userNumber } = req.params;
        // We find messages where userNumber matches the student's phone
        const messages = await Message.find({ userNumber }).sort({ timestamp: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to load chat history." });
    }
});

// ==========================================
// 2. POST: SEND MANUAL REPLY
// ==========================================
router.post('/send', async (req, res) => {
    try {
        // 1. Grab 'to' and 'messageBody' from the React frontend
        const { to, messageBody } = req.body; 

        if (!to || !messageBody) {
            return res.status(400).json({ error: "Phone number and message are required." });
        }

        const botNumberId = "1049944734868137"; 

        // 2. Send via Meta API
        const response = await axios({
            method: "POST",
            url: `https://graph.facebook.com/v19.0/${botNumberId}/messages`,
            data: {
                messaging_product: "whatsapp",
                to: to,
                text: { body: messageBody },
            },
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
            },
        });

        if (response.data && response.data.messages) {
            // 3. Save to Message collection
            const savedMessage = await Message.create({
                wa_id: response.data.messages[0].id,
                senderName: "Admin (CuTe)",
                userNumber: to, // Ensure this uses 'to'
                botNumberId: botNumberId,
                messageBody: messageBody,
                messageType: 'text',
                direction: 'outgoing',
                status: 'sent'
            });

            // 4. 🚨 THE CRITICAL FIX: Update Contact using 'to' (not 'from'!)
            await Contact.findOneAndUpdate(
                { phoneNumber: to }, // or 'fromNumber' in webhook
                { 
                    $set: { 
                        lastMessage: messageBody, 
                        lastSeen: new Date(),
                        unreadCount: 0
                    }
                
                },
                { 
                    upsert: true, 
                    new: true, 
                    // 🚨 THIS IS THE FIX: It tells Mongoose to ignore schema strictness here
                    strict: false 
                }
            );

            // 5. Emit to UI via Socket
            if (req.app && req.app.get("io")) {
                req.app.get("io").emit("whatsapp_message_update", savedMessage);
            }

            // 6. Respond and STOP
            return res.status(200).json(savedMessage);
        }

    } catch (error) {
        console.error("Error in /send route:", error.message);
        
        // Prevent the "Headers already sent" crash
        if (!res.headersSent) {
            return res.status(500).json({ error: "Failed to send message." });
        }
    }
});

// ==========================================
// 3. GET: WEBHOOK VERIFY (Keep as is)
// ==========================================
router.get('/webhook', (req, res) => {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (token === process.env.WHATSAPP_VERIFY_TOKEN) return res.status(200).send(challenge);
    res.sendStatus(403);
});

// ==========================================
// 4. POST: RECEIVE WEBHOOK
// ==========================================
router.post('/webhook', async (req, res) => {
    res.sendStatus(200); // Always tell Meta "Got it!" first
    const body = req.body;

    if (body.object === "whatsapp_business_account") {
        
        const value = body.entry?.[0]?.changes?.[0]?.value;
        if (!value) return; // Safety check

        // ----------------------------------------------------
        // BLOCK 1: INCOMING MESSAGES (Student texts you)
        // ----------------------------------------------------
        if (value.messages) {
            try {
                const msg = value.messages[0];
                const contactInfo = value.contacts ? value.contacts[0] : null;
                
                const fromNumber = msg.from; 
                const senderName = contactInfo?.profile?.name || "New Student";
                const msgText = msg.text?.body || "Media received";

                // 1. Save to Message Collection
                const savedMessage = await Message.create({
                    wa_id: msg.id,
                    senderName: senderName,
                    userNumber: fromNumber,
                    botNumberId: value.metadata.phone_number_id,
                    messageBody: msgText,
                    direction: 'incoming',
                    status: 'received',
                    timestamp: new Date()
                });

                // 2. Update Contact Sidebar & Unread Count
                await Contact.findOneAndUpdate(
                    { phoneNumber: fromNumber }, 
                    { 
                        $set: { 
                            name: senderName, 
                            lastMessage: msgText, 
                            lastSeen: new Date() 
                        },
                        $inc: { unreadCount: 1 }
                    },
                    { upsert: true, new: true, strict: false }
                );

                // 3. 📣 BROADCAST TO UI
                if (req.app.get("io")) {
                    console.log(`[Socket] Broadcasting message from ${fromNumber}`);
                    req.app.get("io").emit("whatsapp_message_update", savedMessage);
                }

                // =========================================================
                // 4. 🚨 THE NEW MAGIC: SYSTEM NOTIFICATIONS (PUSH + IN-APP)
                // =========================================================
                try {
                    // Find all Admins (or you could look up the specific assigned teacher)
                    const admins = await User.find({ isAdmin: true });
                    
                    // Format a nice preview of the message
                    const previewText = msgText.length > 30 ? msgText.substring(0, 30) + "..." : msgText;
                    
                    const notifyPromises = admins.map(admin => 
                        sendAutoNotification(
                            req.app, 
                            admin._id, 
                            `💬 WhatsApp: ${senderName} says "${previewText}"`, 
                            "whatsapp-crm", // 🚨 Change this to the actual URL path of your WhatsApp Chat page!
                            "WhatsApp Bot" // Audit trigger
                        )
                    );
                    
                    await Promise.all(notifyPromises);
                    console.log("✅ System Push Notifications sent to Admins!");

                } catch (notifErr) {
                    console.error("❌ Failed to trigger Admin WhatsApp notifications:", notifErr);
                }
                // =========================================================

            } catch (e) { 
                console.error("❌ Webhook Messages Error:", e.message); 
            }
        }

        // ----------------------------------------------------
        // BLOCK 2: STATUS UPDATES (Sent, Delivered, Read)
        // ----------------------------------------------------
        if (value.statuses) {
            try {
                const statusObj = value.statuses[0];
                const wa_id = statusObj.id; // Match this to the sent message
                const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
                
                // Meta timestamp is in seconds. Convert to JS milliseconds.
                const exactTime = new Date(statusObj.timestamp * 1000); 

                let updateData = { status: status };
                if (status === 'delivered') updateData.deliveredAt = exactTime;
                if (status === 'read') updateData.readAt = exactTime;

                // 1. Update the exact message timestamps
                const updatedMessage = await Message.findOneAndUpdate(
                    { wa_id: wa_id },
                    { $set: updateData },
                    { new: true }
                );

                // 2. 📣 BROADCAST STATUS UPDATE TO UI
                if (updatedMessage && req.app.get("io")) {
                    console.log(`[Status] Message ${status} at ${exactTime.toLocaleTimeString()}`);
                    req.app.get("io").emit("whatsapp_status_update", updatedMessage);
                }

            } catch (e) {
                console.error("❌ Status Webhook Error:", e.message);
            }
        }
    }
});

// ==========================================
// 5. GET: MASTER CONTACT LIST (Unified)
// ==========================================
router.get('/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find({ isArchived: false })
                                      .sort({ lastSeen: -1 }) 
                                      .lean();
        
        const clean = contacts.map(c => ({
            _id: String(c._id),
            name: c.name || "Unknown Student",
            phoneNumber: String(c.phoneNumber || ""), 
            lastMessage: c.lastMessage || "",
            lastSeen: c.lastSeen || c.updatedAt,
            unreadCount: c.unreadCount || 0
        }));

        res.status(200).json(clean);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 6. POST: RESET UNREAD COUNT
// ==========================================
router.post('/contacts/reset-unread/:id', async (req, res) => {
    try {
        await Contact.findByIdAndUpdate(req.params.id, { 
            $set: { unreadCount: 0 } 
        });
        res.sendStatus(200);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 6. POST: SEND TEMPLATE MESSAGE (With Variables!)
// ==========================================
router.post('/send-template', async (req, res) => {
    try {
        const { 
            to, 
            templateName, 
            languageCode = "en", 
            variables = [], 
            headerUrl = null 
        } = req.body;

        const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
        const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

        // 1. Initialize components array
        const components = [];

        // 2. Add Header (Image) if provided
        if (headerUrl) {
            components.push({
                type: "header",
                parameters: [
                    {
                        type: "image",
                        image: { link: headerUrl }
                    }
                ]
            });
        }

        // 3. Add Body Variables if provided
        if (variables.length > 0) {
            components.push({
                type: "body",
                parameters: variables.map(text => ({
                    type: "text",
                    text: String(text)
                }))
            });
        }

        const payload = {
            messaging_product: "whatsapp",
            to: to,
            type: "template",
            template: {
                name: templateName,
                language: { code: languageCode },
                components: components // This is now dynamic!
            }
        };

        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            payload,
            { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
        );

        // 4. Save to DB for CRM history
        const savedMessage = await Message.create({
            wa_id: response.data.messages[0].id,
            senderName: "System Template",
            userNumber: to,
            messageBody: `[Template: ${templateName}]`,
            botNumberId: PHONE_NUMBER_ID,
            messageType: 'template',
            direction: 'outgoing',
            status: 'sent',
            timestamp: new Date()
        });

        if (req.app.get("io")) req.app.get("io").emit("whatsapp_message_update", savedMessage);

        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Template Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to send template" });
    }
});

module.exports = router;