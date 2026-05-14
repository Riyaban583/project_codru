const mongoose = require("mongoose");

// -------------------------------------------------------------
// 1. MASTER BLUEPRINT (Uploaded by you via Excel)
// -------------------------------------------------------------
const masterNodeSchema = new mongoose.Schema({
  course: { type: String, required: true, index: true }, // e.g., "Class 12", "JEE"
  title: { type: String, required: true },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MasterNode', 
    default: null 
  },
  order: { type: Number, required: true, default: 0 },
  level: { type: Number, required: true } // 1=Subject, 2=Chapter, 3=Topic...
});

const MasterNode = mongoose.model("MasterNode", masterNodeSchema);


// -------------------------------------------------------------
// 2. USER TRACKER (The Student's Personal Shadow Copy)
// -------------------------------------------------------------
const userNodeSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true }, // Links to the student
  course: { type: String, required: true, index: true },   // "Class 12" or "JEE"
  
  title: { type: String, required: true },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserNode', // 🚨 Points to THEIR personal parent node, not the master!
    default: null 
  },
  
  order: { type: Number, required: true, default: 0 },
  level: { type: Number, required: true },
  
  // Progress Tracking
  status: { type: String, enum: ['not_started', 'completed'], default: 'not_started' },
  hasDoubt: { type: Boolean, default: false },
  
  // Customization Tracking
  isCustom: { type: Boolean, default: false }
});

const UserNode = mongoose.model("UserNode", userNodeSchema);

module.exports = { MasterNode, UserNode };