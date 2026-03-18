const mongoose = require("mongoose"); 
const webpush = require("web-push"); 
const User = require("../models/userSchema"); 

// ============================================================================
// 🚨 THE FIX: INITIALIZE WEB-PUSH HERE SO IT KNOWS YOUR KEYS!
// ============================================================================
try {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      // The subject must be a mailto: URL or a standard URL
      `mailto:${process.env.EMAIL || 'admin@curiousteamlearning.com'}`, 
      process.env.VAPID_PUBLIC_KEY.trim(), 
      process.env.VAPID_PRIVATE_KEY.trim()
    );
    console.log("✅ Web-Push VAPID keys loaded successfully in notify.js!");
  } else {
    console.warn("⚠️ WARNING: VAPID keys are missing from Environment Variables. Push notifications will silently fail.");
  }
} catch (error) {
  console.error("❌ Web-Push Initialization Failed:", error.message);
}
// ============================================================================

const sendAutoNotification = async (app, recipientId, message, link, triggeredBy) => {
  try {
    const user = await User.findById(recipientId);
    if (!user) return;

    const safeLink = link.startsWith('/') ? link : `/${link}`;

    // 1. Force a unique ID so React doesn't crash when rendering!
    const newNotif = {
      _id: new mongoose.Types.ObjectId(), 
      message: message,
      link: safeLink,
      triggeredBy: triggeredBy || "System",
      date: new Date(),
      isRead: false
    };

    // 2. Split Push and Pull into TWO separate operations
    // Step A: Push the new notification safely
    await User.findByIdAndUpdate(recipientId, {
      $push: {
        notifications: {
          $each: [newNotif],
          $position: 0 // Puts it at the top
        }
      }
    });

    // Step B: The 7-Day Cleanup 
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await User.findByIdAndUpdate(recipientId, {
      $pull: {
        notifications: { date: { $lt: sevenDaysAgo } }
      }
    });

    // 3. Web Push Logic (This will now work because of the code at the top!)
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
            // Silently log push errors so it doesn't crash the rest of the app
            console.error("Web Push Error:", pushErr.statusCode);
          }
        }
      });

      await Promise.all(pushPromises);

      // Clean up users who uninstalled the app or revoked permissions
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