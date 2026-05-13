const express = require("express");
const router = express.Router();
const contact = require("../models/trainingSchema"); // Ensure this path is correct
const dotenv = require("dotenv");
const platformAudit = require("../models/platformAuditSchema");
const cookieParser = require("cookie-parser");
const authenticate = require("../middleware/authenticate"); // Uncomment only if auth is required
const User = require("../models/userSchema");
const multer = require('multer');
const { plantformAuditTemplate } = require("../utils/platformAuditTemplate");
const transporter = require('../utils/transporter'); 
const { bulkEmailTemplate } = require("../utils/bulkEmailTemplate");
const path = require('path');
const fs = require('fs');

const upload = multer({ storage: multer.memoryStorage() });
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


router.post("/b2b-lead", async (req, res) => {
  try {
    // 1. Extract the exact fields from your frontend form
    // (Removed 'subject', added 'countryCode' and 'phone')
    const { contactName, contactPhone, schoolName, studentCount} = req.body;

    // 2. Validate all required fields based on your Schema
    if (!contactName || !contactPhone || !schoolName || !studentCount) {
      return res.status(400).json({ error: "Please fill in all required fields." });
    }

    // 3. Save to MongoDB First
    const newEnquiry = new platformAudit({
        contactName,
        contactPhone, 
        schoolName,
        studentCount,
       
    });
    
    await newEnquiry.save(); 

    // 4. Prepare HTML for the Email
    // Since 'subject' is gone, we just pass a hardcoded title to your template
    const emailTitle = "New Website Enquiry"; 
    const supportEmailHtml = plantformAuditTemplate(contactName, contactPhone, schoolName, studentCount);

    // 5. Send Email to Admin/Support Team
    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.EMAIL, 
      
      // Added the phone number to the email subject line so you see it instantly!
      subject: `📩 Enquiry from ${contactPhone})`,
      html: supportEmailHtml
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) console.error("Contact Email Error:", error);
    });

    // 6. Notify All Admins (In-App + Real-time)
    try {
      const admins = await User.find({ isAdmin: true });
      
      const notifyPromises = admins.map((admin) => 
        sendAutoNotification(
          req.app, 
          admin._id, 
          `📩 New Website Enquiry from ${contactName}`, 
          "admin/messages", 
          name 
        )
      );
      
      await Promise.all(notifyPromises);
    } catch (err) {
      console.error("Admin Notification Error:", err);
    }

    res.status(200).json({ success: true, message: "Your message has been sent and saved!" });
  } catch (error) {
    console.error("Contact Form Error:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
});

// router.post("/send-bulk", async (req, res) => {
//   try {
//     // 1. Extract the data sent from React
//     const { recipientsData } = req.body;

//     // 2. Validate that we actually received an array of data
//     if (!recipientsData || !Array.isArray(recipientsData)) {
//       return res.status(400).json({ error: "Invalid data received. Expected an array of schools." });
//     }

//     console.log(`Backend received ${recipientsData.length} schools to process.`);

//     // 3. Loop through the array and send an email to each school
//     const emailPromises = recipientsData.map(async (school) => {
      
//       // Generate the HTML using your imported template
//       const emailHtml = bulkEmailTemplate(
//         school.schoolName, 
//         school.designationOfAddressee, 
//         school.nameOfAddresse
//       );

//       // Construct the Mail Options object
//       const mailOptions = {
//         from: process.env.EMAIL,
//         to: school.emailIds.join(", "), // Joins multiple emails with a comma
//         subject: `Scaling ${school.schoolName}'s admissions without new infrastructure`,
//         html: emailHtml
//       };

//       // Send the email using your existing Vercel transporter setup
//       return transporter.sendMail(mailOptions);
//     });

//     // 4. Wait for all emails to finish sending
//     await Promise.all(emailPromises);

//     // 5. Send a SUCCESS JSON response back to React! 
//     res.status(200).json({ message: `Successfully dispatched emails to ${recipientsData.length} schools.` });

//   } catch (error) {
//     console.error("Backend Bulk Email Error:", error);
//     // Send a FAILURE JSON response back to React
//     res.status(500).json({ error: "Failed to send bulk emails from the server." });
//   }
// });

router.post("/send-bulk", async (req, res) => {
  try {
    const { recipientsData } = req.body;

    if (!recipientsData || !Array.isArray(recipientsData)) {
      return res.status(400).json({ error: "Invalid data received. Expected an array of schools." });
    }

    // ----------------------------------------------------------------------
    // 🚨 1. READ THE PDF FILE AND CONVERT TO BASE64
    // We do this ONCE before the loop so we don't crash the server reading 
    // the same file 100 times.
    // ----------------------------------------------------------------------
    let pdfAttachmentBase64 = "";
    try {
      // Construct the absolute path to your PDF
      // This tells Node: "Go up one folder from 'routes', then into 'public', then 'pdf'"
      const pdfPath = path.join(__dirname, "..", "public", "pdf", "sample_pdf.pdf");
      
      // Read file and encode to base64 so it can travel securely to Vercel
      pdfAttachmentBase64 = fs.readFileSync(pdfPath).toString("base64");
    } catch (err) {
      console.error("Could not find or read the PDF file:", err);
      return res.status(500).json({ error: "Server error: Partnership Proposal PDF is missing." });
    }
    // ----------------------------------------------------------------------

    console.log(`Backend received ${recipientsData.length} schools to process.`);

    const emailPromises = recipientsData.map(async (school) => {
      
      const emailHtml = bulkEmailTemplate(
        school.schoolName, 
        school.designationOfAddressee, 
        school.nameOfAddresse
      );

      const mailOptions = {
        from: process.env.EMAIL,
        
        to: school.emailIds.join(", "),
        subject: `Scaling ${school.schoolName}'s admissions without new infrastructure`,
        html: emailHtml,
        // 🚨 2. ADD THE ATTACHMENT HERE
        attachments: [
          {
            filename: "Partnership_Proposal.pdf", // This is the name the recipient will see
            content: pdfAttachmentBase64,         // The encoded file data
            encoding: "base64"
          }
        ]
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);

    res.status(200).json({ message: `Successfully dispatched emails to ${recipientsData.length} schools with attachments.` });

  } catch (error) {
    console.error("Backend Bulk Email Error:", error);
    res.status(500).json({ error: "Failed to send bulk emails from the server." });
  }
});



module.exports = router;
