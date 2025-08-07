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

  year: {
    type: String,
    default: "",
  },
  //trainingorCourse: 
  trainingorCourse: {
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

const contact = mongoose.model("Training", contactInfo);
module.exports = contact;