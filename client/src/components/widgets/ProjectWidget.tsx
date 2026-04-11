import React from 'react';
import { Rocket, CheckCircle2, Circle, ChevronRight } from 'lucide-react';

const ProjectWidget = ({ data }: { data: any }) => {
  // data = { courseName: "Skill Track", projectName: "Planetary Path", currentStage: 2 }
  const stages = ['Mercury', 'Venus', 'Earth', 'Mars'];
  const currentStage = data?.currentStage || 0;

  return (
    <div className="h-full flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(255,100,0,0.4)]" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Mission</h3>
        </div>
      </div>

      {/* PROJECT TITLE */}
      <div className="mb-6">
        <h4 className="text-lg font-black text-slate-800 leading-tight">
          {data?.projectName || "No Active Project"}
        </h4>
        <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mt-1">
          {data?.courseName || "Start your journey"}
        </p>
      </div>

      {/* ROADMAP NODES */}
      <div className="flex-1 flex flex-col justify-between py-2 relative">
        {/* The connecting line */}
        <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-100 z-0" />
        
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentStage;
          const isActive = idx === currentStage;

          return (
            <div key={stage} className="flex items-center gap-4 relative z-10">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                isCompleted 
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200' 
                  : isActive 
                  ? 'bg-white border-brand-blue text-brand-blue animate-pulse' 
                  : 'bg-white border-slate-200 text-slate-300'
              }`}>
                {isCompleted ? <CheckCircle2 size={14} strokeWidth={3} /> : <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-brand-blue' : 'bg-slate-200'}`} />}
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold transition-colors ${isActive ? 'text-brand-blue' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                  Stage {idx + 1}: {stage}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <button className="mt-6 w-full py-3 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-brand-blue rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group">
        Continue Mission <Rocket size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
};

export default ProjectWidget;