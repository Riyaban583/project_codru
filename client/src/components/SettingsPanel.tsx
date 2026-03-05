import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

// Components & Context
import Muialert from "./Muialert";
import { ThemeContext } from "../context/ThemeContext";

const username = localStorage.getItem("Username");
const role = localStorage.getItem("Role");

// --- 1. GENERAL SETTINGS ---
const GeneralSettings = () => {
  // Note: Ensure your ThemeContext is typed correctly in its own file!
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="animate-fade-in-up">
      <h3 className="text-xl font-display font-bold text-brand-blue mb-4">Appearance</h3>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="font-bold text-gray-800">Theme Preference</h4>
          <p className="text-sm text-gray-500 font-body">Switch between Light and Dark mode.</p>
        </div>
        
        {/* Beautiful Tailwind Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={theme === "dark" || theme === true} 
            onChange={toggleTheme} 
          />
          <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-orange"></div>
        </label>
      </div>
    </div>
  );
};

// --- 2. ACCOUNT SETTINGS ---
const AccountSettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Custom Alert State
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<"success" | "error" | "info" | "warning">("info");
  
  const navigate = useNavigate();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API}change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, currentPassword, newPassword }),
      });

      if (response.ok) {
        setAlertSeverity("success");
        setAlertMessage("Password changed successfully!");
        setShowAlert(true);
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setAlertSeverity("error");
        setAlertMessage("Error changing password. Please check your current password.");
        setShowAlert(true);
      }
    } catch (error) {
      setAlertSeverity("error");
      setAlertMessage("Network error. Could not change password.");
      setShowAlert(true);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "🚨 Are you absolutely sure you want to delete your account? This action CANNOT be undone."
    );

    if (!confirmDelete) return;

    setAlertSeverity("info");
    setAlertMessage("Deleting account... Please wait.");
    setShowAlert(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API}user/${username}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        localStorage.clear();
        setAlertSeverity("success");
        setAlertMessage("Account deleted successfully.");
        setShowAlert(true);
        setTimeout(() => navigate("/"), 2000);
      } else {
        throw new Error("Failed to delete user");
      }
    } catch (error) {
      setAlertSeverity("error");
      setAlertMessage("Failed to delete user account.");
      setShowAlert(true);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Change Password Section */}
      <h3 className="text-xl font-display font-bold text-brand-blue mb-4">Security</h3>
      <form onSubmit={handlePasswordChange} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-5">
        <TextField
          label="Current Password"
          type={showCurrentPassword ? "text" : "password"}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          fullWidth
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                  {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="New Password"
          type={showNewPassword ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          fullWidth
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                  {showNewPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <div className="flex justify-end mt-2">
          <Button 
            type="submit" 
            variant="contained" 
            sx={{ 
              backgroundColor: '#1765a4', 
              borderRadius: '10px', 
              textTransform: 'none', 
              fontWeight: 'bold',
              paddingX: 4,
              '&:hover': { backgroundColor: '#124d7d' } 
            }}
          >
            Update Password
          </Button>
        </div>
      </form>

      {/* Danger Zone Section */}
      <h3 className="text-xl font-display font-bold text-red-600 mb-4 mt-10">Danger Zone</h3>
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-red-800">Delete Account</h4>
          <p className="text-sm text-red-600 font-body">
            Caution: Deleting your account is permanent and cannot be undone. All your data will be wiped.
          </p>
        </div>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-all shadow-md shadow-red-500/20 whitespace-nowrap"
        >
          Delete Account
        </button>
      </div>

      {showAlert && <Muialert message={alertMessage} severity={alertSeverity} onClose={() => setShowAlert(false)} />}
    </div>
  );
};

// --- 3. NOTIFICATION SETTINGS ---
const NotificationSettings = () => (
  <div className="animate-fade-in-up">
    <h3 className="text-xl font-display font-bold text-brand-blue mb-4">Email & Alerts</h3>
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <FormControlLabel
        control={<Checkbox defaultChecked sx={{ color: '#ed7f23', '&.Mui-checked': { color: '#ed7f23' } }} />}
        label={<span className="font-bold text-gray-800">Enable Push Notifications</span>}
      />
      <p className="text-sm text-gray-500 font-body ml-8">
        Receive alerts for new courses, messages, and platform updates.
      </p>
    </div>
  </div>
);

// --- 4. MAIN PARENT COMPONENT ---
const SettingsPanel = () => {
  const [activeTab, setActiveTab] = useState("general");

  const renderContent = () => {
    switch (activeTab) {
      case "general": return <GeneralSettings />;
      case "account": return <AccountSettings />;
      case "notifications": return <NotificationSettings />;
      default: return <GeneralSettings />;
    }
  };

  return (
    <div className="w-full">
      {/* Settings Header & Tabs */}
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-brand-blue mb-6">Settings</h2>
        
        {/* Modern Tailwind Tabs */}
        <div className="flex space-x-8 border-b border-gray-200">
          {["general", "account", "notifications"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors duration-200 ${
                activeTab === tab 
                  ? "border-b-2 border-brand-orange text-brand-orange" 
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="pt-2">
        {renderContent()}
      </div>
    </div>
  );
};

export default SettingsPanel;