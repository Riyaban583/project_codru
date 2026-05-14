 // Ensure you have dotenv installed and configured correctly
import { useState, useEffect } from 'react';
import '../styles/ContactInfo.css'; // Import the CSS file
import Navbar from './Navbar';
import Footer from './Footer';

const ContactInfo = ({userData}) => {
  const getDetails = async() => {
    const backendurl = `${import.meta.env.VITE_API}`; // Fallback to localhost if VITE_API is not set
    const response = await fetch(`${backendurl}training`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${localStorage.getItem('Token')}`,
      },
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    } else {
      const data = await response.json();
      setUser({
        name:data.name,
        email: data.email,
       mobile: data.phone,
      });
    }
  }
  useEffect(() => {
    getDetails();
  }, []);
  
  
    const fetchUser=async(e)=>{
      e.preventDefault();
      const backendurl=`${import.meta.env.VITE_API}`; // Fallback to localhost if VITE_API is not set
      const data =await fetch(`${backendurl}training`,{
        method:"post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
        body: JSON.stringify(user),
      });
      if(!data.ok){
        throw new Error("Network response was not ok");
      }
      else{
        return await data.json();
      } 
    }
  const [user, setUser] = useState({
    name: '',
    email: '',
    college: '',
    mobile: '',
    semester: '',
    year: '',
    courseName: '',
    duration: '',
    startDate: '',
    endDate: '',
    feedback: '',
    improvement: '',
  });

  const handleInput = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   console.log(user);
  // };

  return (
    <>
    <Navbar userData={userData} setUserData={userData}/>
    <div className="form-container">
      <div className="form-card">
        <form
          onSubmit={(e) => {
            fetchUser(e);
          }}
          method="post"
          // onSubmit={handleSubmit}
          className="form"
        >
          <h1 className="form-title">
            Codru <span className="highlight">Education</span>
          </h1>

          {/* Input Groups */}
          <div className="input-section">
            <div className="input-row">
              <div className="input-group">
                <label>Name <span className="required">*</span></label>
                <input type="text" name="name"  value={user.name||""}  placeholder="Your name" />
              </div>
              <div className="input-group">
                <label>Email <span className="required">*</span></label>
                <input type="email" name="email"  value={user.email||""}  placeholder="you@example.com" />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>College/School Name <span className="required">*</span></label>
                <input type="text" name="college"  value={user.college} onChange={handleInput} />
              </div>
              <div className="input-group">
                <label>Mobile Number <span className="required">*</span></label>
                <input type="text" name="mobile"  value={user.mobile||" "}  />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Semester <span className="required">*</span></label>
                <input type="text" name="semester"  value={user.semester} onChange={handleInput} />
              </div>
              <div className="input-group">
                <label>Year of Passing <span className="required">*</span></label>
                <input type="text" name="year"  value={user.year} onChange={handleInput} />
              </div>
            </div>

            <div className="input-group">
              <label>Course/Internship Name <span className="required">*</span></label>
              <input type="text" name="courseName"  value={user.courseName} onChange={handleInput} />
            </div>

            <div className="input-group">
              <label>Duration <span className="required">*</span></label>
              <input type="text" name="duration"  value={user.duration} onChange={handleInput} />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Start Date <span className="required">*</span></label>
                <input type="date" name="startDate"  value={user.startDate} onChange={handleInput} />
              </div>
              <div className="input-group">
                <label>End Date <span className="required">*</span></label>
                <input type="date" name="endDate"  value={user.endDate} onChange={handleInput} />
              </div>
            </div>

            <div className="input-group">
              <label>Feedback <span className="required">*</span></label>
              <textarea name="feedback" rows="4"  value={user.feedback} onChange={handleInput} placeholder="Share your experience..." />
            </div>

            <div className="input-group">
              <label>Suggestions for Improvement <span className="required">*</span></label>
              <textarea name="improvement" rows="3"  value={user.improvement} onChange={handleInput} placeholder="Your suggestions..." />
            </div>
          </div>

          <div className="submit-button">
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>
    </div>
     <Footer/>
    </>
  );
};

export default ContactInfo;
