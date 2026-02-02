import { useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/Forget_password.css";

const Forget_password = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [cpassword, setCpassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleCpasswordChange = (e) => setCpassword(e.target.value);

  const PostData = async (e) => {
    e.preventDefault();
    if (password !== cpassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API}reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword: password }),
        }
      );

      if (res.ok) {
        setMessage("Password has been reset successfully");
        setError("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reset password");
        setMessage("");
      }
    } catch (err) {
      setError("Failed to reset password");
      setMessage("");
    }
  };

  return (
    <div>
      <div className="fp_main">
        <img src="/image/fp2.png" alt="" />
        <div className="fp_box">
          <img src="/image/fp_icon.png" alt="" />
          <h2>Forget Password</h2>
          <form className="fp_form" onSubmit={PostData}>
            <div className="fp_form-group">
              <label className="fp_label" htmlFor="Password">
                New Password
              </label>
              <input
                type="password"
                id="password"
                name="pass"
                value={password}
                onChange={handlePasswordChange}
                title="Must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters"
                required
              />
            </div>

            <div className="fp_form-group">
              <label className="fp_label" htmlFor="Password">
                Confirm New Password
              </label>
              <input
                type="password"
                id="cpassword"
                name="retype_pass"
                value={cpassword}
                onChange={handleCpasswordChange}
                required
              />
            </div>

            <div className="fp_buttonWrapper">
              <button
                type="submit"
                id="fp_submitButton"
                className="fp_submitButton pure-button pure-button-primary"
              >
                <span>Update Password</span>
                <span id="fp_loader"></span>
              </button>
            </div>
          </form>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Forget_password;
