const nodemailer = require("nodemailer");

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.MICROSERVICE_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized. Invalid API Key." });
  }

  // 🚨 Now it just accepts the raw mailOptions object from your Render backend!
  const { mailOptions } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,       
        pass: process.env.PASSWORD     
      }
    });

    // Vercel plugs your exact mailOptions directly into the real Nodemailer
    const info = await transporter.sendMail(mailOptions);
    
    res.status(200).json({ success: true, info });
  } catch (error) {
    console.error("Microservice Error:", error);
    res.status(500).json({ error: "Failed to send email." });
  }
}