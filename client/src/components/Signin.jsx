import { useState } from "react";
import "../styles/Signin.css";
import { NavLink } from "react-router-dom";
// import signinAnimation from "../assets/signinAnimation.png";
// import c3 from "../assets/c3.png";
import Muialert from "./Muialert";
import { Lock, Person } from "@mui/icons-material";
import { TextField, Button, InputAdornment } from "@mui/material";
import GoogleIcon from "../assets/google.svg";
import FacebookIcon from "../assets/facebook-color.svg";
import MicrosoftIcon from "../assets/microsoft.svg";
import { useNavigate } from "react-router-dom";
import SignInAnim from "./SignInAnim";
import Navbar from "./Navbar";

const handleGoogleLoginSuccess = (credentialResponse) => {
  console.log("Google Login Success:", credentialResponse);

  // Send the token to your backend for verification
  fetch(`${import.meta.env.VITE_API}google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: credentialResponse.credential }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("User data from backend:", data);

      // Save user data in state
      setUserData({
        Photo: data.photo,
        Name: data.name,
        Role: data.role,
        isAdmin: data.isAdmin,
      });

      // Save token and username in localStorage
      localStorage.setItem("Token", data.token);
      localStorage.setItem("Username", data.username);

      // Navigate to the home page
      navigate("/");
    })
    .catch((error) => {
      console.error("Error during Google login:", error);
      setAlertMessage("Google Sign-In failed. Please try again.");
      setShowAlert(true);
    });
};

const handleGoogleLoginFailure = (error) => {
  console.error("Google Login Failed:", error);
  setAlertMessage("Google Sign-In failed. Please try again.");
  setShowAlert(true);
};

function Signin({  userData, setUserData }) {
  const [showAlert, setShowAlert] = useState(false); // State to control alert visibility
  const [alertMessage, setAlertMessage] = useState(""); // State to store alert message
  const navigate = useNavigate();

  const [value, setValue] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValue((prevValue) => ({
      ...prevValue,
      [name]: value,
    }));
  };

  const PostData = async (e) => {
    e.preventDefault();
    const { username, password } = value;
    console.log(value);
    const res = await fetch(`${import.meta.env.VITE_API}signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    const jsonresponse = await res.json();
    if (res.ok) {
      setAlertMessage(jsonresponse.message);
      setShowAlert(true);

      const Photo = jsonresponse.photo.toString();
      const Name = jsonresponse.name.toString();
      const Role = jsonresponse.role.toString();
      const isAdmin = jsonresponse.isAdmin;

      setUserData({
        Photo,
        Name,
        Role,
        isAdmin,
      });

      localStorage.setItem("Token", jsonresponse.token);
      localStorage.setItem("Username", jsonresponse.username);

      navigate("/");
    } else {
      console.error("Failed to Sign In");
      setAlertMessage(jsonresponse.error || "Failed to Sign In");
      setShowAlert(true);
    }
  };

  const sendMail = async (e) => {
    e.preventDefault();
    const { username } = value;

    if (!username) {
      setAlertMessage("Please enter your username to reset the password");
      setShowAlert(true);
      return;
    }

    const res = await fetch(`${import.meta.env.VITE_API}reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
      }),
    });
    const jsonresponse = await res.json();
    if (res.ok) {
      console.log("Sent successfully");
      setAlertMessage("Password reset link sent to your email");
      setShowAlert(true);
    } else {
      console.error("Failed to send mail");
      setAlertMessage(jsonresponse.error || "Failed to send mail");
      setShowAlert(true);
    }
  };
  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  return (
    <div className="signindiv">
      {/* <Navbar userData={userData} setUserData={setUserData} /> */}
      <div className="signindiv1">
        <div className="img">
          <SignInAnim />
        </div>

        <form className="signindiv2" onSubmit={PostData}>
          <h2 className="signin">Sign In</h2>

          <div className="username-input">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Username"
              name="username"
              value={value.username}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />
          </div>

          <div className="password-input">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Password"
              name="password"
              type="password"
              value={value.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
              }}
            />
          </div>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            className="signinnormal"
            onClick={PostData}
            sx={{ width: "70%" }}
          >
            Sign in
          </Button>
          <input type="submit" style={{ display: "none" }} />

          <div className="donothave">
            <p>
              Don't have an account? <NavLink to="/signup">Sign up</NavLink>
            </p>
            <p>
              Forgotten Password?{" "}
              <span className="forgot-password-link" onClick={sendMail}>
                Change Password
              </span>
            </p>
          </div>

          <div className="donothave">
            <p>------ or Try! ------</p>
          </div>

          <div className="external">
            <div className="icon-wrapper">
              <img
                src={GoogleIcon}
                alt="Google"
                className="icon"
                onClick={() => googleLogin()}
                style={{ cursor: "pointer" }}
              />
            </div>
            <span className="separator">|</span>
            <div
              className="icon-wrapper"
              onClick={() => console.log("Continue with Facebook")}
            >
              <img src={FacebookIcon} alt="Facebook" className="icon" />
            </div>
            <span className="separator">|</span>
            <div
              className="icon-wrapper"
              onClick={() => console.log("Continue with Microsoft")}
            >
              <img src={MicrosoftIcon} alt="Microsoft" className="icon" />
            </div>
          </div>
        </form>
      </div>

      {showAlert && (
        <Muialert
          message={alertMessage}
          severity="error"
          onClose={handleCloseAlert}
        />
      )}
    </div>
  );
}

export default Signin;
