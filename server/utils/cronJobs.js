const cron = require('node-cron');
const Event = require('../models/eventSchema'); 
const sendAutoNotification = require('./notify'); // Assuming your helper is in the same folder

// We wrap this in a function so we can pass your 'app' from server.js (for Socket.io)
const startCalendarCron = (app) => {
  
  // '* * * * *' means "Run at minute 0, minute 1, minute 2..."
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // 1. Find all upcoming events that haven't been reminded yet.
      // 🚨 Pro-move: { $gte: now } ensures we don't accidentally send reminders for events from last month if the server restarts!
      const upcomingEvents = await Event.find({ 
        reminderSent: false,
        date: { $gte: now } 
      });

      for (const event of upcomingEvents) {
        // 2. Calculate when the reminder should go out
        // (Event Date - Reminder Minutes converted to milliseconds)
        const reminderTime = new Date(event.date.getTime() - (event.reminderMinutes * 60000));

        // 3. Is it time to send the alert?
        if (now >= reminderTime) {
          
          let message = `Reminder: "${event.title}" starts in ${event.reminderMinutes} minutes!`;
          if (event.reminderMinutes === 0) {
            message = `"${event.title}" is starting right now!`;
          }

          // 4. Fire the Web Push & Socket!
          await sendAutoNotification(
            app, 
            event.user, 
            message, 
            '/dashboard?view=schedule', // Teleport them right to the calendar
            'System'
          );

          // 5. Check it off the list so they don't get spammed again 60 seconds later
          event.reminderSent = true;
          await event.save();
        }
      }
    } catch (error) {
      console.error("Calendar Cron Job Error:", error);
    }
  });

  console.log("⏰ Calendar Notification Cron Job initialized!");
};

module.exports = startCalendarCron;