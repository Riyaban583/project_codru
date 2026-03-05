const mongoose = require("mongoose");
const User = require("./userSchema"); // Import the base User

const studentSchema = new mongoose.Schema({
  // Only student-specific fields go here!
  altPhone: {
    type: String, 
    default: "" 
  },
  address: { 
    type: String, 
    default: "" 
  },
  classSemester: { 
    type: String, 
    default: "" 
  },
  schoolCollege: { 
    type: String, 
    default: "" 
  },
  subjects: { 
    type: [String], 
    default: ["", "", "", "", "", ""] 
  },
  fatherName: { 
    type: String, 
    default: "" 
  },
  fatherOcc: { 
    type: String, 
    default: "" 
  },
  motherName: { 
    type: String, 
    default: "" 
  },
  motherOcc: { 
    type: String, 
    default: "" 
  },

  tasks: [{
    week: String,
    question: String,
    answer: String,
    link: String
  }]
});

// This magically merges the Student fields with the base User fields
const Student = User.discriminator("Student", studentSchema);

module.exports = Student;