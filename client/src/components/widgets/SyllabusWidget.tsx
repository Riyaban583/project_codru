import React from 'react';
import { Target, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CircularProgress = ({ percentage, size = 60, strokeWidth = 6, color = "#6366f1" }: { percentage: number, size?: number, strokeWidth?: number, color?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-100"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          style={{ 
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 1s ease-in-out'
          }}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-black text-slate-700">{percentage}%</span>
    </div>
  );
};

const SyllabusWidget = ({ data }: { data: any }) => {
  const navigate = useNavigate();
  
  // Data comes from backend as [{ name: 'Math', percentage: 85 }, ...]
  const subjects = Array.isArray(data) ? data : [];

  const handleNavigate = () => {
    localStorage.setItem("currentView", "syllabus");
    localStorage.setItem("activeTab", "Syllabus Tracker");
    navigate('/dashboard/syllabus');
  };

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Course Progress</h3>
        </div>
        
        {subjects.length > 0 && (
            <button 
                onClick={handleNavigate}
                className="text-[10px] font-bold text-brand-blue hover:underline flex items-center gap-1 transition-all"
            >
                View Tracker <ChevronRight size={10} />
            </button>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col justify-center relative z-10">
        {subjects.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
                {subjects.map((subj: any, idx: number) => (
                    <div 
                        key={idx} 
                        className="flex flex-col items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={handleNavigate}
                    >
                        <CircularProgress percentage={subj.percentage} />
                        <span className="text-[10px] font-bold text-slate-600 text-center leading-tight truncate w-full group-hover:text-indigo-600">
                            {subj.name}
                        </span>
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 py-8 px-4 h-full">
                <Target size={32} className="opacity-20 mb-3" />
                <h4 className="text-xs font-bold text-slate-700 mb-1">No Progress Yet</h4>
                <p className="text-[9px] text-slate-500 text-center leading-relaxed max-w-[150px]">
                    Mark topics as complete in the tracker to see your mastery here.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default SyllabusWidget;