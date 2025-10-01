import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Muialert from "./Muialert";
import "../styles/Signup.css";
import s from "../assets/6430773-transformed.webp";
import { Email, Lock, Phone, Person } from "@mui/icons-material";
import SignUpAnim from "./SignUpAnim";
import "../styles/Spinner.css";
import {
  TextField,
  Radio,
  RadioGroup,
  Checkbox,
  Button,
  InputAdornment,
  FormControl,
  FormControlLabel,
  Dialog,
  DialogContent,
} from "@mui/material";
import BadgeIcon from "@mui/icons-material/Badge";
import GoogleIcon from "../assets/google.svg";
import { useGoogleLogin } from "@react-oauth/google";
// import FacebookIcon from "../assets/facebook-color.svg";
// import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";
import MicrosoftIcon from "../assets/microsoft.svg";
import MicrosoftLogin from "react-microsoft-login";
import { MuiOtpInput } from "mui-one-time-password-input";

function matchIsString(text) {
  return typeof text === "string";
}

function matchIsNumeric(text) {
  const isNumber = typeof text === "number";
  const isString = matchIsString(text);
  return (isNumber || (isString && text !== "")) && !isNaN(Number(text));
}

const validateChar = (value, index) => {
  return matchIsNumeric(value);
};

async function getAccessTokenFromCode(code) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.APP_ID_GOES_HERE,
      client_secret: process.env.APP_SECRET_GOES_HERE,
      redirect_uri: "https://www.example.com/authenticate/google",
      grant_type: "authorization_code",
      code,
    }),
  });

  const data = await response.json(); // Parse the JSON response
  console.log(data); // { access_token, expires_in, token_type, refresh_token }

  return data.access_token;
}

