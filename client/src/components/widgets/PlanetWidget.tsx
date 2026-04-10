import React from 'react';
import { GripVertical, Globe, ExternalLink } from 'lucide-react';

const PlanetWidget = ({ data }: { data: any }) => {
  return (
    <>
      {/* WIDGET HEADER */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(255,100,0,0.5)]" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Latest Planet</h3>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-200">
          <GripVertical size={16} />
        </div>
      </div>

      {/* WIDGET CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
        {data ? (
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-indigo-100 text-indigo-500 rounded-lg shrink-0">
                  <Globe size={16} />
              </div>
              <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">Planet {data.planet}</span>
            </div>
            
            <h4 className="text-[11px] font-bold text-slate-800 line-clamp-2 mb-2 leading-snug">
                {data.question}
            </h4>
            
            <p className="text-[10px] text-slate-500 line-clamp-3 mb-4 flex-1">
                {data.answer}
            </p>
            
            {data.link && (
              <a 
                href={data.link.startsWith('http') ? data.link : `https://${data.link}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mt-auto flex items-center justify-center gap-1.5 py-2 w-full bg-white rounded-xl text-[10px] font-bold text-indigo-500 border border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm"
              >
                <ExternalLink size={12} /> View Submission
              </a>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-slate-100">
            No planets conquered yet! 🚀
          </div>
        )}
      </div>
    </>
  );
};

export default PlanetWidget;