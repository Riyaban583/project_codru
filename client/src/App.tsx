import { useEffect, useState } from "react";
import { Route, Routes, useLocation, Navigate, useSearchParams } from "react-router-dom"; 
// Add this to your imports at the top
import { registerSW } from 'virtual:pwa-register';
import PwaInstallPrompt from "./PwaInstallPrompt";
import CommunicationPortal from './components/CommunicationPortal';

// --- TYPESCRIPT DEFINITIONS ---
export interface UserData {
  _id: string;
  Name: string;
  Photo: string;
  Role: string;
  isAdmin: boolean;
  isVerifiedStaff: boolean;
  staffApprovalRequested: boolean;
  isVerifiedParent: boolean;
  parentVerificationRequested: boolean;  
}

// --- IMPORTS ---
import Home from "./components/Home";
import Signin from "./components/Signin";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar";
import Signup from "./components/Signup";
import TaskForm from "./components/TaskForm";
import SinglePost from "./components/SinglePost";
import Publicprofile from "./components/Publicprofile"; 
import Popup from "./components/Popup";
import NotFound from "./components/NotFound";


function App() {
  const [userData, setUserData] = useState<UserData>({
    _id: "",
    Name: "",
    Photo: "",
    Role: "",
    isAdmin: false,
    isVerifiedStaff: false,
    staffApprovalRequested: false,
    isVerifiedParent: false,
    parentVerificationRequested: false,
  });
  
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServerVerified, setIsServerVerified] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams(); // 🚨 Added for 'new=true' logic
  const [showRolePopup, setShowRolePopup] = useState(false);

  const location = useLocation();

  const isAuth = !!localStorage.getItem("jwtoken");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerSW({ immediate: true });
    }

    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("System notifications enabled!");
        }
      });
    }
  }, []);

  // Inside App.tsx or main.tsx


  useEffect(() => {
  const initializeAuth = async () => {
    const tokenFromUrl = searchParams.get('token');
    const isNewUser = searchParams.get('new') === 'true'; // True or False

    // 1. Handle Google Token if it exists
    if (tokenFromUrl) {
      localStorage.setItem("jwtoken", tokenFromUrl);
    }

    // 2. 🚀 CATCH THE NEW USER FLAG INTO STATE
    if (isNewUser) {
      setShowRolePopup(true); 
    }

    // 3. 🧹 CLEANUP: Run this if EITHER parameter exists
    if (tokenFromUrl || isNewUser) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('token');
      newParams.delete('new');
      setSearchParams(newParams, { replace: true });
    }

    // 4. Proceed to fetch profile
    const activeToken = localStorage.getItem("jwtoken");
    if (activeToken) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API}profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${activeToken}`
          }
        });

        const data = await res.json();
        
        if (res.ok && data.user) {
          localStorage.setItem("Username", data.user.username);
          localStorage.setItem("userId", data.user._id);
          localStorage.setItem("Photo", data.user.photo || "");
          localStorage.setItem("Name", data.user.name || "");
          
          setUserData({
            _id: data.user._id,
            Photo: data.user.photo?.toString() || "",
            Name: data.user.name?.toString() || "",
            Role: data.user.role?.toString() || "",
            isAdmin: data.user.isAdmin || false, 
            isVerifiedStaff: data.user.isVerifiedStaff || false,
            staffApprovalRequested: data.user.staffApprovalRequested || false,
            isVerifiedParent: data.user.isVerifiedParent || false,
            parentVerificationRequested: data.user.parentVerificationRequested || false,
          });
          setIsServerVerified(true);
        }
      } catch (error) {
        console.error("Network error fetching user profile:", error);
      } finally {
        setIsAuthLoading(false);
      }
    } else {
      setIsAuthLoading(false);
    }
  };

  initializeAuth();
}, []);

  const hideNavbar = 
    location.pathname.startsWith("/dashboard") || 
    location.pathname.startsWith("/admin") || 
    location.pathname.startsWith("/assign-task");

  // 🚨 NEW: Public Route Component to block authenticated users from login/signup pages
  const PublicRoute = ({ children }: { children: JSX.Element }) => {
    // Show spinner while checking auth state
    if (isAuthLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    // If they already have a token, redirect them to the dashboard
    if (localStorage.getItem("jwtoken")) {
      return <Navigate to="/dashboard" replace />;
    }
    
    // If they don't have a token, let them through
    return children;
  };

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (isAuthLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    if (!localStorage.getItem("jwtoken")) {
      // 🚨 REDIRECT BACK: Save the current path before kicking to signin
      sessionStorage.setItem("redirectPath", location.pathname);
      return <Navigate to="/signin" replace />;
    }
    return children;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-brand-orange selection:text-white">
      <PwaInstallPrompt />
      
      {!hideNavbar && <Navbar userData={userData} setUserData={setUserData} />}

      <Popup 
        isOpen={showRolePopup} 
        onRoleSelected={(newRole) => {
          // Save the role to local state
          setUserData(prev => ({ ...prev, Role: newRole }));
          
          // 🚨 Close the popup forever!
          setShowRolePopup(false); 
        }} 
      />

      {!isOnline ? (
        <NotFound mode="offline" />
      ) : (
        <>
        <Routes>
          <Route path="/post/:postId" element={<SinglePost userData={userData} />} />
          <Route path="/profile/:username" element={<Publicprofile />} />
          <Route path="/" element={<Home userData={userData} />} />


          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/signin" element={<PublicRoute><Signin userData={userData} setUserData={setUserData} /></PublicRoute>} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard userData={userData} setUserData={setUserData} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/update-report/:username" 
            element={
              <ProtectedRoute>
                <TaskForm />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<NotFound />} />
        </Routes>

        {isAuth && <CommunicationPortal />}
        </>
      )}
    </div>
  );
}

export default App;