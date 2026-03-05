import { useState, useRef, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { 
  List, ListItem, ListItemButton, ListItemText, ListItemIcon 
} from "@mui/material";
import {
  Person as PersonIcon, Settings as SettingsIcon, ExitToApp as ExitToAppIcon,
  Route as RouteIcon, Backpack as BackpackIcon, RssFeed as RssFeedIcon,
  Home as HomeIcon, ManageAccounts as ManageAccountsIcon,
  Dashboard as DashboardIcon, Bookmarks as BookmarksIcon
} from "@mui/icons-material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";

// Components (Make sure these are migrated to TSX eventually!)
import Admin from "./Admin";
import PlanetryPath from "./PlanetryPath";
import Savedblogs from "./Savedblogs";
import Profile from "./Profile";
import SettingsPanel from "./SettingsPanel";
import Calendar from "./Calendar";
import Muialert from "./Muialert";
import { UserData } from "../App";

interface DashboardProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userData, setUserData] = useState({
    name: "Student", // Default fallback
    photo: "", 
    role: ""
  });

  // State
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<"success" | "error">("success");
  
  const [currentView, setCurrentView] = useState(localStorage.getItem("currentView") || "dashboard");
  const [activeTab, setActiveTab] = useState(localStorage.getItem("activeTab") || "Dashboard");

useEffect(() => {
    // This is the combined useEffect we discussed earlier!
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      localStorage.setItem("jwtoken", urlToken);
      window.history.replaceState({}, document.title, "/dashboard");
    }

    // 2. Fetch the user's actual profile from the database
    const fetchProfile = async () => {
      const token = localStorage.getItem("jwtoken");
      if (!token) return; // If not logged in, do nothing

      try {
        const res = await fetch(`${import.meta.env.VITE_API}get-user-profile`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}` // Show the ID badge!
          }
        });

        const data = await res.json();
        
        if (res.ok) {
          setUserData(data); // Save their real name and photo to state!
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };

    fetchProfile();
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handlePhotoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      const newPhoto = reader.result;
      try {
        const res = await fetch(`${import.meta.env.VITE_API}profile-edit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: localStorage.getItem("Username"),
            photo: newPhoto,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setUserData((prevData) => ({
            ...prevData,
            Photo: data.user.photo.toString(),
          }));
          setAlertSeverity("success");
          setAlertMessage(data.message || "Image updated successfully");
          setShowAlert(true);
        } else {
          setAlertSeverity("error");
          setAlertMessage(data.error || "Failed to update image");
          setShowAlert(true);
        }
      } catch (err) {
        setAlertSeverity("error");
        setAlertMessage("Network error while updating image.");
        setShowAlert(true);
      }
    };
    reader.readAsDataURL(file);
  };

