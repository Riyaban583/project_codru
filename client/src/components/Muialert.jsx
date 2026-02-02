import { useEffect } from "react";
import { Alert as MuiAlert } from "@mui/material";

const Muialert = ({ message, severity, onClose, autoHideDuration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, autoHideDuration);

    return () => clearTimeout(timer); // Clear the timeout if the component is unmounted
  }, [onClose, autoHideDuration]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: "9999",
        width: "25%",
      }}
    >
      <MuiAlert
        onClose={onClose}
        severity={severity}
        sx={{
          width: "100%",
          mb: 2,
          backgroundColor: severity === "success" ? "#4caf50" : severity === "error" ? "#f44336" : "#2196f3", // Green for success, red for error, blue for info
          color: "white", // Keep the text white for contrast
          padding: "2vh",
          fontSize: "1rem", // Adjust font size for better readability
          fontWeight: "bold", // Make the text bold
        }}
      >
        {message} {/* Ensure the message is displayed here */}
      </MuiAlert>
    </div>
  );
};

export default Muialert;
