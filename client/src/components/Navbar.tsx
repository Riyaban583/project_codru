import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, Bell, LayoutDashboard, User } from "lucide-react";
import GlobalSearch from "./GlobalSearch";
import { UserData } from "../App"; 

import Navprofile from "./Navprofile";
import Notification from "./Notification";

interface NavbarProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

function Navbar({ userData, setUserData }: NavbarProps) {
  const [showLinks, setShowLinks] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); 

  const toggleLinks = () => setShowLinks(!showLinks);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showProfile) setShowProfile(false);
  };

  const closeNotification = () => setShowNotifications(false);
  const closeNavProfile = () => setShowProfile(false);

  const isLoggedIn = !!localStorage.getItem("jwtoken");

  // 🚨 Define your main website URL here so it's easy to change!
  const MAIN_SITE = "https://www.curiousteamlearning.com"; 

  const staticLinkStyle = "text-gray-600 hover:text-brand-orange font-medium transition-colors";
  // 🚨 NEW: Mobile-specific link styling with 'block' so they stack vertically
  const mobileLinkStyle = "block px-3 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-brand-orange hover:bg-gray-50 transition-colors";

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-md font-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo (Points back to Main Site Home) */}
            <a href={`${MAIN_SITE}/index.html`} className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <img className="w-[6.5rem] h-auto block drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]" src="/logo.svg" alt="CuTe Learning" draggable="false" />
            </a>

            <GlobalSearch />

            {/* 🚨 Desktop Nav */}
            <nav className="hidden md:flex space-x-8">
              <a href={`${MAIN_SITE}/about.html`} target="_blank" rel="noopener noreferrer" className={staticLinkStyle}>About Us</a>
              <a href={`${MAIN_SITE}/index.html#skills`} target="_blank" rel="noopener noreferrer" className={staticLinkStyle}>Learn</a>
              <a href={`${MAIN_SITE}/index.html#pricing`} target="_blank" rel="noopener noreferrer" className={staticLinkStyle}>Pricing</a>
              <a href={`${MAIN_SITE}/blog/index.html`} target="_blank" rel="noopener noreferrer" className={staticLinkStyle}>Blog</a>
              <a href={`${MAIN_SITE}/contact.html`} target="_blank" rel="noopener noreferrer" className={staticLinkStyle}>Contact Us</a>
            </nav>

            {/* Desktop Login Button / Profile Actions */}
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <div className="hidden md:flex items-center space-x-6">
                  
                  {/* Dashboard Link */}
                  <NavLink 
                    to="/dashboard" 
                    className="text-gray-400 hover:text-brand-blue transition transform hover:scale-110"
                    onClick={() => {
                      localStorage.setItem("currentView", "dashboard");
                      localStorage.setItem("activeTab", "Dashboard");
                    }}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </NavLink>

                  {/* Notifications Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      toggleNotifications();
                    }}
                    className="text-gray-400 hover:text-brand-orange transition transform hover:scale-110 relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Profile Picture */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfile(!showProfile);
                      setShowNotifications(false);
                      setShowLinks(false);
                    }}
                    className="w-10 h-10 rounded-full border-2 border-brand-orange p-0.5 overflow-hidden focus:outline-none transition transform hover:scale-105 relative"
                  >
                    {userData.Photo ? (
                      <img src={userData.Photo} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange">
                         <User className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <NavLink to="/signin" className="hidden md:inline-flex bg-brand-blue text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Login
                </NavLink>
              )}

              {/* Mobile Menu Toggle Button */}
              <button id="mobile-menu-btn" onClick={toggleLinks} className="md:hidden text-gray-600 hover:text-brand-orange p-2 focus:outline-none transition-colors">
                {showLinks ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
        
        {/* 🚨 Mobile Nav Dropdown (Now with fixed stacking CSS) */}
        {showLinks && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0">
            <div className="px-4 pt-2 pb-4 space-y-1">
              <a href={`${MAIN_SITE}/about.html`} target="_blank" rel="noopener noreferrer" className={mobileLinkStyle}>About Us</a>
              <a href={`${MAIN_SITE}/index.html#skills`} target="_blank" rel="noopener noreferrer" className={mobileLinkStyle}>Learn</a>
              <a href={`${MAIN_SITE}/index.html#pricing`} target="_blank" rel="noopener noreferrer" className={mobileLinkStyle}>Pricing</a>
              <a href={`${MAIN_SITE}/blog/index.html`} target="_blank" rel="noopener noreferrer" className={mobileLinkStyle}>Blog</a>
              <a href={`${MAIN_SITE}/contact.html`} target="_blank" rel="noopener noreferrer" className={mobileLinkStyle}>Contact Us</a>

              {/* If NOT logged in, show the login button here */}
              {!isLoggedIn && (
                <div className="pt-4 px-2">
                  <NavLink to="/signin" onClick={toggleLinks} className="flex justify-center w-full bg-brand-blue text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition shadow-md">
                    Login
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- POPUPS --- */}
        {showProfile && isLoggedIn && (
          <Navprofile 
            setShowProfile={setShowProfile} 
            showProfile={showProfile} 
            closeNavProfile={closeNavProfile} 
            userData={userData} 
            setUserData={setUserData} 
          />
        )}

        {isLoggedIn && (
          <Notification 
            setShowNotifications={setShowNotifications} 
            showNotifications={showNotifications} 
            closeNotification={closeNotification} 
            setUnreadCount={setUnreadCount} 
          />
        )}
      </header>

      {/* =========================================
          🚨 NEW: MOBILE BOTTOM NAVBAR 
          ========================================= */}
      {isLoggedIn && (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50 pb-safe">
          <div className="flex justify-around items-center h-16 px-2">
            
            {/* Dashboard Bottom Button */}
            <NavLink 
              to="/dashboard" 
              onClick={() => {
                localStorage.setItem("currentView", "dashboard");
                localStorage.setItem("activeTab", "Dashboard");
                setShowLinks(false);
                setShowProfile(false);
                setShowNotifications(false);
              }} 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-brand-blue' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutDashboard className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">Dashboard</span>
            </NavLink>

            {/* Notifications Bottom Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation(); 
                toggleNotifications();
                setShowLinks(false);
              }}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${showNotifications ? 'text-brand-orange' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className="relative">
                <Bell className="w-6 h-6 mb-1" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold">Alerts</span>
            </button>

            {/* Profile Bottom Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation(); // 🚨 AND ADD IT HERE!
                setShowProfile(!showProfile);
                setShowNotifications(false);
                setShowLinks(false);
              }}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${showProfile ? 'text-brand-orange' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {userData.Photo ? (
                <div className={`w-7 h-7 mb-1 rounded-full overflow-hidden border-2 transition-colors ${showProfile ? 'border-brand-orange' : 'border-transparent'}`}>
                  <img src={userData.Photo} alt="Profile" className="w-full h-full object-cover" />
                </div>
              ) : (
                <User className="w-6 h-6 mb-1" />
              )}
              <span className="text-[10px] font-bold">Profile</span>
            </button>

          </div>
        </nav>
      )}
    </>
  );
}

export default Navbar;