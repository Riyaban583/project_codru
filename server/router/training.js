const express = require("express");
const router = express.Router();
const contact = require("../models/trainingSchema"); // Ensure this path is correct
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const authenticate = require("../middleware/authenticate"); // Uncomment only if auth is required
const User = require("../models/userSchema");

router.use(cookieParser());
dotenv.config({ path: "./config.env" });

//for user details
router.get("/training", authenticate, async (req, res) => {
      try {
         // Get user ID from authenticated request
        const userId = req.userId; // Ensure this is set in your authenticate middleware
        console.log("User ID:", userId);
        if(!userId) {
          return res.status(400).json({ error: "User ID not found" });
        }
        const user = await User.findOne({ _id: userId });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        // console.log("User details:", user);
        const userDetails = {
          name: user.name,
          username: user.username, 
          email: user.email,
          phone: user.phone,
        };
        res.status(200).json(userDetails);
        // console.log("User details fetched:", user);
      }catch (error) {
        console.error("Error fetching user details:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
});


router.post("/training",authenticate, async (req, res) => {
  const username = req.user.username;
  const userEmail = req.user.email;
  const userPhone = req.user.phone; // Get username from authenticated request
  console.log("Authenticated username:", username,userEmail, userPhone);
  try {
    const {
      email,
      name,
      mobile,
      college,
      semester,
      year,
      courseName,
      startDate,
      endDate,
      feedback,
      improvement,
      duration,
    } = req.body;


    // OPTIONAL: Validate required fields
    if (
      !email ||
      !name ||
      !college ||
      !semester ||
      !year ||
      !courseName ||
      !startDate ||
      !endDate ||
      !feedback ||
      !improvement ||
      !duration||
      !mobile
    ) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

   // OPTIONAL: Use this if you're using authentication middleware
    const user_id = req.userId;

    const training = new contact({
      user_id, // Use this only if you're authenticating
      CollegeName: college,
      semester,
      year,
      trainingorCourse: courseName,
      startDate,
      endDate,
      comments: feedback,
      Suggestion: improvement,
    });
    
    await training.save();
    return res
      .status(201)
      .json({ message: "Training information saved successfully" });

  } catch (err) {
    console.error("Error in /training:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
