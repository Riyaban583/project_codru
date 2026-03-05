import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";

// --- TYPESCRIPT DEFINITIONS ---
// This ensures our user data is always perfectly formatted across the whole app.
export interface UserData {
  Name: string;
  Photo: string;
  Role: string;
  isAdmin: boolean;
}

// --- IMPORTS ---
// We will uncomment these one by one as we convert them to TypeScript & Tailwind!
// import Home from "./components/Home";
import Signin from "./components/Signin";
import Dashboard from "./components/Dashboard";
 import Navbar from "./components/Navbar";
 import Signup from "./components/Signup";
// ... (Add others as we go)

function App() {
  // State is now strictly typed using the interface above
  const [userData, setUserData] = useState<UserData>({
    Name: "",
    Photo: "",
    Role: "",
    isAdmin: false,
  });

  // Fetch User Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("Token");
      
      if (token) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API}profile`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();
          
          if (res.ok) {
            setUserData((prevData) => ({
              ...prevData,
              Photo: data.user.photo ? data.user.photo.toString() : "",
              Name: data.user.name ? data.user.name.toString() : "",
              isAdmin: true,
              Role: data.user.role || "",
            }));
            localStorage.setItem("Photo", data.user.photo);
            localStorage.setItem("Name", data.user.name);
          } else {
            console.error("Failed to fetch user data", data.error);
          }
        } catch (error) {
          console.error("Network error fetching user data:", error);
        }
      }
    };

    fetchData();
  }, []);

  return (
    // We replace the old App.css logic with clean Tailwind utility classes
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-brand-orange selection:text-white">
      
      {/* We can put the Navbar here later so it stays at the top of every page! */}
      <Navbar userData={userData} setUserData={setUserData} />

      <Routes>
        {/* Placeholder route to test if the app is working */}
        <Route 
          path="/" 
          element={
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
              <h1 className="text-4xl font-bold text-brand-blue mb-4">Dashboard Base Ready</h1>
              <p className="text-brand-orange">Waiting for components to migrate!</p>
            </div>
          } 
        />

        {/* --- ROUTES TO UNCOMMENT --- */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin userData={userData} setUserData={setUserData} />} />

        <Route path="/dashboard" element={<Dashboard userData={userData} setUserData={setUserData} />} />
        {/* ... */}
      </Routes>
    </div>
  );
}

export default App;