import { useState, useRef, useEffect } from "react"; 
import { useNavigate, NavLink, useParams, useLocation } from "react-router-dom";
import { List, ListItem, ListItemButton, ListItemText, ListItemIcon } from "@mui/material";
import { 
  Loader2, Pen, CalendarClock, ListChecks, User, 
  Settings, LogOut, TrendingUp, Backpack, Rss, 
  Home, Users, Bookmark, Lock,
  GraduationCap,
  UserCog,
  ShieldAlert, 
  Bell
} from "lucide-react";

// Components
import Admin from "./Admin";
import PlanetryPath from "./PlanetryPath";
import MyPosts from "./MyPosts";
import SavedPosts from "./SavedPosts";
import Profile from "./Profile";
import SettingsPanel from "./SettingsPanel";
import StudentManagement from "./StudentManagement";
import Calendar from "./Calendar";
import { SyllabusTracker } from "./SyllabusTracker"; 
import Muialert from "./Muialert";
import { UserData } from "../App";
import MyCourses from "./MyCourses";
import AdminAuditLog from "./AdminAuditLog";
import Notification from "./Notification";

interface DashboardProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

const Dashboard = ({ userData, setUserData }: DashboardProps) => {
  const location = useLocation();
  const { section } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<"success" | "error">("success");
  const [isUploading, setIsUploading] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // 🚨 State for the Freemium Modal
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // 1. Define who gets to see what
  const isPremiumTeacher = userData.Role === "Teacher" && userData.isVerifiedStaff;
  const isUnverifiedTeacher = userData.Role === "Teacher" && !userData.isVerifiedStaff;
  
  
  // Global State for Teachers to select a student
  const [teacherStudents, setTeacherStudents] = useState<any[]>([]);
  const [selectedStudentUsername, setSelectedStudentUsername] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState(() => {
    let savedView = location.state?.targetView?.toLowerCase() || localStorage.getItem("currentView") || "schedule";
    if (savedView === "dashboard") {
      savedView = "schedule";
      localStorage.setItem("currentView", "schedule");
    }
    return savedView;
  });

  const todayDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const [activeTab, setActiveTab] = useState(() => {
    const viewToTabMap: Record<string, string> = {
      schedule: "Schedule", syllabus: "Syllabus Tracker", profile: "Profile",
      settings: "Settings", "my-posts": "My Posts", "saved-posts": "Saved Posts",
      report: "Report", management: "Management", "my-courses": "My Courses"
    };
    return viewToTabMap[currentView] || "Schedule";
  });

  // Restored: Failsafe token check just in case App.tsx misses it during a hard refresh
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      localStorage.setItem("jwtoken", urlToken);
      window.history.replaceState({}, document.title, "/dashboard");
    }
  }, []);

  useEffect(() => {
    // 1. Check for the React Router state (used by your in-app Bell icon)
    const stateView = location.state?.targetView;
    
    // 2. Check for the URL Query Param (used by the Service Worker Push Notification)
    const queryParams = new URLSearchParams(location.search);
    const queryView = queryParams.get("view");

    const finalTarget = stateView || queryView;

    if (finalTarget) {
      // Set your active tab state here!
      setActiveTab(finalTarget);
    }
  }, [location]);

  useEffect(() => {
    const target = location.state?.targetView?.toLowerCase();
    if (target) {
      setCurrentView(target);
      const viewToTabMap: Record<string, string> = {
        schedule: "Schedule", syllabus: "Syllabus Tracker", profile: "Profile",
        settings: "Settings", "my-posts": "My Posts", "saved-posts": "Saved Posts",
        report: "Report", management: "Management", "my-courses": "My Courses"
      };
      setActiveTab(viewToTabMap[target] || "Schedule");
      localStorage.setItem("currentView", target);
      localStorage.setItem("activeTab", viewToTabMap[target] || "Schedule");
      window.history.replaceState({}, document.title, "/dashboard");
    }
  }, [location.state]);

  // Only fetch students if they are a PREMIUM teacher
  useEffect(() => {
    if (isPremiumTeacher) {
      const fetchRoster = async () => {
        try {
          const token = localStorage.getItem("jwtoken");
          const teacherUsername = localStorage.getItem("Username");
          const res = await fetch(`${import.meta.env.VITE_API}my-students/${teacherUsername}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setTeacherStudents(data);
          }
        } catch (error) {
          console.error("Failed to fetch teacher roster globally:", error);
        }
      };
      fetchRoster();
    }
  }, [isPremiumTeacher]);

  const handleNavigation = (path: string) => navigate(path);

  // 🚨 RESTORED: Full Photo Upload Logic
  const handlePhotoInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "cute_profiles"); 
      formData.append("cloud_name", "da6jhcsmm");       

      const cloudinaryRes = await fetch(
        "https://api.cloudinary.com/v1_1/da6jhcsmm/image/upload", 
        { method: "POST", body: formData }
      );

      if (!cloudinaryRes.ok) throw new Error("Failed to upload to Cloudinary");
      
      const cloudinaryData = await cloudinaryRes.json();
      const secureUrl = cloudinaryData.secure_url;

      const dbRes = await fetch(`${import.meta.env.VITE_API}profile-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: localStorage.getItem("Username"),
          photo: secureUrl, 
        }),
      });

      if (!dbRes.ok) throw new Error("Failed to update database");

      setUserData((prevData: any) => ({
        ...prevData,
        Photo: secureUrl, 
      }));
      
      localStorage.setItem("Photo", secureUrl);
      
      setAlertSeverity("success");
      setAlertMessage("Profile picture updated!");
      setShowAlert(true);

    } catch (err: any) {
      console.error("Upload error:", err);
      setAlertSeverity("error");
      setAlertMessage(err.message || "Failed to update profile picture");
      setShowAlert(true);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 🚨 RESTORED: Full SignOut Logic
  const SignOut = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API}signout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        localStorage.removeItem("jwtoken"); 
        navigate("/");
      } else {
        const data = await res.json();
        setAlertSeverity("error");
        setAlertMessage(data.error || "Failed to log out");
        setShowAlert(true);
      }
    } catch (error) {
      localStorage.removeItem("jwtoken");
      navigate("/");
    }
  };

  const handleRequestApproval = async () => {
  setIsRequesting(true);
  try {
    const token = localStorage.getItem("jwtoken");
    const res = await fetch(`${import.meta.env.VITE_API}request-staff-approval`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok) {
      setAlertSeverity("success");
      setAlertMessage(data.message);
      setShowAlert(true);

      // Update global state so the button changes to "Pending"
      setUserData(prev => ({ ...prev, staffApprovalRequested: true }));

      // Close the modal after 2 seconds so they can read the success message
      setTimeout(() => setShowUnlockModal(false), 2000); 
    } else {
      setAlertSeverity("error");
      setAlertMessage(data.error || "Failed to send request.");
      setShowAlert(true);
    }
  } catch (error) {
    setAlertSeverity("error");
    setAlertMessage("Network error. Please try again later.");
    setShowAlert(true);
  } finally {
    setIsRequesting(false);
  }
};

  // Split Navigation into Basic vs Premium
  const getDrawerContent = () => {
    // 1. Basic items everyone gets
    const basicItems = [
      { text: "Home", icon: <Home size={22} />, path: "/" },
      { text: "Schedule", icon: <CalendarClock size={22} />, view: "schedule" }, 
      { text: "Profile", icon: <User size={22} />, view: "profile" },
      { text: "Settings", icon: <Settings size={22} />, view: "settings" },
      { text: "My Posts", icon: <Rss size={22} />, view: "my-posts" },
      { text: "Saved Posts", icon: <Bookmark size={22} />, view: "saved-posts" },
    ];

    // 2. Premium Academic items
    const premiumItems = [];
    if (userData.Role === "Student" || isPremiumTeacher) {
      premiumItems.push({ text: "Syllabus Tracker", icon: <ListChecks size={22} />, view: "syllabus" });
      premiumItems.push({ text: "My Courses", icon: <Backpack size={22} />, view: "my-courses" });
    }
    if (userData.Role === "Student") premiumItems.push({ text: "Report", icon: <TrendingUp size={22} />, view: "report" });
   // 1. Teacher Management (Managing students/classes)
    if (isPremiumTeacher) {
      premiumItems.push({ 
        text: "Management", 
        icon: <GraduationCap size={22} />, // Or keep <Users /> here if it's strictly a roster
        view: "management" 
      });
    }

    // 2. Admin Manage Users (System-wide account control)
    if (userData.isAdmin) {
      premiumItems.push({ 
        text: "Manage Users", 
        icon: <UserCog size={22} />, // ⚙️ A user with a gear (Universal symbol for account management)
        view: "manage-users" 
      });
    }

    // 3. Admin Audit Log (Security & Tracking)
    if (userData.isAdmin) {
      premiumItems.push({ 
        text: "Audit Log", 
        icon: <ShieldAlert size={22} />, // 🛡️ Matches the header inside your new Audit component!
        view: "admin-audit-log" 
      });
    }

    const renderListItem = (item: any) => {
      const isActive = activeTab === item.text;
      return (
        <ListItem disablePadding key={item.text} className="mb-1">
          <ListItemButton
            onClick={() => {
              if (item.path) { handleNavigation(item.path); } 
              else {
                setCurrentView(item.view); setActiveTab(item.text);
                localStorage.setItem("currentView", item.view); localStorage.setItem("activeTab", item.text);
              }
            }}
            sx={{
              borderRadius: "12px",
              backgroundColor: isActive ? "#fff7ed" : "transparent",
              color: isActive ? "#ed7f23" : "#64748b",
              "&:hover": { backgroundColor: isActive ? "#ffedd5" : "#f1f5f9", color: isActive ? "#ed7f23" : "#1765a4" },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: "40px" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontFamily: '"Arimo", sans-serif' }} />
          </ListItemButton>
        </ListItem>
      );
    };

    return (
      <List className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar flex flex-col">
        {basicItems.map(renderListItem)}

        {/* Render Premium Items with a divider if they exist */}
        {premiumItems.length > 0 && (
          <>
            <div className="my-3 mx-2 border-t border-slate-100"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Academy Tools</p>
            {premiumItems.map(renderListItem)}
          </>
        )}

        {/* THE UPGRADE BUTTON FOR UNVERIFIED TEACHERS */}
        {isUnverifiedTeacher && (
          <div className="mt-auto mx-2 bg-gradient-to-br from-brand-blue to-blue-600 rounded-2xl p-4 text-white text-center shadow-lg shadow-blue-500/20">
            <Lock className="mx-auto mb-2 opacity-80" size={24} />
            <p className="text-xs font-medium mb-3 opacity-90">Are you a teacher at Cute Learning?</p>
            <button 
              onClick={() => setShowUnlockModal(true)}
              className="w-full bg-white text-brand-blue text-xs font-black py-2.5 rounded-xl hover:bg-blue-50 transition active:scale-95 shadow-sm"
            >
              UNLOCK ACADEMY
            </button>
          </div>
        )}

        {/* Logout Button */}
        <ListItem disablePadding className={`mb-4 ${!isUnverifiedTeacher ? "mt-10" : "mt-6"}`}>
          <ListItemButton onClick={SignOut}>
            <ListItemIcon sx={{ color: "inherit", minWidth: "40px" }}><LogOut size={22} /></ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600, fontFamily: '"Arimo", sans-serif' }} />
          </ListItemButton>
        </ListItem>
      </List>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-body">
      
      {/* LEFT AREA: SIDEBAR */}
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col shadow-lg flex-shrink-0 z-10">
        
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-center border-b border-gray-100">
          <NavLink to="/" className="cursor-pointer">
            <img src="/logo.svg" alt="CuTe Learning" className="w-[6.5rem] drop-shadow-md transition transform hover:scale-105" draggable="false" />
          </NavLink>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center py-8 border-b border-gray-100 relative">
          <div className="relative group mx-auto w-20 h-20">
            {isUploading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-full shadow-md border-4 border-white">
                <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
              </div>
            )}
            {userData.Photo ? (
              <img src={userData.Photo} alt="Profile" className="w-20 h-20 rounded-full shadow-md border-4 border-white object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-orange flex items-center justify-center text-white text-2xl font-bold shadow-md border-4 border-white">
                {userData.Name ? userData.Name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-brand-blue text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition transform hover:scale-110 z-20" title="Change Photo">
              <Pen className="w-3 h-3" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handlePhotoInput} accept="image/*" />
          </div>
          <h2 className="mt-4 text-lg font-display font-bold text-brand-blue">Hi, {userData.Name ? userData.Name.split(' ')[0] : "Explorer"}!</h2>
          <p className="text-xs font-bold text-brand-orange uppercase tracking-wider mt-1">{userData.Role || "Student"}</p>
        </div>

        {/* Navigation Drawer */}
        <div className="flex-1 overflow-hidden flex flex-col mt-4">
          {getDrawerContent()}
        </div>
      </div>

      {/* RIGHT AREA: MAIN CONTENT */}
      <div className="flex-1 overflow-hidden bg-slate-50 relative flex flex-col">
        <div className="h-48 bg-brand-blue absolute top-0 left-0 w-full rounded-b-[3rem] shadow-inner"></div>

        {/* 🚨 CREATIVE DESIGN: The Centered Glassmorphic Utility Pill (Dynamic Island) */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center">
          
          {/* The Pill Container */}
          <div className="flex items-center gap-4 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 px-6 py-2.5 rounded-full shadow-lg transition-all duration-300">
            
            {/* The Context (Makes it look intentional) */}
            <span className="text-sm font-medium text-white/90 tracking-wide drop-shadow-sm whitespace-nowrap">
              {todayDate}
            </span>

            {/* Subtle Divider */}
            <div className="w-px h-5 bg-white/30 rounded-full"></div>

            {/* The Bell */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-white hover:text-brand-orange hover:scale-110 transition-all flex items-center justify-center"
              title="Notifications"
            >
              <Bell size={20} className={unreadCount > 0 ? "animate-wiggle" : ""} />
              
              {/* Red Unread Badge (Snug against the icon) */}
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-orange text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm border border-brand-orange">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* 🚨 The Dropdown Wrapper */}
          <div className="relative w-full flex justify-center">
            <Notification 
              showNotifications={showNotifications} 
              setShowNotifications={setShowNotifications}
              closeNotification={() => setShowNotifications(false)}
              setUnreadCount={setUnreadCount} 
              // 🚨 FIX: This perfectly centers the dropdown box directly beneath the pill!
              customClasses="top-4 left-1/2 -translate-x-1/2" 
            />
          </div>
        </div>
        
        <div className="relative z-10 p-8 max-w-7xl mx-auto w-full mt-8 flex-1 flex flex-col min-h-0">
          
          {/* Global Student Selector (PREMIUM Teachers Only) */}
          {isPremiumTeacher && ["syllabus", "my-courses"].includes(currentView) && (
            <div className="mb-6 bg-white px-6 py-4 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-4 overflow-x-auto custom-scrollbar flex-shrink-0">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Select Student:</span>
              {teacherStudents.length === 0 ? (
                <span className="text-sm text-gray-500 italic">No students in roster. Add them in Management!</span>
              ) : (
                <div className="flex gap-2">
                  {currentView === "syllabus" && (
                    <button onClick={() => setSelectedStudentUsername(null)} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition whitespace-nowrap ${selectedStudentUsername === null ? 'border-brand-orange text-brand-orange bg-orange-50 font-bold' : 'border-gray-200 text-gray-500 font-medium hover:border-brand-orange hover:bg-orange-50/50'}`}>
                      Class Insights
                    </button>
                  )}
                  {teacherStudents.map(student => {
                    const isSelected = selectedStudentUsername === student.username;
                    return (
                      <button key={student.username} onClick={() => setSelectedStudentUsername(student.username)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition whitespace-nowrap ${isSelected ? 'border-brand-blue bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-brand-blue hover:bg-blue-50/50'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden ${isSelected ? 'bg-brand-blue text-white border-2 border-brand-blue' : 'bg-brand-blue/10 text-brand-blue'}`}>
                          {student.photo || student.Photo ? <img src={student.photo || student.Photo} alt={student.name} className="w-full h-full object-cover" /> : (student.name ? student.name.charAt(0).toUpperCase() : 'U')}
                        </div>
                        <span className={`text-sm ${isSelected ? 'font-bold text-brand-blue' : 'font-medium text-gray-700'}`}>{student.name ? student.name.split(' ')[0] : student.username}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* The Actual Current View Component */}
          <div className={`relative flex-1 min-h-0 flex flex-col bg-white rounded-[32px] shadow-xl border border-gray-100 transition-all duration-300 ${currentView === "report" ? "p-0 overflow-hidden" : "p-6 overflow-y-auto dashboard-content-scroll"}`}>
            <div className={`relative w-full ${currentView === "report" ? "h-full" : "min-h-full"} rounded-[8px]`}>
              {currentView === "profile" && <Profile />}
              {currentView === "schedule" && <Calendar role={userData.Role || "student"} currentUserId={userData._id} />}
              {currentView === "syllabus" && <SyllabusTracker role={userData.Role || "student"} selectedStudentUsername={selectedStudentUsername} />}
              {currentView === "my-courses" && <MyCourses role={userData.Role} selectedStudentUsername={selectedStudentUsername || undefined} />}
              {currentView === "settings" && <SettingsPanel userData={userData} setUserData={setUserData} />}
              {currentView === "saved-posts" && <SavedPosts userData={userData} setUserData={setUserData} />}
              {currentView === "my-posts" && <MyPosts userData={userData} setUserData={setUserData} />}
              {currentView === "report" && userData?.Role?.toLowerCase() === "student" && <PlanetryPath />}
              {currentView === "management" && isPremiumTeacher && <StudentManagement userData={userData} />}
              {currentView === "manage-users" && userData?.isAdmin && <Admin userData={userData} setUserData={setUserData} />}
              {currentView === "admin-audit-log" && userData?.isAdmin && <AdminAuditLog />}
            </div>
          </div>
        </div>
      </div>

      {/* THE UNLOCK MODAL */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl relative animate-in zoom-in duration-200">
            <button onClick={() => setShowUnlockModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition">✕</button>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-brand-blue w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Unlock Academy</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Are you an official educator at Cute Learning? Request admin approval to access student management and syllabus tools.</p>
            
            <button 
              onClick={handleRequestApproval}
              disabled={isRequesting || userData.staffApprovalRequested}
              className={`w-full py-3.5 rounded-xl font-black transition active:scale-95 shadow-lg ${
                userData.staffApprovalRequested 
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none" 
                  : "bg-brand-orange text-white hover:bg-orange-600 shadow-orange-500/20"
              }`}
            >
              {isRequesting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> SENDING...
                </span>
              ) : userData.staffApprovalRequested ? (
                "REQUEST PENDING"
              ) : (
                "REQUEST APPROVAL"
              )}
            </button>
          </div>
        </div>
      )}

      {showAlert && <Muialert message={alertMessage} severity={alertSeverity} onClose={() => setShowAlert(false)} />}
    </div>
  );
};

export default Dashboard;