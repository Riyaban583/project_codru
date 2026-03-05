const mongoose = require("mongoose");
require("dotenv").config();
const DB = process.env.DATABASE; // Use your MongoDB connection string
mongoose
  .connect(DB)
  .then(() => {
    console.log("Connection Successful! 🚀");
  })
  .catch((err) => console.log("Connection Error: 🚨", err));
