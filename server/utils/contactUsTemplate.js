const contactUsTemplate = (userName, userEmail, subject, message) => {
  const LOGO_URL = "https://res.cloudinary.com/da6jhcsmm/image/upload/v1772999280/logo_no_bg1_mfmk8x.png";

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 20px auto; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #f1f5f9;">
      
      <div style="background-color: #1765a4; padding: 40px 20px; text-align: center;">
        <img src="${LOGO_URL}" alt="Logo" width="100" style="margin-bottom: 10px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">New Support Message</h1>
      </div>

      <div style="padding: 40px; background-color: #ffffff;">
        <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Message Details</h2>
        
        <p style="margin: 10px 0;"><strong style="color: #64748b;">From:</strong> ${userName} (${userEmail})</p>
        <p style="margin: 10px 0;"><strong style="color: #64748b;">Subject:</strong> ${subject}</p>
        
        <div style="margin-top: 25px; padding: 20px; background-color: #f8fafc; border-radius: 12px; color: #334155; line-height: 1.6; font-style: italic;">
          "${message}"
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <a href="mailto:${userEmail}" style="background-color: #1765a4; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Reply to User
          </a>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 20px; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Curious Team Learning Support Portal<br>
          &copy; 2026 Curious Team
        </p>
      </div>
    </div>
  `;
};