import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Code, Bot, Cpu, PenTool, Edit3, Palette, ScrollText, 
  Sparkles, Hammer, CheckCircle2, Quote, Loader2, User, Search, ExternalLink
} from 'lucide-react';

const MILESTONES = ['Ideation', 'Prototyping', 'Building', 'Polishing', 'Completed'];

const getCourseTheme = (name: string) => {
  const lowerName = (name || '').toLowerCase();
  if (lowerName.includes('coding')) return { icon: Code, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
  if (lowerName.includes('robotic')) return { icon: Bot, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' };
  if (lowerName.includes('pcb')) return { icon: Cpu, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
  if (lowerName.includes('graphic')) return { icon: PenTool, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' };
  if (lowerName.includes('sketch') || lowerName.includes('draw')) return { icon: Edit3, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' };
  if (lowerName.includes('paint')) return { icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' };
  if (lowerName.includes('calligraphy')) return { icon: ScrollText, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };
  return { icon: Sparkles, color: 'text-brand-blue', bg: 'bg-blue-50', border: 'border-blue-100' };
};

interface CourseWidgetProps {
  role: string;
  selectedStudentUsername?: string | null; // Passed from global dashboard if available
}

const CourseWidget: React.FC<CourseWidgetProps> = ({ role, selectedStudentUsername }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 🚨 TEACHER FILTER STATE
  const [teacherSearchQuery, setTeacherSearchQuery] = useState(selectedStudentUsername || "");
  const [activeSearch, setActiveSearch] = useState(selectedStudentUsername || "");

  const fetchCourses = async (targetUsername?: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("jwtoken");
      let url = `${import.meta.env.VITE_API}my-courses`;
      
      if (role?.toLowerCase() === 'teacher' && targetUsername) {
        url += `?username=${targetUsername}`;
      }

      const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        // Only show Active or Paused courses on the dashboard to save space
        const activeCourses = data.filter((c: any) => c.status !== 'graduated');
        setCourses(activeCourses);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    if (role?.toLowerCase() === 'student') {
      fetchCourses();
    } else if (role?.toLowerCase() === 'teacher' && activeSearch) {
      fetchCourses(activeSearch);
    }
  }, [role, activeSearch]);

  // Handle Teacher Search Submit
  const handleTeacherSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherSearchQuery.trim()) {
      setActiveSearch(teacherSearchQuery.trim());
    }
  };

  return (
    <>
      {/* WIDGET HEADER */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Projects</h3>
        </div>
        
        {courses.length > 0 && (
          <button onClick={() => navigate('/my-courses')} className="text-[10px] font-bold text-brand-blue hover:underline flex items-center gap-1">
              Full Portfolio <ExternalLink size={10} />
          </button>
        )}
      </div>

      {/* 🚨 TEACHER FILTER BAR */}
      {role?.toLowerCase() === 'teacher' && (
        <form onSubmit={handleTeacherSearch} className="mb-4 relative z-10">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Enter student @username..."
              value={teacherSearchQuery}
              onChange={(e) => setTeacherSearchQuery(e.target.value)}
              className="w-full pl-9 pr-24 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all shadow-sm"
            />
            <button 
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-100 hover:bg-brand-blue hover:text-white text-slate-600 text-[10px] font-bold px-3 py-1 rounded-lg transition-colors"
            >
              Filter
            </button>
          </div>
        </form>
      )}

      {/* WIDGET CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative z-10 flex flex-col space-y-4 pb-2">
        {isLoading ? (
            <div className="h-full flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
        ) : role?.toLowerCase() === 'teacher' && !activeSearch ? (
            // TEACHER EMPTY STATE (No Student Selected)
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 py-8 px-4 min-h-[200px]">
                <User size={32} className="opacity-20 mb-3" />
                <h4 className="text-xs font-bold text-slate-700 mb-1 text-center">Student Lookup</h4>
                <p className="text-[10px] text-slate-500 text-center">Enter a student's username above to view their active projects.</p>
            </div>
        ) : courses.length > 0 ? (
            // ACTIVE COURSES LIST
            courses.map((course) => {
              const theme = getCourseTheme(course.courseName);
              const Icon = theme.icon;
              const currentMilestoneIndex = MILESTONES.indexOf(course.currentMilestone);
              const progressPercentage = (currentMilestoneIndex / (MILESTONES.length - 1)) * 100;

              return (
                <div 
                  key={course._id} 
                  onClick={() => navigate('/my-courses')}
                  className={`bg-white rounded-2xl border ${theme.border} p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.bg}`}>
                        <Icon size={20} className={theme.color} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-brand-blue transition-colors">
                          {course.courseName}
                        </h4>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          {course.level}
                        </span>
                      </div>
                    </div>
                    {course.status === 'paused' && (
                      <span className="text-[9px] font-bold bg-yellow-50 text-yellow-600 border border-yellow-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Paused
                      </span>
                    )}
                  </div>

                  {/* Project Name */}
                  <div className="mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <Hammer size={10} /> Active Project
                    </p>
                    <p className="text-sm font-bold text-slate-700 truncate">
                      {course.projectName}
                    </p>
                  </div>

                  {/* 🚨 MINI PROGRESS BAR */}
                  <div className="mb-4">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-[10px] font-bold text-brand-blue">
                        {course.currentMilestone}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${theme.bg.replace('bg-', 'bg-').replace('50', '500')} bg-brand-blue`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Mentor Note Snippet */}
                  {course.mentorNote && (
                    <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50 flex items-start gap-2">
                      <Quote size={12} className="text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-900/80 font-medium italic line-clamp-2 leading-relaxed">
                        "{course.mentorNote}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })
        ) : (
            // EMPTY STATE: No active courses
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 py-8 px-4 min-h-[200px]">
                <Sparkles size={32} className="opacity-20 mb-3" />
                <h4 className="text-xs font-bold text-slate-700 mb-1 text-center">No Active Projects</h4>
                <p className="text-[10px] text-slate-500 text-center">
                  {role?.toLowerCase() === 'teacher' ? "This student is not currently building any projects." : "You are not enrolled in any skill courses yet."}
                </p>
            </div>
        )}
      </div>
    </>
  );
};

export default CourseWidget;