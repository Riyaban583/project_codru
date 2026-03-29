const nodemailer = require("nodemailer");

export default async function handler(req, res) {
  // 1. CORS & Method Check
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // 🚨 2. MICROSERVICE SECURITY (Crucial!)
  // Because this URL will be public, we need a secret password so hackers 
  // can't use your domain to send spam. 
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.MICROSERVICE_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized. Invalid API Key." });
  }

  const { name, email, countryCode, phone, html } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,       // Vercel allows this!
      secure: true,
      auth: {
        user: process.env.EMAIL,       
        pass: process.env.PASSWORD     
      }
    });

    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL}>`,
      to: process.env.EMAIL, // Sending to your admin inbox
      replyTo: email,
      subject: `📩 Enquiry from ${name} (${countryCode} ${phone})`,
      html: html 
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email delivered via Microservice!" });
    
  } catch (error) {
    console.error("Microservice Error:", error);
    res.status(500).json({ error: "Failed to send email." });
  }
}