const SignOut = async () => {
    try {
      // 1. Tell the server we are leaving (good if you have analytics or old cookies)
      const res = await fetch(`${import.meta.env.VITE_API}signout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        // 2. Only destroy the "ID Badge", keep the saved tabs/views intact!
        localStorage.removeItem("jwtoken"); 
        
        // 3. Send them back to the home page
        navigate("/");
      } else {
        const data = await res.json();
        setAlertSeverity("error");
        setAlertMessage(data.error || "Failed to log out");
        setShowAlert(true);
      }
    } catch (error) {
      // Fallback: Even if the server is offline, we should still log them out locally
      localStorage.removeItem("jwtoken");
      navigate("/");
    }
  };

  const getDrawerContent = (role: string, isAdmin: boolean) => {
    const items = [
      { text: "Home", icon: <HomeIcon />, path: "/" },
      { text: "Dashboard", icon: <DashboardIcon />, view: "dashboard" },
      { text: "Profile", icon: <PersonIcon />, view: "profile" },
      { text: "Settings", icon: <SettingsIcon />, view: "settings" },
      { text: "My Blogs", icon: <RssFeedIcon />, view: "my-blogs", path: "/my-blogs" },
      { text: "Saved Blogs", icon: <BookmarksIcon />, view: "saved-blogs" },
    ];

    if (role === "Teacher" || role === "Student") {
      items.push({ text: "My Courses", icon: <BackpackIcon />, view: "my-courses" });
    }
    if (role === "Student") {
      items.push({ text: "Report", icon: <RouteIcon />, view: "report" });
    }
    if (isAdmin) {
      items.push({ text: "Manage Users", icon: <ManageAccountsIcon />, view: "manage-users" });
    }

    return (
      <List className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
        {items.map((item) => {
          const isActive = activeTab === item.text;
          return (
            <ListItem disablePadding key={item.text} className="mb-1">
              <ListItemButton
                onClick={() => {
                  if (item.path) {
                    handleNavigation(item.path);
                  } else {
                    setCurrentView(item.view);
                    setActiveTab(item.text);
                    localStorage.setItem("currentView", item.view);
                    localStorage.setItem("activeTab", item.text);
                  }
                }}
                sx={{
                  borderRadius: "12px",
                  backgroundColor: isActive ? "#fff7ed" : "transparent", // Tailwind orange-50
                  color: isActive ? "#ed7f23" : "#64748b", // brand-orange or slate-500
                  "&:hover": {
                    backgroundColor: isActive ? "#ffedd5" : "#f1f5f9",
                    color: isActive ? "#ed7f23" : "#1765a4", // brand-blue on hover
                  },
                }}
              >
                <ListItemIcon sx={{ color: "inherit", minWidth: "40px" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive ? 700 : 500,
                    fontFamily: '"Arimo", sans-serif'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        {/* Logout Button */}
        <ListItem disablePadding className="mt-8 mb-4">
          <ListItemButton
            onClick={SignOut}
            sx={{
              borderRadius: "12px",
              color: "#ef4444", // Red for logout
              "&:hover": { backgroundColor: "#fef2f2" },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: "40px" }}>
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600, fontFamily: '"Arimo", sans-serif' }} />
          </ListItemButton>
        </ListItem>
      </List>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-body">
      
      {/* Left Sidebar */}
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col shadow-lg flex-shrink-0 z-10">
        
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-center border-b border-gray-100">
          <NavLink to="/" className="cursor-pointer">
            {/* Standardized to the SVG logo we used in the Navbar! */}
            <img src="/logo.svg" alt="CuTe Learning" className="w-[6.5rem] drop-shadow-md transition transform hover:scale-105" draggable="false" />
          </NavLink>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center py-8 border-b border-gray-100 relative">
          <div className="relative group">
            {userData.photo ? (
            <img 
              src={userData.photo} 
              alt="Profile" 
              className="w-20 h-20 rounded-full shadow-md border-4 border-white object-cover"
            />
          ) : (
             // A cute fallback circle if they don't have a Google photo
            <div className="w-20 h-20 rounded-full bg-brand-orange flex items-center justify-center text-white text-2xl font-bold shadow-md border-4 border-white">
              {userData.name.charAt(0).toUpperCase()}
            </div>
          )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-brand-blue text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition transform hover:scale-110"
              title="Change Photo"
            >
              <FontAwesomeIcon icon={faPen} className="text-xs" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handlePhotoInput}
              accept="image/*"
            />
          </div>
          <h2 className="mt-4 text-lg font-display font-bold text-brand-blue">
            Hi, {userData.name.split(' ')[0]}! {/* Shows just their first name */}
          </h2>
          <p className="text-xs font-bold text-brand-orange uppercase tracking-wider mt-1">
            {userData.role}
          </p>
        </div>

        {/* Navigation Drawer */}
        <div className="flex-1 overflow-hidden flex flex-col mt-4">
          {getDrawerContent(userData.role, userData.isAdmin)}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 relative">
        {/* Added a subtle header background for depth */}
        <div className="h-48 bg-brand-blue absolute top-0 left-0 w-full rounded-b-[3rem] shadow-inner"></div>
        
        <div className="relative z-10 p-8 max-w-7xl mx-auto mt-8">
          {/* Dynamic Content Rendering */}
          <div className="bg-white rounded-3xl shadow-xl p-6 min-h-[70vh] border border-gray-100">
            {currentView === "profile" && <Profile />}
            {currentView === "dashboard" && <Calendar />}
            {currentView === "settings" && <SettingsPanel />}
            {currentView === "my-courses" && <div className="p-8 text-center text-gray-500 font-display text-xl">My Courses Content Coming Soon!</div>}
            {currentView === "saved-blogs" && <Savedblogs userData={userData} setuserData={setUserData} />}
            {currentView === "my-blogs" && <div className="p-8 text-center text-gray-500 font-display text-xl">My Blogs Content Coming Soon!</div>}
            {currentView === "report" && <PlanetryPath />}
            {currentView === "manage-users" && <Admin userData={userData} setUserData={setUserData} />}
          </div>
        </div>
      </div>

      {/* FIXED: The Alert actually renders now! */}
      {showAlert && (
        <Muialert
          message={alertMessage}
          severity={alertSeverity}
          onClose={() => setShowAlert(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;