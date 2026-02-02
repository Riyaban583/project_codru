import { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import "../styles/Blogpage.css";
// import parser from "react-html-parser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThumbsUp,
  faThumbsDown,
  faComment,
  faBookmark,
  faShareSquare,
} from "@fortawesome/free-solid-svg-icons";
import Commentpage from "./Commentpage";
import "../styles/Blogdetail.css";
import Sharebutton from "./Sharebutton";
import Navbar from "../components/Navbar";
import Footer from '../components/Footer'

function BlogDetail({ userData, setUserData }) {
  const { blogId } = useParams();
  const [showComment, setShowComment] = useState(false);
  const [focus, setFocus] = useState(true);
  const [blogData, setBlogData] = useState(null);
  const [showshareblog, setshowshareblog] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [targetuser, settargetuser] = useState("");

  const currentUser = localStorage.getItem("Username");

  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        const res = await fetch(
          `https://codru-server.vercel.app/blogs/${blogId}`
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const jsonData = await res.json();
        setBlogData(jsonData.blog);
        settargetuser(jsonData.blog.username);

        await checkFollower();

        // Check if the blog is saved by the current user
        const userRes = await fetch(
          `https://codru-server.vercel.app/${currentUser}`
        );
        const userData = await userRes.json();
        setUserData(userData);

        if (userData.savedBlogs.includes(blogId)) {
          setIsSaved(true);
        }
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
      }
    };

    const checkFollower = async () => {
      try {
        const response = await fetch(
          `https://codru-server.vercel.app/checkfollowing`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetUsername: targetuser,
              currentUsername: currentUser,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to check following status");
        }

        const jsonData = await response.json();
        console.log(jsonData.following, "Follower status"); // Debugging log
        setIsFollowing(jsonData.following);
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
      }
    };

    fetchBlogData();
  }, [blogId, currentUser, setUserData, targetuser]);

  const handleLike = async () => {
    try {
      const res = await fetch("https://codru-server.vercel.app/blog/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId, username: currentUser }),
      });

      if (!res.ok) {
        throw new Error("Failed to like the blog");
      }

      const updatedBlog = await res.json();
      setBlogData(updatedBlog);
    } catch (error) {
      console.error("There was a problem with the like operation:", error);
    }
  };

  const handleDislike = async () => {
    try {
      const res = await fetch("https://codru-server.vercel.app/blog/dislike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId, username: currentUser }),
      });

      if (!res.ok) {
        throw new Error("Failed to dislike the blog");
      }

      const updatedBlog = await res.json();
      setBlogData(updatedBlog);
    } catch (error) {
      console.error("There was a problem with the dislike operation:", error);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(
        `https://codru-server.vercel.app/blog/${
          isSaved ? "unsaveblog" : "saveblog"
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blogId, username: currentUser }),
        }
      );

      if (!res.ok) {
        throw new Error(
          `Failed to ${isSaved ? "unsave" : "save"} the blog. Server returned ${
            res.status
          }`
        );
      }

      setIsSaved(!isSaved);
    } catch (error) {
      console.error(
        `There was a problem with the ${
          isSaved ? "unsave" : "save"
        } operation:`,
        error
      );
    }
  };

  const handleFollow = async () => {
    if (!blogData || !userData) return;

    try {
      const res = await fetch(
        `https://codru-server.vercel.app/${
          isFollowing ? "unfollow" : "follow"
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentUserId: currentUser, // Use userData._id instead of username
            targetUserId: targetuser, // Ensure blogData has the userId
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          `Failed to ${isFollowing ? "unfollow" : "follow"} the user`
        );
      }

      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error(
        `There was a problem with the ${
          isFollowing ? "unfollow" : "follow"
        } operation:`,
        error
      );
      alert(
        `There was a problem with the ${
          isFollowing ? "unfollow" : "follow"
        } operation: ${error.message}`
      );
    }
  };

  if (!blogData) {
    return <div className="shimmereffectwhite"></div>;
  }

  const date = new Date(blogData.createdAt).toLocaleDateString();
  const userHasLiked = blogData.likedBy.includes(currentUser);
  const userHasDisliked = blogData.dislikedBy.includes(currentUser);
  const blogurl = window.location.href;

  return (
    <div className="blog-detail-container">
      <Navbar userData={userData} setUserData={setUserData} />
      <div className="blog-detail-content">
        <div className="blog-detail-post">
          <h2 className="blogdetailtitle">{blogData.title}</h2>
          <div className="blogdetailuser">
            <div>
              <NavLink
                to={`/public-profile/${blogData.username}`}
                className="blogdetailuserimgdiv"
              >
                <img src={blogData.userphoto} alt={`image-${blogId}`} />
              </NavLink>
              <div className="blogdetailusercontentdiv">
                <div>
                  <p>
                    <NavLink
                      to={`/public-profile/${blogData.username}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {blogData.username}
                    </NavLink>
                  </p>
                  <NavLink
                    style={{ textDecoration: "none", cursor: "pointer" }}
                    onClick={handleFollow}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </NavLink>
                </div>
                <p>
                  <b>Published on: </b>
                  {date}
                </p>
              </div>
            </div>
          </div>
          <hr className="hrtagofblogdetail" style={{ margin: "1vh 0vh" }} />
          <div className="blogdetailactivity">{parser(blogData.content)}</div>
          <div className="blogdetaillikecomment">
            <div
              onClick={handleLike}
              style={{ color: userHasLiked ? "blue" : "grey", cursor: "pointer" }}
            >
              <FontAwesomeIcon icon={faThumbsUp} />
              <span>{blogData.likes}</span>
            </div>
            <div
              onClick={handleDislike}
              style={{
                color: userHasDisliked ? "blue" : "grey",
                cursor: "pointer",
              }}
            >
              <FontAwesomeIcon icon={faThumbsDown} />
              <span>{blogData.dislikes}</span>
            </div>
            <div
              onClick={() => {
                setShowComment(!showComment);
                setFocus(!focus);
              }}
              style={{ cursor: "pointer" }}
            >
              <FontAwesomeIcon icon={faComment} />
              <span>{blogData.comments.length}</span>
            </div>
            <div onClick={handleSave} style={{ cursor: "pointer" }}>
              <FontAwesomeIcon
                icon={faBookmark}
                style={{ color: isSaved ? "blue" : "grey" }}
              />
            </div>
            <div style={{ position: "relative", cursor: "pointer" }}>
              <FontAwesomeIcon
                icon={faShareSquare}
                onClick={() => {
                  setshowshareblog(!showshareblog);
                }}
              />
              {showshareblog && <Sharebutton blogurl={blogurl} />}
            </div>
          </div>
        </div>
        {/* <hr className="hrtagofblogdetail" /> */}
        <div className="blog-detail-hide-div">
          
        </div>

        {showComment && (
          <Commentpage
            onFocus={focus}
            blogId={blogId}
            userData={userData}
            setUserData={setUserData}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default BlogDetail;
