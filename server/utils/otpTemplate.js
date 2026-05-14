const otpTemplate = (otp) => {
  const LOGO_URL = "https://res.cloudinary.com/da6jhcsmm/image/upload/v1772999280/logo_no_bg1_mfmk8x.png"; 

  return `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #f1f5f9;">
      
      <div style="background-color: #ed7f23; padding: 50px 20px; text-align: center;">
        <img src="${LOGO_URL}" 
            alt="Curious Team Learning" 
            width="140" 
            style="display: block; margin: 0 auto; border: 0; width: 140px; max-width: 140px; height: auto;" 
        />
      </div>

      <div style="padding: 40px; background-color: #ffffff; text-align: center;">
        <h2 style="color: #1765a4; font-size: 24px; margin-bottom: 12px; font-weight: 800;">Verify Your Account</h2>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 40px;">
          Welcome to the team! Use the secure verification code below to complete your registration.
        </p>
        
        <div style="cursor: pointer; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 30px; display: inline-block; transition: all 0.3s ease;">
          <span style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #ed7f23; font-family: 'Courier New', Courier, monospace; -webkit-user-select: all; user-select: all;">${otp}</span>
          <div style="margin-top: 15px; color: #1765a4; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
            Click to select & copy
          </div>
        </div>

        <p style="color: #94a3b8; font-size: 13px; margin-top: 40px;">
          This code will expire in 10 minutes for your security.<br>
          If you didn't request this, please ignore this email.
        </p>
      </div>

      <div style="background-color: #f1f5f9; padding: 30px; text-align: center;">
        <p style="color: #1765a4; font-size: 15px; font-weight: bold; margin: 0 0 5px 0;">
          Curious Team Learning
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Empowering education with empathy. <br>
          &copy; 2026 Curious Team. All rights reserved.
        </p>
      </div>
    </div>
  `;
};

module.exports = otpTemplate;