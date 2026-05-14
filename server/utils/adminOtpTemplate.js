const adminOtpTemplate = (otp, action, userName) => {
  const LOGO_URL = "https://res.cloudinary.com/da6jhcsmm/image/upload/v1772999280/logo_no_bg1_mfmk8x.png";

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 20px auto; border-radius: 16px; overflow: hidden; border: 1px solid #fca5a5; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
      
      <div style="background-color: #991b1b; padding: 20px; text-align: center;">
        <img src="${LOGO_URL}" alt="Logo" style="width: 100px; height: auto; margin-bottom: 10px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px;">Security Alert</h1>
      </div>

      <div style="padding: 40px; background-color: #ffffff; text-align: center;">
        <h2 style="color: #111827; font-size: 22px; margin-bottom: 16px;">Admin Privilege Toggle</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          A request has been made to perform the following action:<br>
          <strong style="color: #991b1b; font-size: 18px;">${action}</strong>
        </p>
        
        <div style="background-color: #fef2f2; border: 2px solid #fee2e2; border-radius: 12px; padding: 30px; display: inline-block;">
          <p style="margin: 0 0 10px 0; color: #991b1b; font-weight: bold; font-size: 12px; text-transform: uppercase;">Verification Code</p>
          <span style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #111827; font-family: 'Courier New', Courier, monospace; -webkit-user-select: all; user-select: all;">${otp}</span>
        </div>

        <div style="margin-top: 40px; padding: 20px; background-color: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; font-size: 13px; margin: 0; text-align: left;">
            <strong>WARNING:</strong> If you did not initiate this request, someone may be attempting to gain unauthorized access to the Admin Dashboard. Please investigate immediately.
          </p>
        </div>
      </div>

      <div style="background-color: #111827; padding: 20px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          Curious Team Learning • Internal Security System<br>
          &copy; 2026 Admin Control Panel
        </p>
      </div>
    </div>
  `;
};

module.exports = adminOtpTemplate;