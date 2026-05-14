const mongoose = require("mongoose"); // 🚨 Required for forcing the ID
const webpush = require("web-push"); 
const User = require("../models/userSchema"); 

const sendAutoNotification = async (app, recipientId, message, link, triggeredBy) => {
  try {
    const user = await User.findById(recipientId);
    if (!user) return;

    const safeLink = link.startsWith('/') ? link : `/${link}`;

    // 1. 🚨 THE ID FIX: Force a unique ID so React doesn't crash when rendering!
    const newNotif = {
      _id: new mongoose.Types.ObjectId(), 
      message: message,
      link: safeLink,
      triggeredBy: triggeredBy || "System",
      date: new Date(),
      isRead: false
    };

    // 2. 🚨 THE MONGODB FIX: Split Push and Pull into TWO separate operations
    // Step A: Push the new notification safely
    await User.findByIdAndUpdate(recipientId, {
      $push: {
        notifications: {
          $each: [newNotif],
          $position: 0 // Puts it at the top
        }
      }
    });

    // Step B: The 1-Year Database Cleanup 
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    
    // This silently deletes notifications older than 1 year to protect DB size
    await User.findByIdAndUpdate(recipientId, {
      $pull: {
        notifications: { date: { $lt: oneYearAgo } }
      }
    });

    // 3. Web Push Logic
    if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
      const pushPayload = JSON.stringify({
        title: "New Activity", 
        body: message,
        link: safeLink
      });

      let deadEndpoints = []; 

      const pushPromises = user.pushSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub, pushPayload);
        } catch (pushErr) {
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            deadEndpoints.push(sub.endpoint);
          } else {
            console.error("Web Push Error:", pushErr.statusCode);
          }
        }
      });

      await Promise.all(pushPromises);

      if (deadEndpoints.length > 0) {
        await User.findByIdAndUpdate(recipientId, {
          $pull: { pushSubscriptions: { endpoint: { $in: deadEndpoints } } }
        });
      }
    }

    // 4. Socket.io Real-time Ping
    if (app && app.get("io")) {
      app.get("io").to(user.username).emit("notification", newNotif);
    }

  } catch (error) {
    console.error("🚨 Auto-Notification Helper Error:", error);
  }
};

module.exports = sendAutoNotification;