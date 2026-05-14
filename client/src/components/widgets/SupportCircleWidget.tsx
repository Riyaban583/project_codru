import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Loader2, UserPlus, ShieldCheck } from 'lucide-react';
import { socket } from '../../socket'; // Adjust path if your socket is somewhere else!

const SupportCircleWidget = () => {
  const navigate = useNavigate();
  const [circle, setCircle] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCircle = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API}expert-connect/my-circle`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("jwtoken")}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCircle(data);
        }
      } catch (err) {
        console.error("Failed to fetch Support Circle:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // 1. Initial fetch
    fetchCircle();

    // 2. Keep the widget synced if they add/remove an expert elsewhere
    const handleRefreshCircle = () => fetchCircle();
    window.addEventListener('refresh-communication-circle', handleRefreshCircle);

    // 3. Live Socket Sync
    const username = localStorage.getItem("Username");
    if (username) {
      socket.emit("join", username);
      socket.on("force-refresh-circle", handleRefreshCircle);
    }

    return () => {
      window.removeEventListener('refresh-communication-circle', handleRefreshCircle);
      socket.off("force-refresh-circle", handleRefreshCircle);
    };
  }, []);

  return (
    <>
      {/* WIDGET HEADER */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">My Support Circle</h3>
        </div>
        <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
            {circle.length} / 3 Experts
        </span>
      </div>

      {/* WIDGET CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative z-10 flex flex-col">
        {isLoading ? (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
            </div>
        ) : circle.length > 0 ? (
            <div className="space-y-3">
                {circle.map((expert) => (
                    <div 
                        key={expert._id} 
                        className="bg-slate-50 hover:bg-rose-50/30 rounded-2xl p-3 border border-slate-100 hover:border-rose-100 transition-colors flex items-center gap-3 group"
                    >
                        {/* Expert Avatar */}
                        <div className="relative shrink-0 mt-0.5">
                            {expert.photo ? (
                                <img src={expert.photo} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center font-bold border-2 border-white shadow-sm">
                                    {(expert.name || "E").charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                        </div>

                        {/* Expert Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="text-xs font-bold text-slate-800 truncate">{expert.name}</h4>
                            <div className="flex items-center gap-1 mt-0.5">
                                <ShieldCheck size={10} className="text-rose-400" />
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">
                                    {expert.specialty || expert.role || "Expert"}
                                </p>
                            </div>
                        </div>

                        {/* 🚨 THE MAGIC TELEPORT BUTTON */}
                        <button 
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('open-communication-portal', {
                                    detail: { connectionId: expert.connectionId }
                                }));
                            }}
                            className="w-8 h-8 rounded-xl bg-white text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:text-white border border-slate-200 hover:border-rose-500 transition-all shadow-sm shrink-0"
                            title={`Message ${expert.name}`}
                        >
                            <MessageSquare size={14} />
                        </button>
                    </div>
                ))}
            </div>
        ) : (
            // 🚨 EMPTY STATE: Encourage them to add experts!
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 py-6 px-4">
                <Heart size={32} className="opacity-20 mb-3" />
                <h4 className="text-xs font-bold text-slate-700 mb-1 text-center">Build your village</h4>
                <p className="text-[10px] text-slate-500 text-center mb-4">Connect with up to 3 experts to guide you.</p>
                <button 
                    onClick={() => navigate('/expert-connect')} // Make sure this matches your actual route!
                    className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-rose-600 transition shadow-sm"
                >
                    <UserPlus size={12} strokeWidth={3} /> Find Experts
                </button>
            </div>
        )}
      </div>
    </>
  );
};

export default SupportCircleWidget;