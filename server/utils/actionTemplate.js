const actionTemplate = (userName, title, description, statusColor = "#1765a4") => {
  const LOGO_URL = "https://res.cloudinary.com/da6jhcsmm/image/upload/v1772999280/logo_no_bg1_mfmk8x.png";

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 20px auto; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #f1f5f9;">
      <div style="background-color: ${statusColor}; padding: 40px 20px; text-align: center;">
        <img src="${LOGO_URL}" alt="Logo" width="120" style="margin-bottom: 10px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">${title}</h1>
      </div>

      <div style="padding: 40px; background-color: #ffffff; text-align: left;">
        <h2 style="color: #111827; font-size: 22px; margin-bottom: 16px;">Hello, ${userName}!</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          ${description}
        </p>
        
        <div style="text-align: center; margin-top: 40px;">
          <a href="https://yourdomain.com/dashboard" style="background-color: ${statusColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">
            Open Your Dashboard
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 20px; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Curious Team Learning • Personalized Education<br>
          &copy; 2026 Curious Team
        </p>
      </div>
    </div>
  `;
};

module.exports = actionTemplate;