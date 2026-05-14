// Change the parameters to accept countryCode and phone instead of subject
const plantformAuditTemplate = (contactName, contactPhone, schoolName, studentCount) => {
  const LOGO_URL = "https://res.cloudinary.com/da6jhcsmm/image/upload/v1772999280/logo_no_bg1_mfmk8x.png";

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 20px auto; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #f1f5f9;">
      
      <div style="background-color: #1765a4; padding: 40px 20px; text-align: center;">
        <img src="${LOGO_URL}" alt="Logo" width="100" style="margin-bottom: 10px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">New Website Enquiry</h1>
      </div>

      <div style="padding: 40px; background-color: #ffffff;">
        <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Lead Details</h2>
        
        <p style="margin: 10px 0;"><strong style="color: #64748b;">Contact Name:</strong> ${contactName}</p>
        <p style="margin: 10px 0;"><strong style="color: #64748b;">Contact Phone No.:</strong> ${contactPhone}</p>
        <p style="margin: 10px 0;"><strong style="color: #64748b;">School Name:</strong> ${schoolName}</p>
        <p style="margin: 10px 0;"><strong style="color: #64748b;">Student Count:</strong> ${studentCount}</p>
        
        

        <div style="text-align: center; margin-top: 40px;">
          
          <a href="https://wa.me/${contactPhone}" style="background-color: #25D366; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Chat on WhatsApp
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

// 🚨 CRITICAL: You MUST export it so other files can read it as a function!
module.exports = { plantformAuditTemplate };