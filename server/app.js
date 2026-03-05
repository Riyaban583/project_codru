const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");
const { google } = require("googleapis");
const authenticate = require("./middleware/authenticate"); // Import it
const User = require("./models/userSchema");
const Student = require("./models/studentSchema");
const jwt = require("jsonwebtoken");



dotenv.config({ path: "./config.env" });
const app = express();

app.use(cors( {
  origin: "*",
  httpOnly: true,
  credentials: true,
}));
app.use(express.json());

const port = process.env.PORT || 8080;
// const HOST = "0.0.0.0";

app.use(express.json({ parameterLimit: "100000", limit: "500mb" }));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);


// app.use(express.static(path.join(__dirname, "public")));

require("./db/conn.js");
const Teacher = require("./models/teacherSchema");
const Contact = require("./models/contactSchema");
const ContactInfo = require("./models/trainingSchema");
const BotEnroll = require("./models/botEnrollSchema");
const Blog = require("./models/blogSchema");
const Course = require("./models/courseSchema");

app.use(require("./router/userauth.js"));
app.use(require("./router/blogauth.js"));
app.use(require("./router/courseauth.js"));
app.use(require("./router/training.js"));

let notifications = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);


// ==========================================
// GOOGLE CALENDAR API (SERVICE ACCOUNT)
// ==========================================
app.get("/calendar-events", async (req, res) => {
  try {
    // 1. Authenticate using the Service Account credentials from .env
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // The .replace() is crucial because .env files read line breaks literally as \n
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // 2. Fetch the events from the company calendar
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date().toISOString(), // Only show future events
      maxResults: 100, // Adjust this if you want more/less events
      singleEvents: true,
      orderBy: 'startTime',
    });

    // 3. Format the data perfectly for FullCalendar on your React frontend
    const formattedEvents = response.data.items.map(event => ({
      id: event.id,
      title: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      url: event.htmlLink,
    }));

    res.status(200).json(formattedEvents);
  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

app.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
  });
  res.redirect(url);
});

// Route to generate the Google OAuth URL
app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "Code missing from Google" });

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get(); 

    let user = await User.findOne({ email: data.email });

    if (!user) {
      let baseUsername = data.email.split('@')[0]; 
      
      // CRITICAL: Use 'new Student' so the database knows to allow admission details
      user = new Student({
        name: data.name,
        email: data.email,
        username: baseUsername,
        photo: data.picture,
        isEmailVerified: true
      });

      try {
        await user.save();
      } catch (saveError) {
        user.username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
        await user.save();
      }
    } else {
      user.photo = data.picture;
      await user.save();
    }

    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: "24h",
    });

    res.redirect(`http://localhost:5173/dashboard?token=${token}`);
    
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.redirect("http://localhost:5173/signin?error=auth_failed");
  }
});

app.post('/botenroll', async (req, res) => {
  const formData = req.body;

  // Validate required fields
  if (!formData.name || !formData.age || !formData.email || !formData.countryCode || !formData.phone || !formData.course || !formData.duration) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  try {
    // Save the form data to the database
    const newEnrollment = new BotEnroll({
      name: formData.name,
      age: formData.age,
      email: formData.email,
      countryCode: formData.countryCode,
      phone: formData.phone,
      course: formData.course,
      duration: formData.duration,
      idea: formData.idea, // Optional field
    });

    await newEnrollment.save(); // Save to the database
    console.log("Bot enrollment saved successfully");

    // Send an email notification
    const mailOptions = {
      from: process.env.EMAIL,
      replyTo: formData.email,
      to: process.env.EMAIL,
      subject: `Bot Enrollment Form Submission from ${formData.name}`,
      text: `
        New Enrollment in Robotics Course. Please check:

        Name: ${formData.name}
        Age: ${formData.age}
        Email: ${formData.email}
        CountryCode: ${formData.countryCode}
        Phone: ${formData.phone}
        Course: ${formData.course}
        Duration: ${formData.duration}
        Idea: ${formData.idea || "No additional message provided"}
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: "Error sending email notification" });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({ message: "Enrollment saved and email sent successfully" });
      }
    });
  } catch (error) {
    console.error("Error saving bot enrollment:", error);
    return res.status(500).json({ error: "Error saving bot enrollment" });
  }
});

app.post("/contactus", async (req, res) => {
  // Grab all fields, including the countryCode from your select dropdown
  const { email, name, city, phone, countryCode, message } = req.body;

  // Validate ALL required fields
  if (!email || !name || !message || !city || !phone || !countryCode) {
    return res.status(400).send("All fields are required");
  }

  try {
    // Save the contact form data to the database
    const newContact = new Contact({
      name: name,
      email: email,
      city: city,
      countryCode: countryCode, 
      phone: phone,
      message: message,
    });

    await newContact.save(); 
    console.log("Contact form saved successfully");

    const fullPhone = `${countryCode} ${phone}`;

    // Send an email notification
    const mailOptions = {
      from: process.env.EMAIL,
      replyTo: email,
      to: process.env.EMAIL,
      subject: `Contact form submission from ${name}`,
      text: ` 
        Name: ${name}
        Email: ${email}
        City: ${city}
        Phone: ${fullPhone}
        Message: ${message}
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).send("Error sending message");
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).send("Message sent successfully");
      }
    });
  } catch (err) {
    console.error("Error saving contact form:", err);
    // If the error is a validation error (like a bad phone number format), send a 400
    if (err.name === 'ValidationError') {
       return res.status(400).send(err.message);
    }
    return res.status(500).send("Error saving contact form");
  }
});

