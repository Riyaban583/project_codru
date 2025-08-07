import { Route, Routes } from "react-router-dom";
import { useEffect, useContext, useState } from "react";
import "./App.css";
import Admission from "./components/Admission";
import Buy from "./components/Buy.jsx";
import Change_password from "./components/Change_password";
import Class6 from "./components/Class6.jsx";
import Contact from "./components/Contact";
import Courses from "./components/Courses.jsx";
import Extra from "./components/Extra.jsx";
import Forget_password from "./components/Forget_password";
import Home from "./components/Home";
import Popup from "./components/Popup";
import Signin from "./components/Signin";
import Signup from "./components/Signup";
import BlogForm from "./components/BlogForm.jsx";
import Blogpage from "./components/Blogpage.jsx";
import Notification from "./components/Notification";
import Custom from "./components/Custom.jsx";
import Dashboard from "./components/Dashboard";
import Blogdetail from "./components/Blogdetail.jsx";
import Form from "./components/Form";
import Commentpage from "./components/Commentpage.jsx";
import TaskForm from "./components/TaskForm.jsx";
// import EventList from "./components/EventList.jsx";
import PlanetaryPath from "./components/PlanetryPath.jsx";
import FinalBuy from "./components/FinalBuy.jsx";
import Myblogs from "./components/Myblogs.jsx";
// import ThemeToggle from "./components/ThemeToggle";
import { ThemeContext } from "./context/ThemeContext";
import Publicprofile from "./components/Publicprofile.jsx";
import BotEnroll from "./components/BotEnroll.jsx";
import BotExplorer from "./components/BotExplorer.jsx";
import BotEngineer from "./components/BotEngineer.jsx";
import BotInventor from "./components/BotInventor.jsx";
import About1 from "./components/About1.jsx";
import Training  from "./components/Training.jsx"
import Navbar from "./components/Navbar.jsx";

function App() {
  const { theme } = useContext(ThemeContext);
  const [userData, setUserData] = useState({
    Name: "",
    Photo: "",
    Role: "",
    isAdmin: false,
  });

  const { darkTheme } = useContext(ThemeContext);
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("Token");
      if (token) {
        const res = await fetch(`${import.meta.env.VITE_API}profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setUserData((prevData) => ({
            ...prevData,
            Photo: data.user.photo.toString(),
            Name: data.user.name.toString(),
            isAdmin: true,
            Role: data.user.role,
          }));
          localStorage.setItem("Photo", data.user.photo);
          localStorage.setItem("Name", data.user.name);
        } else {
          console.error("Failed to fetch user data", data.error);
        }
      }
    };

    fetchData();
  }, []);

  return (
    <div className={`App ${darkTheme ? "dark-theme" : "light-theme"}`}>
      {/* <ThemeToggle /> */}
      <Routes>
        <Route
          path="/bot-explorer"
          element={<BotExplorer userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/bot-engineer"
          element={<BotEngineer userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/bot-inventor"
          element={<BotInventor userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/bot-enroll"
          element={<BotEnroll userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/"
          element={<Home userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/forgot-password/:token"
          element={
            <Forget_password userData={userData} setUserData={setUserData} />
          }
        />
        <Route
          path="/signup"
          element={<Signup userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/signin"
          element={<Signin userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/popup"
          element={<Popup userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/courses"
          element={<Courses userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/course-register"
          element={<Admission userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/extra"
          element={<Extra userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/class6"
          element={<Class6 userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/blogsdata"
          element={<Blogpage userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/dashboard"
          element={<Dashboard userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/buy"
          element={<Buy userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/blog/:blogId"
          element={<Blogdetail userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/change-password"
          element={
            <Change_password userData={userData} setUserData={setUserData} />
          }
        />
        <Route
          path="/form"
          element={<Form userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/contact"
          element={<Contact userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/about"
          element={<About1 userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/custom"
          element={<Custom userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/commentpage"
          element={
            <Commentpage userData={userData} setUserData={setUserData} />
          }
        />
        <Route
          path="/createblog"
          element={<BlogForm userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/blogsdata"
          element={<Blogpage userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/public-profile/:username"
          element={
            <Publicprofile userData={userData} setUserData={setUserData} />
          }
        />
        <Route
          path="/notification"
          element={
            <Notification userData={userData} setUserData={setUserData} />
          }
        />
        <Route
          path="/add-task/:username"
          element={<TaskForm userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/planetary-path"
          element={
            <PlanetaryPath userData={userData} setUserData={setUserData} />
          }
        />
        <Route
          path="/finalBuy"
          element={<FinalBuy userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/my-blogs"
          element={<Myblogs userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/admission"
          element={<Admission userData={userData} setUserData={setUserData} />}
        />
        <Route
          path="/training"
          element={<Training userData={userData}  />}
        />
      </Routes>
    </div>
  );
}

export default App;
