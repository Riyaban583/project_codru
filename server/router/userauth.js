const bcrypt = require("bcrypt");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const router = express.Router();
const dotenv = require("dotenv");
// dotenv.config({ path: "./config.env" });
dotenv.config();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
router.use(express.json());
router.use(bodyParser.json());
router.use(express.urlencoded({ extended: true }));
router.use(cookieParser());
const User = require("../models/userSchema");
const Student = require("../models/studentSchema");
const Teacher = require("../models/teacherSchema");
const authenticate = require("../middleware/authenticate");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

// Registration route
router.post("/register", async (req, res) => {
  const {
    photo,
    name,
    username,
    email,
    password,
    cpassword,
    dob,
    phone,
    declaration,
    role,
    ...rest
  } = req.body;

  if (!name || !email || !password || !cpassword || !username || !declaration) {
    return res.status(400).json({ error: "Empty field(s)." });
  }

  try {
    const usernameExist = await User.findOne({ username });

    if (usernameExist) {
      return res.status(401).json({ error: "User already exists." });
    } else if (password !== cpassword) {
      return res.status(402).json({ error: "Passwords didn't match." });
    } else {
      let user;
      if (role === "Student") {
        user = new Student({
          photo,
          name,
          username,
          email,
          password,
          dob,
          phone,
          declaration,
          ...rest,
        });
      } else if (role === "Teacher") {
        user = new Teacher({
          photo,
          name,
          username,
          email,
          password,
          dob,
          phone,
          declaration,
          ...rest,
        });
      } else {
        user = new User({
          photo,
          name,
          username,
          email,
          password,
          dob,
          phone,
          declaration,
          ...rest,
        });
      }

      await user.save();
      const token = jwt.sign(
        { _id: user._id, username: user.username, role: user.role },
        process.env.TOKEN_SECRET,
        { expiresIn: "14d" }
      );
      res.status(201).json({ message: "Registration successful", token });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Signin route
router.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Empty field(s)" });
    }

    const user = await User.findOne({ username }).select("+password");

    if (user) {
      const isMatched = await bcrypt.compare(password, user.password);

      if (!isMatched) {
        return res.status(400).json({ error: "Wrong Credentials" });
      }

      const token = jwt.sign(
        {
          _id: user._id,
          username: user.username,
          role: user.role,
          isAdmin: user.isAdmin,
        },
        process.env.TOKEN_SECRET,
        { expiresIn: "14d" }
      );

      const options = {
        expires: new Date(Date.now() + (process.env.COOKIEEXPIRE|| 24 * 60 * 60 * 1000)), // Default to 20 days if not set
        httpOnly: true,
      };

      res.status(200).cookie("token", token, options).json({
        message: "You are in",
        role: user.role,
        username: user.username,
        token,
        photo: user.photo,
        name: user.name,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(400).json({ error: "Wrong Credentials" });
    }
  } catch (err) {
    console.error("Sign In Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST route for admission form submission
router.post("/admission/:username", async (req, res) => {
  const username = req.params.username;
  try {
    const {
      name,
      email,
      dob,
      address,
      userphoto,
      usersign,
      userparentsign,
      gender,
      phone,
      altphone,
      adddeclaration,
      classorsem,
      chosensubs,
      schoolorcollege,
      semorclg,
      fatherName,
      fatherOcc,
      motherName,
      motherOcc,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !dob ||
      !address ||
      !gender ||
      !phone ||
      (classorsem === "13" && !semorclg) ||
      !adddeclaration ||
      !classorsem ||
      !chosensubs.length ||
      !schoolorcollege ||
      !fatherName ||
      !fatherOcc ||
      !motherName ||
      !motherOcc
    ) {
      return res.status(400).json({ error: "Empty field(s) or invalid data." });
    }

    // Check if the student already exists
    let existingStudent = await User.findOne({ username });

    if (existingStudent) {
      // Update existing student record
      existingStudent.email = email;
      existingStudent.dob = dob;
      existingStudent.address = address;
      existingStudent.userphoto = userphoto;
      existingStudent.usersign = usersign;
      existingStudent.userparentsign = userparentsign;
      existingStudent.gender = gender;
      existingStudent.phone = phone;
      existingStudent.altphone = altphone;
      existingStudent.adddeclaration = adddeclaration;
      existingStudent.classorsem = classorsem;
      existingStudent.chosensubs = chosensubs;
      existingStudent.schoolorcollege = schoolorcollege;
      existingStudent.semorclg = semorclg;
      existingStudent.fatherName = fatherName;
      existingStudent.fatherOcc = fatherOcc;
      existingStudent.motherName = motherName;
      existingStudent.motherOcc = motherOcc;

      await existingStudent.save();
      return res
        .status(200)
        .json({ message: "Student record updated successfully" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET student data by username
// router.get("/students/:username", async (req, res) => {
//   const username = req.params.username;

//   try {
//     // Find student by username in the database
//     const student = await User.findOne({ username, role: "Student" });

//     if (!student) {
//       return res.status(404).json({ error: "Student not found" });
//     }

//     res.status(200).json(student);
//   } catch (error) {
//     console.error("Error fetching student:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// Change password route
router.post("/change-password", async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "Empty field(s)" });
    }

    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatched = await bcrypt.compare(currentPassword, user.password);
    if (!isMatched) {
      return res.status(400).json({ error: "Wrong current password" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Reset password request route
router.post("/reset-password", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Empty field(s)" });
    }

    let user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: "1h",
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Password Reset",
      text: `You requested for password reset. Please use the following link to reset your password: http://localhost:5173/forgot-password/${token}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Failed to send email:", error);
        return res.status(500).json({ error: "Failed to send email" });
      }
      res
        .status(200)
        .json({ message: "Password reset link sent to your email" });
    });
  } catch (error) {
    console.error("Server error during password reset request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Reset password confirmation route
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const userId = decoded.userId;

    let user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Server error during password reset:", error);
    res.status(500).json({ error: "Server error" });
  }
});

let otpCode;
let otpTimestamp;

// Generate OTP route
router.post("/generate-otp", (req, res) => {
  const { email } = req.body;
  otpCode = Math.floor(1000 + Math.random() * 9000).toString();
  otpTimestamp = Date.now();

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Email Verification",
    text: `Hi there! You have recently visited our website and entered your email. Your OTP code for email verification is ${otpCode}.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      res.status(500).send({ message: "Failed to send OTP" });
    } else {
      res.status(200).send({ message: "OTP sent successfully" });
    }
  });
});

// Verify OTP route
router.post("/verify-email", (req, res) => {
  const { otp } = req.body;
  const currentTime = Date.now();
  const timeDifference = currentTime - otpTimestamp;

  if (parseInt(otp) === parseInt(otpCode) && timeDifference <= 60000) {
    res.status(200).send({ message: "Verification successful" });
  } else {
    res.status(401).send({ message: "Invalid OTP" });
  }
});

// Profile edit route
router.post("/profile-edit", async (req, res) => {
  try {
    const { username, phone, altphone, address, photo } = req.body;

    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    user.photo = photo || user.photo;
    user.phone = phone || user.phone;
    user.altphone = altphone || user.altphone;
    user.address = address || user.address;

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Profile retrieval route
router.get("/profile",authenticate,async (req, res) => {
  try {
    const username = req.username; // Get username from authenticated user
    let user = await User.findOne({ username }).populate({
      path: "blogs followers following", 
    });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Profile retrieved", user });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

//userlist for sending follow request
router.get("/userlist", authenticate, async (req, res) => {
  try {
    const users = await User.find().select("_id username name ");
    res.status(200).json({success:true, message:" users fatches successfully",users});
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Follow user route
router.post("/follow/:userid",authenticate, async (req, res) => {
  const targetId = req.params.userid;
  const currentUserId = req.userId; // Get current user ID from authenticated request
  try {
    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.followers.some(follower => follower._id.equals(currentUserId))) {
      return res.status(400).json({ error: "You are already following this user" });
    }else if (targetUser._id.equals(currentUser._id)) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }
    else{
      targetUser.followers.push({
        _id: currentUser._id,
        username: currentUser.username,
        name: currentUser.name,
        // photo: currentUser.photo,
      });
      currentUser.following.push({
        _id: targetUser._id,
        username: targetUser.username,
        name: targetUser.name,
        // photo: targetUser.photo,
      });

      await targetUser.save();
      await currentUser.save();

      res.status(200).json({ message: "Followed successfully" });
    }
}
  catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Unfollow user route
router.post("/unfollow/:userid", authenticate, async (req, res) => {
  const targetId = req.params.userid;
  const currentUserId = req.userId; // Get current user ID from authenticated request
  try {
    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!targetUser.followers.some(follower => follower._id.equals(currentUserId))) {
      return res.status(400).json({ error: "You are not following this user" });
    }

    targetUser.followers = targetUser.followers.filter(follower => !follower._id.equals(currentUserId));
    currentUser.following = currentUser.following.filter(following => !following._id.equals(targetId));

    await targetUser.save();
    await currentUser.save();

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Sign out route
router.post("/signout", (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Signed out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//gapi
router.get("", (req, res) => {
  try {
  } catch (error) {}
});

// Route to get a user's public profile
router.get("/profile/:username", authenticate,async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).populate({
      path: "followers following blogs",
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/checkfollowing",authenticate, async (req, res) => {
  const { currentUsername, targetUsername } = req.body;
  try {
    // Find the target user by username
    const targetUser = await User.findOne({ username: targetUsername });

    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "Target user not found" });
    }

    // Check if the current user is following the target user
    const isFollowing = targetUser.followers.some(
      (follower) => follower.username === currentUsername
    );
    if (isFollowing) {
      res.status(200).json({
        success: true,
        following: true,
      });
    }else{
      res.status(200).json({
        success: true,
        following: false,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
