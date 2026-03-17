import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Pen, User, LogOut, FileText, Loader2 } from "lucide-react";
import Muialert from "./Muialert";

interface NavprofileProps {
  setShowProfile: (show: boolean) => void;
  showProfile: boolean;
  closeNavProfile: () => void;
  userData: any;
  setUserData: any;
}

export default function Navprofile({
  setShowProfile,
  closeNavProfile,
  userData,
  setUserData,
}: NavprofileProps) {
  const [showAlert, setShowAlert] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navProfileRef = useRef<HTMLDivElement>(null);

  const SignOut = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API}signout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      localStorage.removeItem("jwtoken"); 
      localStorage.removeItem("Username");
      setUserData({});
      closeNavProfile();
      navigate("/signin");
      window.location.reload(); // Hard reset to clear memory
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  // 2. FIXED API URL
const handlePhotoInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Send the image straight to Cloudinary first
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "cute_profiles"); // <-- CHANGE THIS
      formData.append("cloud_name", "da6jhcsmm");       // <-- CHANGE THIS

      const cloudinaryRes = await fetch(
        "https://api.cloudinary.com/v1_1/da6jhcsmm/image/upload", // <-- CHANGE THIS
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudinaryData = await cloudinaryRes.json();

      if (!cloudinaryRes.ok) {
        throw new Error("Failed to upload to Cloudinary");
      }

      // This is the clean, secure URL from Cloudinary
      const secureUrl = cloudinaryData.secure_url;

      // 2. Immediately tell your backend to save this new URL
      const dbRes = await fetch(`${import.meta.env.VITE_API}profile-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: localStorage.getItem("Username"),
          photo: secureUrl, 
        }),
      });

      const jsondata = await dbRes.json();

      if (dbRes.ok) {
        // 3. Update the UI instantly without reloading the page!
        setUserData((prevData: any) => ({
          ...prevData,
          Photo: secureUrl,
        }));
        
        // Update local storage so a hard refresh keeps the photo
        localStorage.setItem("Photo", secureUrl);

        setAlertMessage("Profile picture updated!");
        setShowAlert(true);
      } else {
        throw new Error(jsondata.error || "Failed to update database");
      }
    } catch (err: any) {
      console.error(err);
      setAlertMessage(err.message || "Failed to update image");
      setShowAlert(true);
    } finally {
      setIsUploading(false);
      // Reset the input so the user can upload the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePenClick = () => fileInputRef.current?.click();

  const handleClickOutside = (event: MouseEvent) => {
    if (navProfileRef.current && !navProfileRef.current.contains(event.target as Node)) {
      closeNavProfile();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    // The "absolute top-20 right-4" is what makes it float beautifully under the navbar
    <div 
      ref={navProfileRef} 
      className="absolute top-20 right-4 md:right-8 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-50 transform origin-top-right transition-all"
    >
      {/* Close Button */}
      <button 
        onClick={() => setShowProfile(false)}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Profile Header */}
      <div className="flex flex-col items-center mt-2 mb-4">
        <div className="relative group cursor-pointer" onClick={handlePenClick}>
          <div className="w-20 h-20 rounded-full border-4 border-brand-orange/20 overflow-hidden relative">
            
            {/* The Loading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
              </div>
            )}

            {userData?.Photo ? (
              <img src={userData.Photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-orange-50 flex items-center justify-center text-brand-orange">
                <User className="w-8 h-8" />
              </div>
            )}
          </div>
          
          <div className="absolute bottom-0 right-0 bg-brand-blue text-white p-1.5 rounded-full shadow-md group-hover:bg-brand-orange transition-colors z-20">
            <Pen className="w-3 h-3" />
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handlePhotoInput} />
        </div>
        
        <h3 className="mt-3 font-display font-bold text-lg text-gray-800">Hi, {userData?.Name || "Explorer"}</h3>
        <p className="text-xs text-gray-400 font-medium">@{localStorage.getItem("Username")}</p>
      </div>

      <hr className="border-gray-100 my-4" />

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => { 
            navigate("/dashboard", { state: { targetView: "report" } }); 
          }}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm font-bold text-brand-blue bg-blue-50 rounded-xl hover:bg-brand-blue hover:text-white transition-colors"
        >
          <FileText className="w-4 h-4" /> See My Report
        </button>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button 
            onClick={() => { closeNavProfile(); navigate(`/public-profile/${localStorage.getItem("Username")}`); }}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-brand-orange hover:text-brand-orange transition-colors"
          >
            <User className="w-4 h-4" /> Manage
          </button>
          
          <button 
            onClick={SignOut}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-100 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {showAlert && (
        <div className="mt-4">
          <Muialert message={alertMessage} severity="error" onClose={() => setShowAlert(false)} />
        </div>
      )}
    </div>
  );
}