const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // Removes extra spaces
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true, // Converts email to lowercase
    match: [/.+@.+\..+/, "Please enter a valid email address"], // Email validation
  },
  countryCode: {
    type: String,
    required: true,
    match: [/^\+\d{1,4}$/, "Please enter a valid country code"], // Country code validation (e.g., +91, +1)
  },
  phone: {
    type: String,
    required: true,
    match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"], // Phone number validation
  },
  city: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically sets the current date and time
  },
});


const Enquiry = mongoose.model("Enquiry", enquirySchema);

module.exports = Enquiry;