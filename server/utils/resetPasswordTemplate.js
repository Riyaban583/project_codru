const resetPasswordTemplate = (userName, resetLink) => {
  const LOGO_URL = "https://res.cloudinary.com/da6jhcsmm/image/upload/v1772999280/logo_no_bg1_mfmk8x.png";

  return `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #f1f5f9;">
      
      <div style="background-color: #1765a4; padding: 40px 20px; text-align: center;">
        <img src="${LOGO_URL}" alt="Curious Team Learning" width="120" style="display: block; margin: 0 auto; width: 120px; height: auto;" />
      </div>

      <div style="padding: 40px; background-color: #ffffff; text-align: center;">
        <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 12px; font-weight: 800;">Reset Your Password</h1>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
          Hi <strong>${userName}</strong>,
        </p>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          We received a request to reset the password for your account. Click the button below to choose a new one.
        </p>

        <a href="${resetLink}" style="display: inline-block; background-color: #1765a4; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(23, 101, 164, 0.2);">
          Reset Password
        </a>

        <div style="margin-top: 40px; padding: 20px; background-color: #fffbeb; border-radius: 12px; border-left: 4px solid #f59e0b; text-align: left;">
          <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
            <strong>Security Note:</strong> This link will expire in 1 hour. If you did not request a password reset, please ignore this email or contact support if you have concerns about your account security.
          </p>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 30px; text-align: center;">
        <p style="color: #1765a4; font-size: 14px; font-weight: bold; margin: 0 0 5px 0;">Curious Team Learning Security</p>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Protecting your learning journey.<br>
          &copy; 2026 Curious Team.
        </p>
      </div>
    </div>
  `;
};

module.exports = { resetPasswordTemplate };