async function getGoogleUserInfo(access_token) {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  const data = await response.json(); // Parse the JSON response
  console.log(data); // { id, email, given_name, family_name }

  return data;
}

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
  const [microsoftUser, setMicrosoftUser] = useState(null);

  const navigate = useNavigate();

  const [click, handleClick] = useState(false);
  const [open, setOpen] = useState(false);
  const [timer, setTimer] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValue((prevValue) => ({
      ...prevValue,
      [name]: value,
      ...(name === "email" && { isEmailVerified: false }),
    }));
  };

  const handleOtpChange = (otp) => {
    setValue((prevValue) => ({
      ...prevValue,
      otp: otp,
    }));
  };

  const handleRoleChange = (e) => {
    const { value } = e.target;
    setValue((prevValue) => ({
      ...prevValue,
      role: value,
    }));
  };

  const handleComplete = (finalValue) => {
    handleOtpVerification(finalValue);
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setValue((prevValue) => ({
      ...prevValue,
      [name]: checked,
    }));
  };

  const handleEmailVerification = async () => {
    setLoading(false);
    const res = await fetch("https://codru-server.vercel.app/generate-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: value.email }),
    });

    if (res.ok) {
      console.log("Success");
      setOpen(true);
      setTimer(60);
      setValue((prevValue) => ({ ...prevValue, otp: "" }));
      setLoading(true);
    } else {
      console.error("Retry");
      setLoading(true);
    }
  };

  const handleOtpVerification = async (finalValue) => {
    console.log(finalValue);

    const res = await fetch("https://codru-server.vercel.app/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: value.email, otp: finalValue }),
    });

    if (res.ok) {
      const jsonresponse = await res.json();
      console.log("Email verified successfully");
      setValue((prevValue) => ({
        ...prevValue,
        isEmailVerified: true,
      }));
      setOpen(false);
      setAlertMessage(jsonresponse.message);
      setShowAlert(true);
    } else {
      const jsonresponse = await res.json();
      setAlertMessage(jsonresponse.error);
      setShowAlert(true);
      console.error("Failed to verify OTP");
    }
  };

  const PostData = async (e) => {
    e.preventDefault();
    const {
      name,
      email,
      phone,
      password,
      cpassword,
      username,
      dob,
      role,
      declaration,
      isEmailVerified,
    } = value;

    if (!isEmailVerified) {
      return console.error("Please verify your email before proceeding.");
    }

    const res = await fetch("https://codru-server.vercel.app/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        password,
        cpassword,
        username,
        dob,
        role,
        declaration,
      }),
    });

    const jsondata = res.json();
    if (res.ok) {
      console.log("User registered successfully");
      console.log("this is json data", jsondata);
      navigate("/signin");
    } else {
      console.error("Failed to register user");
      console.log("this is json data", jsondata);
    }
  };

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else {
      clearInterval(interval);
      setOpen(false);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log(tokenResponse);
    },
    onError: () => {
      console.log("Login Failed");
    },
  });

  const facebookLogin = (response) => {
    // Here, you would typically send the response data to your server for further processing
  };

  const microsoftLogin = (err, data) => {
    if (!err) {
      console.log(data);
      setMicrosoftUser(data);
    } else {
      console.error(err);
    }
  };

  const handleMicrosoftLogout = () => {
    setMicrosoftUser(null);
    console.log("Logged out from Microsoft");
  };

  return (
    <div className="signupdiv">
      <div className="signupdiv1">
        <SignUpAnim />
      </div>
      <div className="signupdiv2">
        <h2>Sign Up</h2>
        {/* <div className="terms">
          <FormControl component="fieldset">
            <RadioGroup
              aria-label="role"
              name="role"
              value={value.role}
              onChange={handleRoleChange}
            >
              <FormControlLabel
                value="Student"
                control={<Radio />}
                label="Student"
              />
              <FormControlLabel
                value="Teacher"
                control={<Radio />}
                label="Teacher"
              />
            </RadioGroup>
          </FormControl>
        </div> */}
        <div>
          <TextField
            className="text"
            fullWidth
            variant="outlined"
            name="name"
            placeholder="Full Name"
            value={value.name}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeIcon />
                </InputAdornment>
              ),
            }}
          />
        </div>
        <div>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Username"
            name="username"
            value={value.username}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person />
                </InputAdornment>
              ),
            }}
          />
        </div>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Email ID"
          name="email"
          type="email"
          value={value.email}
          onChange={handleChange}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {!value.isEmailVerified && value.email && (
                  <Button
                    onClick={handleEmailVerification}
                    variant="text"
                    style={{
                      fontSize: "11px",
                      textTransform: "none",
                      boxShadow: "none",
                      backgroundColor: "transparent",
                      pointerEvents: timer ? "none" : "auto",
                      outline: "none",
                    }}
                  >
                    {!loading ? (
                      <div className="spinner-container">
                        <div className="ios-spinner"></div>
                      </div>
                    ) : timer ? (
                      `Resend in ${timer}s`
                    ) : (
                      "Verify"
                    )}
                  </Button>
                )}
                {value.isEmailVerified && value.email && (
                  <span style={{ color: "green" }}>✔</span>
                )}
              </InputAdornment>
            ),
          }}
        />
        <div>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Password"
            name="password"
            type="password"
            value={value.password}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
            }}
          />
        </div>
        <div>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Re-enter Password"
            name="cpassword"
            type="password"
            value={value.cpassword}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
            }}
          />
        </div>
        <div>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Phone Number"
            name="phone"
            type="tel"
            value={value.phone}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone />
                </InputAdornment>
              ),
            }}
          />
        </div>
        <div>
          <TextField
            fullWidth
            variant="outlined"
            name="dob"
            helperText={click && "Fill in your date of birth."}
            type="date"
            value={value.dob}
            onChange={handleChange}
            onFocus={() => handleClick(true)}
          />
        </div>
        <div className="terms1">
          <label>
            <Checkbox
              name="declaration"
              checked={value.declaration}
              onChange={handleCheckboxChange}
            />
            <p> I've read the Terms of Service and Privacy Policy.</p>
          </label>
        </div>
        <Button
          variant="contained"
          color="primary"
          className="signupnormal"
          onClick={PostData}
        >
          Sign up
        </Button>
        <div className="alreadydiv">
          <p>
            Already have an account?<> </>
            <NavLink to="/signin">Signin</NavLink>
          </p>
        </div>
        <div className="divider">
          <span className="line"></span>
          <span className="or">Or, continue with</span>
          <span className="line"></span>
        </div>
        <div className="external-signup">
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

          <FacebookLogin
            appId="1088597931155576"
            autoLoad={false}
            fields="name,email,picture"
            scope="public_profile,user_friends,user_actions.books"
            callback={facebookLogin}
            cssClass="icon"
            render={(renderProps) => (
              <div className="icon-wrapper" onClick={renderProps.onClick}>
                <img src={FacebookIcon} alt="Facebook" className="icon" />
              </div>
            )}
          />

          <span className="separator">|</span>

          <MicrosoftLogin
            clientId={"f8c7976f-3e93-482d-88a3-62a1133cbbc3"}
            authCallback={microsoftLogin}
            className="icon-wrapper"
            children={
              <div className="icon-wrapper">
                <img src={MicrosoftIcon} alt="Microsoft" className="icon" />
              </div>
            }
          />
          {!microsoftUser ? (
            <MicrosoftLogin
              clientId="YOUR_MICROSOFT_CLIENT_ID"
              authCallback={microsoftLogin}
              buttonTheme="light_short"
            />
          ) : (
            <Button
              variant="contained"
              color="secondary"
              onClick={handleMicrosoftLogout}
            >
              Logout from Microsoft
            </Button>
          )}
        </div>
      </div>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason !== "backdropClick") {
            setOpen(false);
          }
        }}
        BackdropProps={{
          style: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          },
        }}
        PaperProps={{
          style: {
            padding: "20px",
            borderRadius: "10px",
          },
        }}
      >
        <DialogContent>
          <MuiOtpInput
            length={4}
            autoFocus
            onComplete={handleComplete}
            value={value.otp}
            onChange={handleOtpChange}
            display="flex"
            gap={3}
            validateChar={validateChar}
            TextFieldsProps={{
              style: { width: "50px", height: "50px" },
              placeholder: "-",
            }}
          />
        </DialogContent>
      </Dialog>
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

export default Signup;
