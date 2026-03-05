import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Email, Lock, Phone, Person, Badge as BadgeIcon 
} from "@mui/icons-material";
import {
  TextField, Button, InputAdornment, Checkbox, Dialog, DialogContent, Select, MenuItem
} from "@mui/material";
import { MuiOtpInput } from "mui-one-time-password-input";
import MicrosoftLogin from "react-microsoft-login";

// Components & Assets
import SignUpAnim from "./SignUpAnim";
import FunDatePicker from "./FunDatePicker";
import Muialert from "./Muialert";
import GoogleIcon from "../assets/google.svg";
import MicrosoftIcon from "../assets/microsoft.svg";

function Signup() {
  const [value, setValue] = useState({
    name: "",
    email: "",
    password: "",
    cpassword: "",
    phone: "",
    username: "",
    dob: "",
    role: "Student",
    declaration: false,
    otp: "",
    isEmailVerified: false,
  });

  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [countryCode, setCountryCode] = useState("+91");
  const navigate = useNavigate();

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value: val } = e.target;
    setValue((prev) => ({
      ...prev,
      [name]: val,
      ...(name === "email" && { isEmailVerified: false }),
    }));
  };

  const handleEmailVerification = async () => {
    setLoading(false);
    const res = await fetch(`${import.meta.env.VITE_API}generate-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: value.email }),
    });

    if (res.ok) {
      setOpen(true);
      setTimer(60);
      setLoading(true);
    } else {
      setLoading(true);
    }
  };

  const handleOtpComplete = async (finalValue: string) => {
    const res = await fetch(`${import.meta.env.VITE_API}verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: value.email, otp: finalValue }),
    });

    if (res.ok) {
      setValue((prev) => ({ ...prev, isEmailVerified: true }));
      setOpen(false);
    } else {
      const data = await res.json();
      setAlertMessage(data.error || "OTP Verification Failed");
      setShowAlert(true);
    }
  };

  const PostData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.isEmailVerified) {
      setAlertMessage("Please verify your email first.");
      setShowAlert(true);
      return;
    }

    const res = await fetch(`${import.meta.env.VITE_API}register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (res.ok) navigate("/signin");
  };

  useEffect(() => {
    if (timer && timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setOpen(false);
    }
  }, [timer]);

  return (
    <div className="min-h-screen pt-20 pb-12 flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
        
        {/* Left Side: Animation & Branding */}
        <div className="md:w-1/2 bg-brand-blue p-12 flex flex-col justify-center items-center text-white">
          <div className="w-full max-w-sm mb-8">
             <SignUpAnim />
          </div>
          <h1 className="text-3xl font-display font-bold mb-4 text-center">Join the Curious Team</h1>
          <p className="text-blue-100 text-center font-body opacity-80">
            Start your journey of education with empathy and discovery.
          </p>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-1/2 p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-brand-blue">Create Account</h2>
            <p className="text-gray-500 mt-2 font-body">Fill in the details below to get started</p>
          </div>

          <form onSubmit={PostData} className="flex flex-col gap-5">
            <TextField
              fullWidth
              variant="outlined"
              name="name"
              placeholder="Full Name"
              value={value.name}
              onChange={handleChange}
              required
              InputProps={{ startAdornment: (<InputAdornment position="start"><BadgeIcon className="text-brand-blue" /></InputAdornment>) }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              fullWidth
              variant="outlined"
              name="username"
              placeholder="Username"
              value={value.username}
              onChange={handleChange}
              required
              InputProps={{ startAdornment: (<InputAdornment position="start"><Person className="text-brand-blue" /></InputAdornment>) }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              fullWidth
              variant="outlined"
              name="email"
              placeholder="Email Address"
              value={value.email}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (<InputAdornment position="start"><Email className="text-brand-blue" /></InputAdornment>),
                endAdornment: (
                  <InputAdornment position="end">
                    {!value.isEmailVerified && value.email && (
                      <button 
                        type="button"
                        onClick={handleEmailVerification}
                        className="text-xs font-bold text-brand-orange hover:underline disabled:opacity-50"
                        disabled={!!timer}
                      >
                        {timer ? `Resend in ${timer}s` : "Verify"}
                      </button>
                    )}
                    {value.isEmailVerified && <span className="text-green-500">✔</span>}
                  </InputAdornment>
                )
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                fullWidth
                variant="outlined"
                name="password"
                type="password"
                placeholder="Password"
                value={value.password}
                onChange={handleChange}
                required
                InputProps={{ startAdornment: (<InputAdornment position="start"><Lock className="text-brand-blue" /></InputAdornment>) }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                variant="outlined"
                name="cpassword"
                type="password"
                placeholder="Confirm"
                value={value.cpassword}
                onChange={handleChange}
                required
                InputProps={{ startAdornment: (<InputAdornment position="start"><Lock className="text-brand-blue" /></InputAdornment>) }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </div>

            {/* --- NEW PHONE NUMBER LAYOUT --- */}
            <div className="flex gap-3">
              <Select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value as string)}
                sx={{
                  minWidth: '130px',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1765a4' },
                }}
              >
                <MenuItem value="+91">+91 (IN)</MenuItem>
                <MenuItem value="+1">+1 (US)</MenuItem>
                <MenuItem value="+44">+44 (UK)</MenuItem>
                {/* Add more as needed */}
              </Select>

              <TextField
                fullWidth
                variant="outlined"
                name="phone"
                placeholder="Phone Number"
                value={value.phone}
                onChange={handleChange}
                required
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '12px',
                    backgroundColor: 'white'
                  } 
                }}
              />
            </div>

            {/* --- DATE OF BIRTH LAYOUT --- */}
            <div className="w-full [&>div]:w-full">
              <FunDatePicker 
                value={value.dob} 
                onChange={(newDate) => setValue({ ...value, dob: newDate || "" })} 
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 transform hover:-translate-y-0.5"
            >
              Create Account
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500 font-body">
            Already have an account? <NavLink to="/signin" className="text-brand-blue font-bold hover:underline">Sign In</NavLink>
          </p>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-400">Or continue with</span></div>
          </div>

          <div className="flex justify-center items-center gap-6">
            <button 
              onClick={() => window.location.href = `${import.meta.env.VITE_API}auth/google`}
              className="p-3 border border-gray-200 rounded-full hover:bg-gray-50 transition transform hover:scale-110"
            >
              <img src={GoogleIcon} alt="Google" className="w-6 h-6" />
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <MicrosoftLogin
              clientId="f8c7976f-3e93-482d-88a3-62a1133cbbc3"
              authCallback={() => {}}
              children={
                <button className="p-3 border border-gray-200 rounded-full hover:bg-gray-50 transition transform hover:scale-110">
                  <img src={MicrosoftIcon} alt="Microsoft" className="w-6 h-6" />
                </button>
              }
            />
          </div>
        </div>
      </div>

      {/* OTP Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <div className="p-8 text-center">
          <h3 className="text-xl font-display font-bold text-brand-blue mb-4">Verify Your Email</h3>
          <p className="text-gray-500 mb-6 text-sm">We've sent a 4-digit code to {value.email}</p>
          <MuiOtpInput
            length={4}
            autoFocus
            onComplete={handleOtpComplete}
            value={value.otp}
            onChange={(otp) => setValue({...value, otp})}
            gap={2}
          />
        </div>
      </Dialog>
      
      {showAlert && <Muialert message={alertMessage} severity="error" onClose={() => setShowAlert(false)} />}
    </div>
  );
}

export default Signup;