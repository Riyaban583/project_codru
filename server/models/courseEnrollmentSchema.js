const mongoose = require("mongoose");

const courseEnrollmentSchema = new mongoose.Schema({
  // 1. Core Relations
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // 2. Course Details
  courseName: { type: String, required: true }, // e.g., "Graphic Designing", "Robotics"
  level: { type: String, default: "Level 1" }, 
  
  // 3. The Custom Project
  projectName: { type: String, default: "Choosing a Project..." }, // e.g., "Cafe Logo Design"
  
  // 4. Milestone Stepper
  // You can customize these stages on the frontend, but we store the current step here
  currentMilestone: { 
    type: String, 
    enum: ['Ideation', 'Prototyping', 'Building', 'Polishing', 'Completed'],
    default: 'Ideation'
  },
  
  // 5. Mentor's Sticky Note
  mentorNote: { 
    type: String, 
    default: "Welcome to the course! Let's brainstorm some awesome ideas together." 
  },
  
  // 6. Portfolio / Gallery (Images of their sketches, code snippets, robots)
  portfolio: [{
    title: String,
    mediaUrl: String, // Link to the image/video
    dateAdded: { type: Date, default: Date.now }
  }],
  
  // 7. Custom Resource Stash (PDFs, Asset zips, specific links for this kid)
  resources: [{
    title: String,
    fileUrl: String,
    dateAdded: { type: Date, default: Date.now }
  }],

  startDate: { type: Date, default: Date.now }, // Automatically captures exact time of enrollment
  endDate: { type: Date }, // Will be set when teacher clicks graduated
  studentAcceptedGraduation: { type: Boolean, default: false },

  status: { type: String, enum: ['active', 'paused', 'graduated'], default: 'active' }

}, { timestamps: true });

const CourseEnrollment = mongoose.model("CourseEnrollment", courseEnrollmentSchema);
module.exports = CourseEnrollment;