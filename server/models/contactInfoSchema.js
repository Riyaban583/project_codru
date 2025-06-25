const mongoose =require("mongoose");
const User = require("./userSchema");


const contactInfo = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  CollegeName: {
    type: String,
    default: "",
  },
  semester: {
    type: String,
    default: "",
  },
  branch: {
    type: String,
    default: "",
  },

  yearofAdmission: {
    type: String,
  },
  yearofCompletion: {
    type: String,
  } ,
  //trainingorCourse: 
  traningorCourse: {
    type: String,
  },
startDate:{
    type: Date,
  },
  endDate: {
    type: Date,
  },
  comments:{
    type: String,
    default: "",
  },
  Suggestion:{
    type: String,
    default: "",
  }


});

const contact = User.discriminator("contact", contactInfo);
module.exports = contact;