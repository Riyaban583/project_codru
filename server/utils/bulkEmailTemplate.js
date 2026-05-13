const bulkEmailTemplate = (schoolName, designation, nameOfAddresse) => {
  // Gracefully handle the greeting. If we have a name, use it. If not, use the designation. If neither, use "Director".
  const greetingName = nameOfAddresse 
    ? nameOfAddresse 
    : (designation ? designation : "Director");

  // Fallback for school name just in case the cell was empty
  const safeSchoolName = schoolName || "your institution";

  return `
    <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px;">
      
      <p>Dear ${greetingName},</p>
      
      <p>My name is Lavish Sharma, Co-Founder of Curious Team Learning, Kota.</p>
      
      <p>We are in a time where the government has issued mandatory guidelines for schools to function online during weather conditions, pandemic, etc. in the past. According to recent news, the government has asked people to work from home due to current economic conditions, which might soon bring change in the way children receive education. With the growing trend of online schools, traditional offline schools lack the infrastructure to keep up with the advancement and lose admissions in the process.</p>
      
      <p>Children and parents are choosing convenience, and this is where our system helps you. We have built a system to help physical/traditional offline schools run their online schools without building new infrastructure, seamlessly.</p>
      
      <p>We have developed the <strong>Curious Team Education System (CuTeES)</strong>; a complete Hybrid & Online Schooling Infrastructure. We allow schools like <strong>${safeSchoolName}</strong> to run a <strong>"Parallel Online School"</strong> alongside your physical campus. Schools and children can switch the mode of schooling seamlessly and efficiently. Moreover, new children can enroll whose determining factor is distance, parents getting transferred quite frequently, or who cannot afford expensive schooling.</p>
      
      <p>Here is how we do it without burdening your management:</p>
      
      <ul style="margin-top: 0; padding-left: 20px;">
        <li style="margin-bottom: 10px;"><strong>Zero-Friction Hybrid Classes:</strong> We equip your teachers with a Laptop and Tablet. They teach on the smart board as usual, while our system automatically live-streams and records the class to a secure cloud for your online and absentee students with the help of our app.</li>
        <li style="margin-bottom: 10px;"><strong>Skill-Lab Kits at Home:</strong> We ship physical science and robotics kits directly to your students' homes, so online students still get practical, offline learning by using our app.</li>
        <li style="margin-bottom: 10px;"><strong>Complete Digital Growth:</strong> We provide a dedicated content strategist to manage your social media and actually drive those online admissions to your school, assuring you an ROI.</li>
      </ul>
      
      <p>I have attached a <strong>Partnership Proposal</strong> detailing the financials, the hardware setup, and how we handle the entire tech backend, so your management doesn't have to.</p>
      
      <p>Additionally, in Section – 5, I have mapped out the exact financial projection showing how this model can generate an additional <strong>₹1 Cr.+ in annual net revenue</strong> for <strong>${safeSchoolName}</strong> with near-zero physical overhead.</p>
      
      <p>If you are open to exploring how this could work for your institute, simply reply to this email. I would be happy to arrange a brief meeting to discuss a customized setup tailored exactly to your current infrastructure.</p>
      
      <br />
      <p style="margin: 0;">Warm regards,</p>
      <p style="margin: 5px 0 0 0;"><strong>Lavish Sharma</strong></p>
      <p style="margin: 0; font-size: 14px; color: #555;">Co-Founder,<br />Curious Team Learning.</p>
      <p style="margin: 5px 0 0 0; font-size: 14px;">
        <a href="https://curiousteamlearning.com/about-school-learning" style="color: #34A853; text-decoration: none;">curiousteamlearning.com/about-school-learning</a> | +91 73001 99100
      </p>
      
    </div>
  `;
};

module.exports = { bulkEmailTemplate };