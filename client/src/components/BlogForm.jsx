import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../styles/BlogForm.css";

// Define and register custom size format
const Size = Quill.import("attributors/style/size");
Size.whitelist = [
  "10px",
  "11px",
  "12px",
  "13px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "32px",
  "42px",
  "54px",
  "68px",
  "84px",
  "98px",
];
Quill.register(Size, true);

// Register custom font format
const Font = Quill.import("formats/font");
Font.whitelist = [
  "Arial",
  "Verdana",
  "Times New Roman",
  "Courier New",
  "cursive",
  "Tahoma",
  "Georgia",
  "Comic Sans MS",
  "Impact",
  "Lucida Sans Unicode",
  "Palatino Linotype", // Added Palatino Linotype
];
Quill.register(Font, true);

const BlogForm = ({ userData, setUserData }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showPopup, setShowPopup] = useState(false); // State to control pop-up visibility
  const quillRef = useRef(null);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    // Check if the user is logged in
    const username = localStorage.getItem("Username");
    if (!username) {
      setShowPopup(true); // Show the pop-up
      setTimeout(() => {
        setShowPopup(false); // Hide the pop-up after 3 seconds
        navigate("/signin"); // Redirect to the sign-in page
      }, 3000);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const postData = {
      title,
      content,
      username: localStorage.getItem("Username"),
      userphoto: userData.Photo,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API}blogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(response.error);
      }

      const data = await response.json();
      console.log("Post created:", data);
      setTitle("");
      setContent("");
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        quill.insertEmbed(range.index, "image", reader.result);
      };
      reader.readAsDataURL(file);
    };
  }, []);

  const modules = {
    toolbar: {
      container: [
        [
          { header: "1" },
          { header: "2" },
          {
            font: [
              "Arial",
              "Verdana",
              "Times New Roman",
              "Courier New",
              "cursive",
              "Tahoma",
              "Georgia",
              "Comic Sans MS",
              "Impact",
              "Lucida Sans Unicode",
              "Palatino Linotype", // Added Palatino Linotype
            ],
          },
        ],
        [
          {
            size: [
              "10px",
              "11px",
              "12px",
              "13px",
              "14px",
              "16px",
              "18px",
              "20px",
              "24px",
              "32px",
              "42px",
              "54px",
              "68px",
              "84px",
              "98px",
            ],
          },
        ],
        [{ list: "ordered" }, { list: "bullet" }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ align: [] }, { color: [] }, { background: [] }],
        ["link", "image", "video"],
        ["clean"],
      ],
      handlers: {
        image: handleImageUpload,
      },
    },
  };

  return (
    <div className="Blogformmaindiv">
      {showPopup && (
        <>
          <div className="overlay"></div> {/* Add overlay */}
          <div className="popup">
            Sign in to upload blogs.
          </div>
        </>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post Title"
          required
          disabled={showPopup} // Disable input when pop-up is visible
        />
        <div>
          <ReactQuill
            ref={quillRef}
            value={content}
            onChange={setContent}
            modules={modules}
            className="Reactquill"
            placeholder="Write it out here..."
            readOnly={showPopup} // Make editor read-only when pop-up is visible
          />
        </div>
        <div className="BlogDoneButton">
          <button className="BlogDone" type="submit" disabled={showPopup}>
            Done
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogForm;
