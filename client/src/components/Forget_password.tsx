import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TextField, InputAdornment } from "@mui/material";
import { Lock, LockReset } from "@mui/icons-material";

// Components
import Muialert from "./Muialert";

const ForgetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [cpassword, setCpassword] = useState("");
  
  // Alert State
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<"success" | "error">("error");

  const PostData = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== cpassword) {
      setAlertSeverity("error");
      setAlertMessage("Passwords do not match!");
      setShowAlert(true);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API}reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        setAlertSeverity("success");
        setAlertMessage("Password has been reset successfully! Redirecting...");
        setShowAlert(true);
        
        // Redirect to signin after a short delay so they see the success message
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      } else {
        setAlertSeverity("error");
        setAlertMessage(data.error || "Failed to reset password.");
        setShowAlert(true);
      }
    } catch (err) {
      setAlertSeverity("error");
      setAlertMessage("Network error. Failed to reset password.");
      setShowAlert(true);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <LockReset className="text-brand-blue" sx={{ fontSize: 36 }} />
          </div>
          <h2 className="text-2xl font-display font-bold text-brand-blue">Reset Password</h2>
          <p className="text-gray-500 text-center font-body mt-2">
            Please enter your new password below.
          </p>
        </div>

        {/* Form Section */}
        <form className="flex flex-col gap-5" onSubmit={PostData}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock className="text-brand-blue" />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Confirm New Password"
            type="password"
            value={cpassword}
            onChange={(e) => setCpassword(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock className="text-brand-blue" />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />

          <button
            type="submit"
            className="w-full bg-brand-orange text-white py-3 mt-2 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 transform hover:-translate-y-0.5"
          >
            Update Password
          </button>
        </form>

        {/* Replaced old text messages with your beautiful Muialert! */}
        {showAlert && (
          <Muialert
            message={alertMessage}
            severity={alertSeverity}
            onClose={() => setShowAlert(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ForgetPassword;