import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// 🚨 We will create these next!
import TasksWidget from './widgets/TasksWidget';
import PlanetWidget from './widgets/PlanetWidget';
import LeadsWidget from './widgets/LeadsWidget';
import UpcomingWidget from './widgets/UpcomingWidget.tsx';
import PostWidget from './widgets/PostWidget';
import SupportCircleWidget from './widgets/SupportCircleWidget';
// import ProjectWidget from './widgets/ProjectWidget';
// import SyllabusWidget from './widgets/SyllabusWidget';
// import ... import the rest as we build them

const WIDGET_CONFIG = {
  tasks: { roles: ['cute_team', 'admin', 'verified_teacher'], size: 'md:col-span-1', component: TasksWidget },
  last_planet: { roles: ['student'], size: 'md:col-span-1', component: PlanetWidget },
  team_pipeline: { roles: ['cute_team', 'admin'], title: 'My Pipeline', size: 'md:col-span-1', component: LeadsWidget },
  classes: { roles: ['user', 'student', 'parent', 'teacher', 'admin', 'cute_team', 'verified_teacher', 'verified_parent'], size: 'md:col-span-1', component: UpcomingWidget },
  feed: { roles: ['student', 'user', 'teacher', 'admin', 'parent', 'verified_teacher', 'verified_parent', 'cute_team'], size: 'md:col-span-1', component: PostWidget },
  support_circle: { roles: ['parent', 'verified_parent'], size: 'md:col-span-1', component: SupportCircleWidget },
  // syllabus: { roles: ['student'], size: 'md:col-span-2', component: SyllabusWidget },
  // skill_track: { roles: ['student'], size: 'md:col-span-2', component: ProjectWidget },
  // Add the rest here as we modularize them...
};

const Overview = ({ user, data }: { user: any, data?: any }) => {
  const baseRole = user?.Role?.toLowerCase() || user?.role?.toLowerCase() || "user";
  
  const userRoles = [baseRole];
  if (user?.isAdmin) userRoles.push('admin');
  if (user?.isCuTeTeam) userRoles.push('cute_team');
  if (baseRole === 'teacher' && user?.isVerifiedStaff) userRoles.push('verified_teacher');
  if (baseRole === 'parent' && user?.isVerifiedParent) userRoles.push('verified_parent');

  const allowedWidgets = Object.keys(WIDGET_CONFIG).filter(key => 
    WIDGET_CONFIG[key as keyof typeof WIDGET_CONFIG].roles.some(r => userRoles.includes(r))
  );

  // Layout State + Drag & Drop Logic
  const [layout, setLayout] = useState<string[]>(allowedWidgets);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Sync layout if allowed widgets change
  useEffect(() => { setLayout(allowedWidgets); }, [allowedWidgets.length]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    // Simple swap logic
    const newLayout = [...layout];
    const draggedItem = newLayout[draggedIdx];
    newLayout.splice(draggedIdx, 1);
    newLayout.splice(index, 0, draggedItem);
    
    setDraggedIdx(index);
    setLayout(newLayout);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    // Optional: Save `layout` array to user.dashboardLayout in DB here!
  };

  if (!data) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-brand-blue">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-bold text-sm">Syncing Command Center...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {layout.map((key, index) => {
          const config = WIDGET_CONFIG[key as keyof typeof WIDGET_CONFIG];
          if (!config) return null;
          
          const WidgetComponent = config.component;

          return (
            <div 
              key={key} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                ${config.size} bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 
                transition-all group relative overflow-hidden flex flex-col min-h-[180px]
                ${draggedIdx === index ? 'opacity-40 scale-95 border-dashed border-brand-blue' : 'hover:shadow-xl hover:border-brand-blue/10'}
              `}
            >
              {/* Render the modular component, passing it the specific data it needs */}
              <WidgetComponent data={data[key]} rawData={data} />
              
              {/* Background Glow */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-blue/5 rounded-full blur-3xl opacity-50 pointer-events-none z-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Overview;