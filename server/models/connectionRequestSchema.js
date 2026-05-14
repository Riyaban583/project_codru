// models/connectionRequestSchema.js
const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  message: { 
    type: String, 
    required: true,
    trim: true
  },
  meetingDate: { 
    type: Date // Optional: If they want to propose a specific time
  },
  meetingLink: { 
    type: String // 🚨 ADD THIS
  },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "declined", "disconnected", "rejected"], 
    default: "pending" 
  },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true }); // Automatically adds createdAt and updatedAt
connectionRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

const ConnectionRequest = mongoose.model("ConnectionRequest", connectionRequestSchema);
module.exports = ConnectionRequest;