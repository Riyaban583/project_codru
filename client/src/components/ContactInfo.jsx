import { useState } from 'react';
import '../styles/ContactInfo.css'; // Import the CSS file
import Navbar from './Navbar';
import Footer from './Footer';

const ContactInfo = () => {
  
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
    <Navbar/>
    <div className="form-container">
      <div className="form-card">
        <form
          action="/CourseRegistration"
          method="post"
          // onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="form"
        >
          <h1 className="form-title">
            Codru <span className="highlight">Education</span>
          </h1>

          {/* Profile Image Upload */}
          <div className="profile-section">
            <img
              src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
              alt="profile"
              className="profile-image"
            />
            <input type="file" className="input-file" />
          </div>

          {/* Input Groups */}
          <div className="input-section">
            <div className="input-row">
              <div className="input-group">
                <label>Name <span className="required">*</span></label>
                <input type="text" name="name" required value={user.name} onChange={handleInput} placeholder="Your name" />
              </div>
              <div className="input-group">
                <label>Email <span className="required">*</span></label>
                <input type="email" name="email" required value={user.email} onChange={handleInput} placeholder="you@example.com" />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>College/School Name <span className="required">*</span></label>
                <input type="text" name="college" required value={user.college} onChange={handleInput} />
              </div>
              <div className="input-group">
                <label>Mobile Number <span className="required">*</span></label>
                <input type="text" name="mobile" required value={user.mobile} onChange={handleInput} />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Semester <span className="required">*</span></label>
                <input type="text" name="semester" required value={user.semester} onChange={handleInput} />
              </div>
              <div className="input-group">
                <label>Year of Passing <span className="required">*</span></label>
                <input type="text" name="year" required value={user.year} onChange={handleInput} />
              </div>
            </div>

            <div className="input-group">
              <label>Course/Internship Name <span className="required">*</span></label>
              <input type="text" name="courseName" required value={user.courseName} onChange={handleInput} />
            </div>

            <div className="input-group">
              <label>Duration <span className="required">*</span></label>
              <input type="text" name="duration" required value={user.duration} onChange={handleInput} />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Start Date <span className="required">*</span></label>
                <input type="date" name="startDate" required value={user.startDate} onChange={handleInput} />
              </div>
              <div className="input-group">
                <label>End Date <span className="required">*</span></label>
                <input type="date" name="endDate" required value={user.endDate} onChange={handleInput} />
              </div>
            </div>

            <div className="input-group">
              <label>Feedback <span className="required">*</span></label>
              <textarea name="feedback" rows="4" required value={user.feedback} onChange={handleInput} placeholder="Share your experience..." />
            </div>

            <div className="input-group">
              <label>Suggestions for Improvement <span className="required">*</span></label>
              <textarea name="improvement" rows="3" required value={user.improvement} onChange={handleInput} placeholder="Your suggestions..." />
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
