const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true }, 
  type: { type: String, default: 'class' }, 
  color: { type: String, default: 'bg-brand-blue' },
  
  // Connects the event to the user who created it
  user: { type: mongoose.Schema.Types.ObjectId, ref: "USER", required: true },
  
  // ==========================================
  // 🚨 NEW: Google Calendar Sync Fields
  // ==========================================
  googleEventId: { type: String }, // Crucial for updating/deleting later!
  meetLink: { type: String },      // The actual video call URL
  htmlLink: { type: String },      // Link to view it on calendar.google.com
  description: { type: String },   // Event notes/details
  guests: [{ type: String }],      // Array of invited usernames/emails
  
  // To store our recordings and class materials safely
  attachments: [{
    title: String,
    fileUrl: String,
    fileId: String,
    mimeType: String
  }],
  // ==========================================
  
  // Notification Fields
  reminderMinutes: { type: Number, default: 15 }, 
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true }); // Adding timestamps is a great habit so you know when it was created!

const Event = mongoose.model("EVENT", eventSchema);
module.exports = Event;