app.post("/notifications", async (req, res) => {
  try {
    const { usernames } = req.body;

    const users = await User.find({ username: { $in: usernames } });
    if (!users) {
      return res.json({ error: "Users not found" });
    }

    const userNotifications = {};
    for (const user of users) {
      userNotifications[user.username] = notifications[user.username] || [];
    }

    res.status(200).json(userNotifications);
  } catch (error) {
    console.error("Error finding users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/notifications/push", async (req, res) => {
  const { usernames, message } = req.body;

  try {
    const users = await User.find({ username: { $in: usernames } });
    if (!users) {
      return res.json({ error: "Users not found" });
    }
    for (const user of users) {
      if (!notifications[user.username]) {
        notifications[user.username] = [];
      }

      const newNotification = {
        message,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      };

      notifications[user.username].push(newNotification);

      // io.to(user.username).emit("notification", newNotification);
    }

    res.status(201).json({ message: "Notifications sent" });
  } catch (error) {
    console.error("Error finding users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/count", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const studentCount = await Student.countDocuments();
    const teacherCount = await Teacher.countDocuments();

    res.json({
      userCount: userCount,
      studentCount: studentCount,
      teacherCount: teacherCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error occurred" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find(
      {},
      {
        _id: 0,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        role: 1,
        photo: 1,
        isAdmin: 1,
      }
    ).lean(); //projection on these fields
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error occurred" });
  }
});

app.delete("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { role } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      console.log(role, username);
      return res.status(404).json({ error: "User doesn't exist." });
    }

    let deleted;
    if (role === "Student") {
      deleted = await Student.deleteOne({ username });
    } else if (role === "Teacher") {
      deleted = await Teacher.deleteOne({ username });
    } else {
      return res.status(403).json({ error: "Invalid role." });
    }

    if (deleted.deletedCount === 0) {
      return res.status(500).json({ error: "Failed to delete user." });
    }

    await User.deleteOne({ username });

    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/generate-otp-bro", async (req, res) => {
  try {
    const { username, isAdmin } = req.body;
    otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    otpTimestamp = Date.now();
    console.log(otpCode);
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const s = !isAdmin
      ? `granting admin privileges to ${user.name}`
      : `revoking ${user.name}'s admin privileges`;

    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.EMAIL,
      subject: "ALERT! Admin Toggle Request",
      text: `Hi there! You recently visited our website and asked for ${s}. Your OTP for verification is ${otpCode}.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).send({ message: "Failed to send OTP" });
      } else {
        res.status(200).send({ message: "OTP sent successfully" });
      }
    });
  } catch (error) {
    console.error("Error in OTP generation:", error);
    res.status(500).send({ message: "Server error" });
  }
});

app.post("/verify-bigbro", async (req, res) => {
  try {
    const { otp, username } = req.body;
    const currentTime = Date.now();
    const timeDifference = currentTime - otpTimestamp;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (parseInt(otp) === parseInt(otpCode) && timeDifference <= 60000) {
      user.isAdmin = !user.isAdmin;
      await user.save();
      res.status(200).send({ message: "SUCCESS", isAdmin: user.isAdmin });
    } else {
      res.status(401).send({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error in verification:", error);
    res.status(500).send({ message: "Server error" });
  }
});

app.put("/assignTask/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: "User doesn't exist." });
    }
    const student = await Student.findOneAndUpdate(
      { username: req.params.username },
      {
        $push: {
          tasks: {
            week: req.body.week,
            question: req.body.question,
            answer: req.body.answer,
            link: req.body.link,
          },
        },
      },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({ error: "Student not found." });
    }

    res.status(200).json({ message: "Task assigned successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/get-user-details", authenticate, (req, res) => {
  // req.user was already populated by your middleware!
  res.status(200).json({
    name: req.user.name,
    email: req.user.email,
    photo: req.user.photo,
    role: req.user.role,
    isAdmin: req.user.isAdmin
  });
});

app.put("/update-profile", authenticate, async (req, res) => {
  try {
    // We use findById so Mongoose knows this is a Student and allows the extra fields
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Apply the new data from the React frontend
    const updates = req.body;

    for (const key in updates) {
      if (key !== '_id' && key !== 'role' && key !== 'email') {
        user[key] = updates[key];
      }
    }

    // Save the fully updated student profile
    const updatedUser = await user.save();

    res.status(200).json({ message: "Profile updated successfully!", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.post("/get-tasks", authenticate, async (req, res) => {
  try {
    // IMPORTANT: Use req.userId (from middleware) instead of trusting the body
    const student = await Student.findOne({ _id: req.userId });

    if (!student) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(student.tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

const cleanupOldNotifications = () => {
  const oneDay = 24 * 60 * 60 * 1000;
  const now = Date.now().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

  for (const username in notifications) {
    notifications[username] = notifications[username].filter((notification) => {
      const notificationDate = new Date(notification.date).getTime();
      return now - notificationDate < oneDay;
    });

    if (notifications[username].length === 0) {
      delete notifications[username];
    }
  }
};

setInterval(cleanupOldNotifications, 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});

// Import your middleware if you haven't already at the top
// const authenticate = require("./middleware/authenticate");

app.get("/get-user-profile", authenticate, async (req, res) => {
  try {
    // req.user is the full document fetched by your authenticate middleware.
    // Because of discriminators, if they are a Student, this already contains 
    // fatherName, subjects, address, etc.
    
    // We send the entire user object back to React!
    res.status(200).json(req.user);
    
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// const server = app.listen(port, () => {
//   console.log(`Server is running on ${port}`);
// });

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type"],
//     credentials: true,
//   },
// });

// io.on("connection", (socket) => {
//   console.log("a user connected");

//   socket.on("join", (username) => {
//     if (!username) {
//       console.log("Received invalid username:", username);
//       return;
//     }
//     socket.join(username);
//     console.log(`${username} joined`);
//   });

//   socket.on("disconnect", () => {
//     console.log("user disconnected");
//   });
// });
