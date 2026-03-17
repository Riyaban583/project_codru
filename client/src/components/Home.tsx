import { useState } from "react";
import CreatePost from "./CreatePost";
import CuteFeed from "./CuteFeed";
import { UserData } from "../App";
import { NavLink } from "react-router-dom";

interface HomeProps {
  userData: UserData;
}

const Home = ({ userData }: HomeProps) => {
  // 1. ADD THIS STATE: It acts as a signal between CreatePost and CuteFeed
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isLoggedIn = !!localStorage.getItem("jwtoken");

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <h1 className="text-4xl font-display font-bold text-brand-blue mb-4">Welcome to CuTe Learning</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Join our community to share posts, ask questions, and explore the Cute Feed!
        </p>
        <NavLink 
          to="/signin" 
          className="bg-brand-orange text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-orange-600 transition transform hover:-translate-y-0.5"
        >
          Sign In to See Feed
        </NavLink>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-2xl mx-auto space-y-8 px-4 sm:px-0">
        
        {/* 2. Pass a function to trigger the refresh when a post is made */}
        <CreatePost 
          userData={userData} 
          onPostCreated={() => setRefreshTrigger(prev => prev + 1)} 
        />
        
        {/* 3. Pass the trigger value so the feed knows when to update */}
        <CuteFeed 
          userData={userData} 
          refreshTrigger={refreshTrigger} 
        />
        
      </div>
    </div>
  );
};

export default Home;