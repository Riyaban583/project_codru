const welcomeTemplate = (userName) => {
  const LOGO_URL = "https://res.cloudinary.com/da6jhcsmm/image/upload/v1772999280/logo_no_bg1_mfmk8x.png";

  return `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #f1f5f9;">
      
      <div style="background-color: #ed7f23; padding: 40px 20px; text-align: center;">
        <img src="${LOGO_URL}" alt="Curious Team Learning" width="140" style="display: block; margin: 0 auto; width: 140px; height: auto;" />
      </div>

      <div style="padding: 40px; background-color: #ffffff; text-align: center;">
        <h1 style="color: #1765a4; font-size: 28px; margin-bottom: 12px; font-weight: 800;">Welcome to the Family! 🚀</h1>
        <p style="color: #64748b; font-size: 18px; line-height: 1.6; margin-bottom: 10px;">
          Hi <strong>${userName}</strong>,
        </p>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          We are thrilled to have you join <strong>Curious Team Learning</strong>. Your account is now active and ready for action.
        </p>

        <div style="text-align: left; background-color: #f8fafc; border-radius: 16px; padding: 25px; margin-bottom: 30px;">
          <p style="color: #1765a4; font-weight: bold; margin-top: 0;">What's next for you?</p>
          <ul style="color: #475569; font-size: 14px; line-height: 2; padding-left: 20px;">
            <li>🎯 Complete your profile to get personalized suggestions.</li>
            <li>📚 Explore courses and track your syllabus progress.</li>
            <li>🤝 Connect with mentors and verified staff.</li>
            <li>🙋‍♂️ Raise doubts and get real-time support.</li>
          </ul>
        </div>

        <a href="https://yourdomain.com/login" style="display: inline-block; background-color: #ed7f23; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(237, 127, 35, 0.2);">
          Get Started Now
        </a>

        <p style="color: #94a3b8; font-size: 13px; margin-top: 40px;">
          If you didn't create this account, please ignore this email or contact support.
        </p>
      </div>

      <div style="background-color: #f1f5f9; padding: 30px; text-align: center;">
        <p style="color: #1765a4; font-size: 15px; font-weight: bold; margin: 0 0 5px 0;">Curious Team Learning</p>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Empowering education with empathy.<br>
          &copy; 2026 Curious Team. All rights reserved.
        </p>
      </div>
    </div>
  `;
};

module.exports = welcomeTemplate;