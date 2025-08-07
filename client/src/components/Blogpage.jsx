import { useEffect, useState } from "react";
import "../styles/Blogpage.css";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "../components/Footer";

function Blogpage({ userData, setUserData }) {
  const navigate = useNavigate();
  const [blogarray, setBlogarray] = useState([]);
  const [expandedTitles, setExpandedTitles] = useState({});
  const [showNoBlogsMessage, setShowNoBlogsMessage] = useState(false); // State to control "No Blogs" message
  const [loading, setLoading] = useState(true); // State to control shimmer effect
 

  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API}blogsdata`, {
          method: "GET",
          headers: {  
         authorization: `Bearer ${localStorage.getItem("Token")}` }
          }
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const jsondata = await res.json();
        if (!Array.isArray(jsondata.blogs)) {
          throw new Error("Invalid data format received from server");
        }

        setBlogarray(jsondata.blogs);
        console.log(jsondata.blogs);

        // If no blogs are found, show the shimmer effect for 2 seconds
        if (jsondata.blogs.length === 0) {
          setTimeout(() => {
            setLoading(false); // Stop shimmer effect
            setShowNoBlogsMessage(true); // Show "No Blogs" message
          }, 2000);
        } else {
          setLoading(false); // Stop shimmer effect if blogs are found
        }
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        setTimeout(() => {
          setLoading(false); // Stop shimmer effect
          setShowNoBlogsMessage(true); // Show "No Blogs" message if fetch fails
        }, 2000);
      }
    };

    fetchBlogData();
  }, []);

  const handleBlogClick = (blogId) => {
    console.log(`Navigating to blog with ID: ${blogId}`);
    navigate(`/blog/${blogId}`);
  };

  const extractFirstImageAndSnippet = (content) => {
    const doc = new DOMParser().parseFromString(content, "text/html");
    const img = doc.querySelector("img");
    const text = doc.body.textContent || "";
    return {
      image: img ? img.src : null,
      snippet: text.slice(0, 400) + "...",
    };
  };

  const toggleTitleExpansion = (index) => {
    setExpandedTitles((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCreateBlog = () => {
    navigate("/createblog");
  };

  return (
    <div>
      <Navbar userData={userData} setUserData={setUserData} />
      <div className="blog-page">
        {loading ? (
          <div className="shimmereffectwhite"></div> // Show shimmer effect while loading
        ) : showNoBlogsMessage ? (
          <div className="no-blogs-message">No Blogs are here.</div> // Show "No Blogs" message
        ) : (
          blogarray.map((data, index) => {
            const contentPreview = extractFirstImageAndSnippet(data.content);
            const isExpanded = expandedTitles[index];
            const title = data.title;
            const snippet = contentPreview.snippet;
            const date = new Date(data.createdAt).toLocaleDateString();

            return (
              <div key={index} className="blog-post">
                {contentPreview.image ? (
                  <img src={contentPreview.image} alt="Blog Image" />
                ) : (
                  <div className="blog-no-image">
                    <div className="author-photo">
                      <img src={data.userId.photo} alt="User Photo" />
                    </div>
                    <div className="author-name">
                      <b>Published by: </b>
                      {data.userId.name}
                      <br />
                      <b>Published at: </b>
                      {date}
                    </div>
                  </div>
                )}
                <h2 className="blogtitle">
                  {isExpanded || title.length <= 70 ? (
                    title
                  ) : (
                    <>
                      {title.slice(0, 70)}...{" "}
                      <span
                        className="blog-page-show-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTitleExpansion(index);
                        }}
                      ></span>
                    </>
                  )}
                </h2>
                <span className="blogpagesnippet">{snippet}</span>
                <div className="blogseemore">
                  <button onClick={() => handleBlogClick(data._id)}>
                    Read More
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <Footer />
      <button className="create-blog-btn" onClick={handleCreateBlog}>
        <i className="fas fa-pen-nib "></i>
      </button>
    </div>
  );
}

export default Blogpage;