const bulkEmailTemplate = (schoolName, designation, nameOfAddresse) => {
  // Gracefully handle the greeting
  const greetingName = nameOfAddresse 
    ? nameOfAddresse 
    : (designation ? designation : "Director");

  // Fallback for school name just in case the cell was empty
  const safeSchoolName = schoolName || "your institution";
  
  // 🚨 NEW: Logic for the formal address block
  const displayDesignation = designation ? designation : "Director / Principal";
  // If we have a name, format it with a line break. If not, return an empty string so there's no weird blank space.
  const nameBlock = nameOfAddresse ? `<strong>${nameOfAddresse}</strong><br />` : "";
  
  const LOGO_URL = "https://res.cloudinary.com/da6jhcsmm/image/upload/v1772999280/logo_no_bg1_mfmk8x.png";

  return `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
      
      <div style="background-color: #f8fafc; padding: 25px 20px; border-bottom: 3px solid #ed7f23; text-align: center;">
        <img src="${LOGO_URL}" alt="Curious Team Learning" width="120" style="display: block; margin: 0 auto; width: 120px; height: auto;" />
      </div>

      <div style="padding: 40px; background-color: #ffffff; color: #334155; font-size: 15px; line-height: 1.6;">
        
        <div style="margin-bottom: 30px; font-size: 14px; color: #475569; line-height: 1.5;">
          To,<br />
          ${nameBlock}
          <strong>${displayDesignation}</strong><br />
          ${safeSchoolName}
        </div>
        
        <p style="margin-top: 0;">Dear <strong>${greetingName}</strong>,</p>
        
        <p>I am Lavish Sharma, Co-Founder of Curious Team Learning Pvt. Ltd., Kota.</p>
        
        <p>In the past few years, I observed a problem: traditional offline schools struggle to provide seamless online education to children and are losing admissions due to the growing trend of online schools.</p>
        
        <p>Additionally, the government has issued temporary guidelines which can become permanent that ask people to work from home during the current economic conditions, which also might soon change how children receive education similar to the conditions during the pandemic.</p>
        
        <p>This proposal is to provide physical/traditional offline schools with a system like <strong>${safeSchoolName}'s</strong> that enables you to run the online schools without building new infrastructure, giving you the flexibility to accept additional admissions throughout the academic year.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #1765a4; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #1e293b;">
            <strong>Curious Team Education System (CuTeES)</strong> is a complete Hybrid & Online Schooling Infrastructure. It’s a system to run a <strong>"Parallel Online School"</strong> alongside your physical campus, providing you with the efficiency to run both modes of schooling seamlessly and simultaneously.
          </p>
        </div>
        
        <p>I have attached a <strong>Partnership Proposal</strong> detailing the financials, the hardware setup, and how we handle the entire tech backend, so your management doesn't have to.</p>
        
        <p>Additionally, in <strong>Section – 6</strong>, I have mapped out the exact financial projection showing how this model can generate an additional <strong style="color: #ed7f23;">₹1 Cr.+ in annual net revenue</strong> for <strong>${safeSchoolName}</strong> with near-zero physical overhead.</p>
        
        <p>If you are open to exploring how this could work for your institute, simply reply to this email and I would be happy to arrange a brief meeting to discuss a customized setup tailored exactly to your current infrastructure.</p>
        
        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="margin: 0; color: #1e293b;">Warm regards,</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; color: #1765a4;"><strong>Lavish Sharma</strong></p>
          <p style="margin: 2px 0 15px 0; font-size: 14px; color: #64748b;">Co-Founder,<br />Curious Team Learning.</p>
          
          <p style="margin: 0;">
            <a href="https://curiousteamlearning.com/about-school-learning" style="display: inline-block; background-color: #1765a4; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
              Click here to explore CuTeES details online
            </a>
          </p>
          <p style="margin: 15px 0 0 0; font-size: 13px; color: #94a3b8;">
            Direct Line: <strong>+91 73001 99100</strong>
          </p>
        </div>

      </div>
    </div>
  `;
};

module.exports = { bulkEmailTemplate };