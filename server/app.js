const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");

dotenv.config({ path: "./config.env" });
const app = express();

app.use(cors());
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
const User = require("./models/userSchema");
const Student = require("./models/studentSchema");
const Teacher = require("./models/teacherSchema");
const Contact = require("./models/contactSchema");
const ContactInfo = require("./models/contactInfoSchema");
const BotEnroll = require("./models/botEnrollSchema");

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
        Message: ${formData.idea || "No additional message provided"}
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
  const { email, name, city, phone, message } = req.body;

  // Validate required fields
  if (!email || !name || !message || !city || !phone) {
    return res.status(400).send("All fields are required");
  }

  try {
    // Save the contact form data to the database
    const newContact = new Contact({
      name: name,
      email: email,
      city: city,
      phone: phone,
      message: message,
    });

    await newContact.save(); // Save to the database
    console.log("Contact form saved successfully");

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
        Phone: ${phone}
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
    return res.status(500).send("Error saving contact form");
  }
});

app.get("/", (req, res) => {
  res.send("Hello there!");
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

app.post("/get-tasks", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const student = await Student.findOne({ username });

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
