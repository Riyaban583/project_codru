import { useState } from 'react';

const Form = () => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(user);
  };

  return (
    <div className="w-full flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 p-4 font-sans">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl p-8 border border-gray-200">
        <form
          action="/Registration"
          method="post"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="space-y-6"
        >
          <h1 className="text-4xl text-center text-gray-800 font-extrabold pb-4 border-b">
            Codru <span className="text-blue-600">Education</span>
          </h1>

          {/* Profile Image Upload */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img
              src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
              alt="profile"
              className="w-[100px] h-[100px] border border-gray-300 p-1 rounded-full"
            />
            <input
              type="file"
              className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Input Groups */}
          <div className="space-y-4 text-gray-800">
            {/* Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={user.name}
                  onChange={handleInput}
                  placeholder="Your name"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={user.email}
                  onChange={handleInput}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* College & Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium">
                  College/School Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="college"
                  required
                  value={user.college}
                  onChange={handleInput}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block font-medium">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="mobile"
                  required
                  value={user.mobile}
                  onChange={handleInput}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Semester & Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium">
                  Semester <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="semester"
                  required
                  value={user.semester}
                  onChange={handleInput}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block font-medium">
                  Year of Passing <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="year"
                  required
                  value={user.year}
                  onChange={handleInput}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Course Details */}
            <div className="space-y-4">
              <div>
                <label className="block font-medium">
                  Course/Internship Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="courseName"
                  required
                  value={user.courseName}
                  onChange={handleInput}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block font-medium">
                  Duration <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="duration"
                  required
                  value={user.duration}
                  onChange={handleInput}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-medium">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={user.startDate}
                    onChange={handleInput}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block font-medium">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={user.endDate}
                    onChange={handleInput}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* Feedback & Improvements */}
            <div className="space-y-4">
              <div>
                <label className="block font-medium">
                  Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="feedback"
                  rows="4"
                  required
                  value={user.feedback}
                  onChange={handleInput}
                  placeholder="Share your experience..."
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                ></textarea>
              </div>
              <div>
                <label className="block font-medium">
                  Suggestions for Improvement <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="improvement"
                  rows="3"
                  required
                  value={user.improvement}
                  onChange={handleInput}
                  placeholder="Your suggestions..."
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-md transition duration-300"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form;
