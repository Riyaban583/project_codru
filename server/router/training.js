const express = require("express");
const router = express.Router();
const contact = require("../models/contactInfoSchema");
const User = require("../models/userSchema");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const authenticate = require("../middleware/authenticate");

router.use(cookieParser());
dotenv.config({ path: "./config.env" });

router.post("/training",authenticate, async (req, res) => {
   const { email,name,college, semester, year, courseName, startDate,
    endDate,
    feedback,
    improvement,duration } = req.body;
    const user_id =req.userId;
    const training = new contact({
      user_id,
      email,
      name,
      college,
      semester,
      year,
      courseName,
      startDate,
      endDate,
      feedback,
      improvement,
      duration,
    });
    await training.save();
    res.status(201).json({ message: "Training information saved successfully" });
   
});
module.exports = router;