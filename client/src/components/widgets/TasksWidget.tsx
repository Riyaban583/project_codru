import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, Plus, X, Loader2, AlignLeft, 
  ArrowDown, ArrowUp, AlertCircle, ArrowUpRight, ArrowDownRight, Clock 
} from 'lucide-react';

// 🚨 Reusable Priority Badge (Matches CRM)
const PriorityBadge = ({ priority }: { priority?: string }) => {
    const safePriority = priority || 'Medium';
    const styles = {
        High: "bg-rose-50 text-rose-600 border-rose-200",
        Medium: "bg-amber-50 text-amber-600 border-amber-200",
        Low: "bg-slate-50 text-slate-500 border-slate-200",
    };
    const icons = {
        High: <ArrowUpRight size={10} strokeWidth={3} />,
        Medium: <AlertCircle size={10} strokeWidth={2.5} />,
        Low: <ArrowDownRight size={10} strokeWidth={2.5} />,
    };

    return (
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider shadow-sm shrink-0 ${styles[safePriority as keyof typeof styles]}`}>
            {icons[safePriority as keyof typeof icons]} {safePriority}
        </div>
    );
};

const TasksWidget = ({ data }: { data: any }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium'); // 🚨 Added Priority to inline form
  const [assignees, setAssignees] = useState('');

  // 🚨 Sorting State
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');
  const [sortDesc, setSortDesc] = useState(true); // true = High->Low or Newest->Oldest
  
  // 🚨 Expanded Task State (Popup)
  const [expandedTask, setExpandedTask] = useState<{title: string, description: string} | null>(null);

  useEffect(() => {
    if (data && Array.isArray(data)) {
        const formattedTasks = typeof data[0] === 'string' 
            ? data.map((t: string, i: number) => ({ _id: Math.random(), title: t, status: 'Pending', priority: 'Medium' }))
            : data;
        setTasks(formattedTasks);
    }
  }, [data]);

  // 🚨 THE SORTING ENGINE
  const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
  
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').sort((a, b) => {
      if (sortBy === 'priority') {
          const valA = priorityWeight[a.priority || 'Medium'];
          const valB = priorityWeight[b.priority || 'Medium'];
          if (valA !== valB) return sortDesc ? valB - valA : valA - valB;
          
          // Tie-breaker: Closest due date
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return dateA - dateB;
      } else {
          // Sort by Date
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          if (dateA !== dateB) return sortDesc ? dateB - dateA : dateA - dateB; // Descending usually means newest first
          
          // Tie-breaker: Highest priority
          const valA = priorityWeight[a.priority || 'Medium'];
          const valB = priorityWeight[b.priority || 'Medium'];
          return valB - valA;
      }
  });

  const completedTasks = tasks.filter(t => t.status === 'Completed');

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem("jwtoken");
      const currentUsername = localStorage.getItem("Username") || "";
      
      let assignedStaff = assignees.split(',').map(s => s.trim().replace('@', '')).filter(Boolean);
      if (assignedStaff.length === 0) {
        assignedStaff.push(currentUsername);
      }

      const res = await fetch(`${import.meta.env.VITE_API}tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          priority: newTaskPriority, // 🚨 Sending Priority
          assignedStaff: assignedStaff
        })
      });

      if (res.ok) {
        const savedTask = await res.json();
        setTasks(prev => [savedTask, ...prev]); 
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskPriority('Medium');
        setAssignees('');
        setIsAdding(false);
      }
    } catch (error) {
      console.error("Failed to save task:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTask = async (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Stop the row click from triggering the modal
    const taskToToggle = tasks.find(t => t._id === taskId);
    const newStatus = taskToToggle?.status === 'Completed' ? 'Pending' : 'Completed';

    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));

    try {
      const token = localStorage.getItem("jwtoken");
      await fetch(`${import.meta.env.VITE_API}tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error("Failed to sync task status", error);
    }
  };

  return (
    <>
      {/* HEADER WITH SORTING CONTROLS */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(255,100,0,0.5)]" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Priority Tasks</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 🚨 SORTING ENGINE UI */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/50 shadow-sm">
            <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value as 'priority' | 'date')} 
                className="bg-transparent text-[9px] font-bold text-slate-600 outline-none cursor-pointer pl-1.5 pr-1 appearance-none"
            >
                <option value="priority">Sort: Priority</option>
                <option value="date">Sort: Date</option>
            </select>
            <div className="w-px h-3 bg-slate-300 mx-1"></div>
            <button 
                onClick={() => setSortDesc(!sortDesc)} 
                className="p-1 hover:bg-white rounded-md transition text-slate-600 active:scale-95"
                title={sortDesc ? "Descending" : "Ascending"}
            >
                {sortDesc ? <ArrowDown size={12} strokeWidth={3} /> : <ArrowUp size={12} strokeWidth={3} />}
            </button>
          </div>

          {/* ADD BUTTON */}
          <button 
            onClick={() => setIsAdding(!isAdding)} 
            className="w-6 h-6 flex items-center justify-center bg-brand-blue/10 text-brand-blue rounded-full hover:bg-brand-blue hover:text-white transition-colors"
          >
            {isAdding ? <X size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative z-10 flex flex-col">
        
        {/* INLINE ADD FORM WITH PRIORITY */}
        {isAdding && (
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-4 animate-in fade-in slide-in-from-top-2">
            <input 
              type="text" placeholder="Task Title..." value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 mb-2" autoFocus
            />
            <textarea 
              placeholder="Add details, links, or context..." value={newTaskDescription}
              onChange={e => setNewTaskDescription(e.target.value)} rows={2}
              className="w-full bg-white px-3 py-2 rounded-xl text-[10px] font-medium text-slate-600 outline-none border border-slate-200 mb-2 focus:border-brand-blue/50 transition-colors resize-none custom-scrollbar"
            />
            <div className="flex gap-2 mb-3">
                <input 
                    type="text" placeholder="@username (Assign others)" value={assignees}
                    onChange={e => setAssignees(e.target.value)}
                    className="flex-1 bg-white px-3 py-2 rounded-xl text-[10px] font-medium text-slate-600 outline-none border border-slate-200 focus:border-brand-blue/50 transition-colors"
                />
                <select 
                    value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)} 
                    className="bg-white px-2 py-2 rounded-xl text-[10px] font-bold text-slate-600 outline-none border border-slate-200 focus:border-brand-blue/50 transition-colors"
                >
                    <option value="High">High</option>
                    <option value="Medium">Med</option>
                    <option value="Low">Low</option>
                </select>
            </div>
            
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 text-[10px] font-bold px-3 py-2 transition">Cancel</button>
              <button onClick={handleAddTask} disabled={isSaving || !newTaskTitle.trim()} className="bg-brand-blue text-white flex items-center gap-1.5 text-[10px] font-bold px-4 py-2 rounded-xl hover:bg-blue-600 transition disabled:opacity-50">
                {isSaving && <Loader2 size={12} className="animate-spin" />} Save Task
              </button>
            </div>
          </div>
        )}

        {/* PENDING TASKS */}
        <div className="space-y-2 mb-4">
            {pendingTasks.length > 0 ? pendingTasks.map((t) => (
            <div 
                key={t._id} 
                onClick={() => t.description ? setExpandedTask({ title: t.title, description: t.description }) : null}
                className={`flex items-start gap-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 shrink-0 group/task ${t.description ? 'cursor-pointer hover:bg-blue-100/50 hover:border-brand-blue/30 transition-colors' : ''}`}
            >
                <button 
                    onClick={(e) => toggleTask(t._id, e)}
                    className="w-5 h-5 mt-0.5 rounded-md bg-white border border-blue-200 flex items-center justify-center text-transparent hover:text-brand-blue hover:border-brand-blue shrink-0 transition-colors shadow-sm"
                >
                    <ShieldCheck size={12} />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-700 block leading-snug truncate">{t.title}</span>
                        <PriorityBadge priority={t.priority} />
                    </div>
                    {/* Render a snippet of the description */}
                    {t.description && (
                        <div className="flex items-start gap-1.5 mt-1.5 text-slate-500">
                            <AlignLeft size={10} className="mt-0.5 shrink-0 opacity-50 group-hover/task:text-brand-blue" />
                            <p className="text-[9px] font-medium leading-relaxed line-clamp-1 group-hover/task:text-slate-700 transition-colors">{t.description}</p>
                        </div>
                    )}
                    {t.dueDate && (
                        <div className="flex items-center gap-1 mt-1.5 text-[9px] font-bold text-slate-400">
                            <Clock size={10} /> {new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric'})}
                        </div>
                    )}
                </div>
            </div>
            )) : (!isAdding && (
            <div className="text-slate-400 text-xs font-bold text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                All tasks completed! 🎉
            </div>
            ))}
        </div>

        {/* COMPLETED TASKS */}
        {completedTasks.length > 0 && (
            <div className="mt-auto pt-4 border-t border-slate-100">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 px-1">Completed</p>
                <div className="space-y-2">
                    {completedTasks.map((t) => (
                    <div key={t._id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 opacity-60 hover:opacity-100 transition-opacity">
                        <button onClick={(e) => toggleTask(t._id, e)} className="text-green-500 shrink-0">
                            <CheckCircle2 size={16} />
                        </button>
                        <span className="text-[11px] font-bold text-slate-500 line-through truncate">{t.title}</span>
                    </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* 🚨 DESCRIPTION MODAL / POPUP */}
      {expandedTask && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setExpandedTask(null)}>
              <div 
                  className="bg-white rounded-[24px] md:rounded-[32px] w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
                  onClick={e => e.stopPropagation()} // Prevent clicking inside modal from closing it
              >
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-brand-blue text-white">
                      <h3 className="text-sm font-bold pr-4 leading-tight">{expandedTask.title}</h3>
                      <button onClick={() => setExpandedTask(null)} className="hover:bg-white/20 p-1.5 rounded-full transition shrink-0"><X size={16}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Task Details</h4>
                      <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{expandedTask.description}</p>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default TasksWidget;