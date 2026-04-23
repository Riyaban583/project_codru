import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchWithCache } from '../utils/apiCache';
import { 
  Plus, Trash2, ChevronRight, ChevronDown, Share2, 
  Search, X, ArrowLeft, Globe, BookMarked, Check, Loader2, 
  Maximize2, Minimize2, BookOpen, ShieldCheck, Send, DownloadCloud, Lock
} from 'lucide-react';
import { IconButton, Tooltip, Switch, FormControlLabel } from "@mui/material";

export interface TrackerNode {
  _id: string;
  title: string;
  parentId: string | null;
  course: string;
  level: number;
  order: number;
  isCustom: boolean;
  children?: TrackerNode[];
}

const SyllabusExplorer = ({ userData }: { userData: any }) => {
  const { username: routeUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  // 🚨 SMART AUTHENTICATION ROLES
  const token = localStorage.getItem("jwtoken");
  const myUsername = localStorage.getItem("Username") || localStorage.getItem("username");
  const isLoggedIn = !!token && !!myUsername;

  const targetUsername = routeUsername || myUsername;
  const isOwner = myUsername === targetUsername;
  
  const isAdmin = userData?.isAdmin;
  const isTeacher = userData?.Role === "Teacher";
  const isStrictAdmin = isAdmin && !isTeacher; 
  const isHybridAdmin = isAdmin && isTeacher;  

  // --- STATE ---
  const [userNodes, setUserNodes] = useState<TrackerNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeView, setActiveView] = useState<'path' | 'preview' | 'global_builder'>(isStrictAdmin ? 'global_builder' : 'path');
  const [isGlobalMode, setIsGlobalMode] = useState(isStrictAdmin); 
  
  const [previewCourse, setPreviewCourse] = useState<string | null>(null);
  const [globalCourses, setGlobalCourses] = useState<string[]>([]);
  const [previewNodes, setPreviewNodes] = useState<TrackerNode[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); 

  const [addingTo, setAddingTo] = useState<{ parentId: string | null, course: string } | null>(null);
  const [newCourseName, setNewCourseName] = useState("");
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showPushModal, setShowPushModal] = useState<{ isOpen: boolean, courseName: string }>({ isOpen: false, courseName: "" });
  const [pushTargetUsername, setPushTargetUsername] = useState("");

  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // 🚨 EARLY RETURN: IF NOT LOGGED IN
  if (!isLoggedIn) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-body">
        <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-2xl max-w-md w-full text-center border border-gray-100 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3">Sign in to continue</h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            {routeUsername 
              ? `You need an account to view and import ${routeUsername}'s learning path into your own tracker.` 
              : 'Please log in to build, share, and explore community syllabus trackers.'}
          </p>
          <button 
            onClick={() => navigate('/login')} 
            className="w-full bg-brand-blue text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Log In or Sign Up
          </button>
        </div>
      </div>
    );
  }

  // --- RECURSIVE HELPERS ---
  const getDescendantIds = (node: any): string[] => {
    let ids: string[] = [];
    if (node.children) {
      node.children.forEach((child: any) => {
        ids.push(child._id);
        ids = ids.concat(getDescendantIds(child));
      });
    }
    return ids;
  };

  const handleExpandSpecificNode = (node: TrackerNode) => {
    const descendantIds = getDescendantIds(node);
    setExpandedNodes(prev => Array.from(new Set([...prev, node._id, ...descendantIds])));
  };

  const handleCollapseSpecificNode = (node: TrackerNode) => {
    const descendantIds = getDescendantIds(node);
    setExpandedNodes(prev => prev.filter(id => id !== node._id && !descendantIds.includes(id)));
  };

  const buildTree = (nodes: TrackerNode[]) => {
    const nodesMap = new Map<string, any>();
    const roots: any[] = [];
    nodes.forEach(node => nodesMap.set(node._id, { ...node, children: [] }));
    nodesMap.forEach(node => {
      if (node.parentId && nodesMap.has(node.parentId)) {
        nodesMap.get(node.parentId).children.push(node);
      } else { roots.push(node); }
    });
    const recursiveSort = (arr: any[]) => {
      arr.sort((a, b) => a.order - b.order);
      arr.forEach(item => recursiveSort(item.children));
    };
    recursiveSort(roots);
    return roots;
  };

  // --- API CALLS ---
  const fetchUserNodes = async () => {
    setIsLoading(true);
    try {
      const url = `${import.meta.env.VITE_API}dashboard/tracker/nodes?username=${targetUsername}`; 
      const data = await fetchWithCache(url, { "Authorization": `Bearer ${token}` }, true);
      setUserNodes(Array.isArray(data) ? data : []);
    } catch (err) { setUserNodes([]); } finally { setIsLoading(false); }
  };

  const fetchGlobalCourses = async () => {
    fetch(`${import.meta.env.VITE_API}dashboard/tracker/available-courses`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setGlobalCourses(data));
  };

  useEffect(() => {
    if (!isStrictAdmin) fetchUserNodes();
    fetchGlobalCourses();
  }, [targetUsername, isStrictAdmin]);

  useEffect(() => {
    if ((activeView === 'preview' || activeView === 'global_builder') && previewCourse) {
      setIsLoadingPreview(true);
      fetch(`${import.meta.env.VITE_API}dashboard/tracker/blueprint?course=${encodeURIComponent(previewCourse)}`, {
        headers: { "Authorization": `Bearer ${token}` } 
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setPreviewNodes(data))
        .finally(() => setIsLoadingPreview(false));
    }
  }, [activeView, previewCourse]);

  // --- MEMOS ---
  const courseTrees = useMemo(() => {
    const filtered = searchQuery.trim() 
      ? userNodes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : userNodes;
    const groups: Record<string, any[]> = {};
    filtered.forEach(node => {
      if (!groups[node.course]) groups[node.course] = [];
      groups[node.course].push(node);
    });
    const finalTrees: Record<string, any[]> = {};
    Object.keys(groups).forEach(course => finalTrees[course] = buildTree(groups[course]));
    return finalTrees;
  }, [userNodes, searchQuery]);

  const previewTree = useMemo(() => buildTree(previewNodes), [previewNodes]);

  // --- ACTIONS ---
  const handleAddNode = async (parentId: string | null, courseName: string, explicitTitle?: string) => {
    const finalTitle = explicitTitle !== undefined ? explicitTitle : newItemName;
    if (!finalTitle.trim() || !courseName.trim()) return;
    setIsProcessing(true);
    try {
      const endpoint = isGlobalMode ? 'nodes/master' : 'nodes'; 
      const res = await fetch(`${import.meta.env.VITE_API}dashboard/tracker/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
          title: finalTitle.trim(), 
          parentId, 
          course: courseName.trim(),
          username: isGlobalMode ? 'admin' : targetUsername 
        })
      });
      if (res.ok) {
        setNewItemName(""); setAddingTo(null); setIsCreatingCourse(false); 
        if (isGlobalMode) {
            if (!previewCourse) setPreviewCourse(courseName); 
            else fetchGlobalCourses(); 
        } else {
            fetchUserNodes();
        }
        showToast("Added successfully");
      }
    } catch (err) { showToast("Error adding", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleShareCourse = (courseName: string) => {
    const url = `${window.location.origin}/edit-syllabus/${targetUsername}`;
    navigator.clipboard.writeText(url);
    showToast(`Link to ${courseName} copied!`);
  };

  const handleImportSharedCourse = async (courseName: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API}dashboard/tracker/clone-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ sourceUsername: targetUsername, targetUsername: myUsername, courseName })
      });
      if (res.ok) {
        showToast(`Imported ${courseName} to your tracker!`);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else { showToast("Failed to import", "error"); }
    } catch (err) { showToast("Import failed", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleSubscribeToGlobal = async (courseName: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API}dashboard/tracker/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ courseName, username: myUsername })
      });
      if (res.ok) {
        showToast(`Added ${courseName} to your tracker!`);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else { showToast("Failed to subscribe", "error"); }
    } catch (err) { showToast("Subscription failed", "error"); }
    finally { setIsProcessing(false); }
  };

  const handlePushToStudent = async () => {
    if (!pushTargetUsername.trim() || !showPushModal.courseName) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API}dashboard/tracker/clone-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
          sourceUsername: targetUsername, 
          targetUsername: pushTargetUsername.trim(), 
          courseName: showPushModal.courseName 
        })
      });

      if (res.ok) {
        showToast(`Syllabus pushed to ${pushTargetUsername}!`);
        setShowPushModal({ isOpen: false, courseName: "" });
        setPushTargetUsername("");
      } else { showToast("Failed to push syllabus", "error"); }
    } catch (err) { showToast("Push failed", "error"); }
    finally { setIsProcessing(false); }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // --- NODE RENDERER ---
  const renderNode = (node: any, index: number, siblings: any[], courseName: string, isPreview: boolean = false) => {
    const isExpanded = expandedNodes.includes(node._id);
    const hasChildren = node.children && node.children.length > 0;
    const canEdit = (!isPreview && (isOwner || isTeacher)) || (isPreview && isGlobalMode);

    return (
      <div key={node._id} className="w-full">
        <div className="flex items-center justify-between py-2.5 pr-4 border-b border-gray-50 hover:bg-slate-50 transition group">
          <div className="flex items-center flex-1 min-w-0" style={{ paddingLeft: `${(node.level - 1) * 1.5}rem` }}>
            <div className="w-8 flex justify-center shrink-0">
              {hasChildren && (
                <button onClick={() => setExpandedNodes(prev => prev.includes(node._id) ? prev.filter(i => i !== node._id) : [...prev, node._id])} className="p-1 text-gray-400 hover:text-brand-blue rounded-md active:bg-gray-100">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
              )}
            </div>
            <span className={`text-sm ${hasChildren ? 'font-bold text-gray-700' : 'font-medium text-gray-500 pl-2'} truncate`}>
              {node.title}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {hasChildren && (
              <div className="flex items-center gap-1 mr-2 border-r border-gray-100 pr-2 flex-shrink-0">
                <button onClick={() => handleExpandSpecificNode(node)} className="p-1 text-gray-400 hover:text-brand-blue bg-white rounded shadow-sm md:shadow-none md:bg-transparent" title="Expand Sub-topics"><Maximize2 size={14}/></button>
                <button onClick={() => handleCollapseSpecificNode(node)} className="p-1 text-gray-400 hover:text-brand-blue bg-white rounded shadow-sm md:shadow-none md:bg-transparent" title="Collapse Sub-topics"><Minimize2 size={14}/></button>
              </div>
            )}
            
            {canEdit && (
              <>
                <IconButton size="small" onClick={() => setAddingTo({ parentId: node._id, course: courseName })} className="text-brand-blue"><Plus size={16}/></IconButton>
                <IconButton size="small" onClick={() => { 
                  if(window.confirm("Delete topic and all sub-topics?")) {
                    const endpoint = isGlobalMode ? 'nodes/master' : 'nodes';
                    fetch(`${import.meta.env.VITE_API}dashboard/tracker/${endpoint}/${node._id}?username=${isGlobalMode ? 'admin' : targetUsername}`, { 
                      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
                    }).then(() => isGlobalMode ? setPreviewNodes(prev => prev.filter(n => n._id !== node._id)) : fetchUserNodes()) 
                  }
                }} className="text-red-400"><Trash2 size={14}/></IconButton>
              </>
            )}
          </div>
        </div>

        {addingTo?.parentId === node._id && (
          <div className="flex items-center gap-2 py-2 pr-4 bg-blue-50/30" style={{ paddingLeft: `${node.level * 1.5}rem` }}>
            <input autoFocus value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Sub-topic name..." className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-sm outline-none" />
            <button onClick={() => handleAddNode(node._id, courseName)} className="bg-brand-blue text-white p-1.5 rounded-lg"><Check size={16}/></button>
            <button onClick={() => setAddingTo(null)} className="text-gray-400"><X size={16}/></button>
          </div>
        )}

        {isExpanded && node.children && node.children.map((child: any, idx: number) => renderNode(child, idx, node.children, courseName, isPreview))}
      </div>
    );
  };

  return (
    <div className="w-full h-screen flex bg-white overflow-hidden relative font-body">
      {/* --- SIDEBAR --- */}
      <div className={`absolute inset-y-0 left-0 z-50 bg-slate-50 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 md:w-80 md:border-r border-gray-200 ${isMobileSidebarOpen ? 'translate-x-0 w-[85%]' : '-translate-x-full w-[85%]'}`}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
          <h2 className="font-black text-xl text-brand-blue flex items-center gap-2"><Globe size={24} /> Explorer</h2>
          <IconButton onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden"><X size={20}/></IconButton>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {isStrictAdmin ? (
            <div className="bg-orange-50 text-brand-orange p-3.5 rounded-xl font-bold flex items-center gap-2 border border-brand-orange/20 shadow-sm">
              <ShieldCheck size={18}/> Global Master Catalog
            </div>
          ) : isHybridAdmin ? (
            <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
              <FormControlLabel
                control={<Switch checked={isGlobalMode} onChange={(e) => {
                  setIsGlobalMode(e.target.checked);
                  setActiveView(e.target.checked ? 'global_builder' : 'path');
                }} color="warning" />}
                label={<span className="text-xs font-black uppercase tracking-tighter text-slate-600">Global Catalog Mode</span>}
              />
            </div>
          ) : null}

          {!isStrictAdmin && (
            <div className="space-y-2">
              <button onClick={() => { setActiveView('path'); setIsGlobalMode(false); setIsMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all ${activeView === 'path' ? 'bg-brand-blue text-white shadow-lg' : 'bg-white border text-gray-700'}`}>
                <BookMarked size={18} /> {isOwner ? 'My Syllabus' : `${targetUsername.split('@')[0]}'s Syllabus`}
              </button>
            </div>
          )}

          <div className="pt-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 mb-3">Global Catalog</p>
            <div className="space-y-1.5">
              {globalCourses.map(course => (
                <button key={course} onClick={() => { 
                    setPreviewCourse(course); 
                    setActiveView(isGlobalMode ? 'global_builder' : 'preview'); 
                    setIsMobileSidebarOpen(false); 
                  }} 
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${previewCourse === course && (activeView === 'preview' || activeView === 'global_builder') ? 'bg-slate-900 text-white' : 'bg-white border text-gray-600 hover:border-brand-blue'}`}
                >
                  <span className="truncate">{course}</span><ChevronRight size={14}/>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="p-4 md:p-8 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors self-start md:self-auto"><ArrowLeft size={20} /></button>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              {activeView === 'path' ? (isOwner ? 'Personal Path Builder' : `${targetUsername}'s Tracked Syllabus`) : 
               activeView === 'global_builder' ? 'Editing Global Catalog' : 
               `Previewing: ${previewCourse}`}
            </h1>
          </div>

          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search topics..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-blue outline-none transition-all text-sm font-medium" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/30 custom-scrollbar pb-32">
          {isLoading || isLoadingPreview ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-orange" size={48}/></div> : (
            <div className="max-w-5xl mx-auto space-y-8">
              
              {activeView === 'path' && (
                Object.keys(courseTrees).length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-[32px] bg-white">
                    <BookOpen size={64} className="mx-auto text-gray-200 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800">No Custom Syllabus Yet</h2>
                  </div>
                ) : (
                  Object.entries(courseTrees).map(([courseName, roots]) => (
                    <div key={courseName} className="animate-in fade-in slide-in-from-bottom-4">
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 px-2 gap-3">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-brand-blue"><BookOpen size={18}/></div>
                           <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{courseName}</h2>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => handleShareCourse(courseName)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm">
                            <Share2 size={14}/> Share Course
                          </button>
                          
                          {(isTeacher || isAdmin) && (
                             <button onClick={() => setShowPushModal({ isOpen: true, courseName })} className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-brand-blue text-brand-blue bg-blue-50 rounded-lg text-xs font-bold hover:bg-brand-blue hover:text-white transition-all shadow-sm">
                               <Send size={14}/> Push to Student
                             </button>
                          )}

                          {!isOwner && (
                            <button onClick={() => handleImportSharedCourse(courseName)} className="bg-brand-orange text-white px-4 py-1.5 rounded-lg text-xs font-black shadow-md active:scale-95 transition-transform flex items-center gap-1.5">
                              <DownloadCloud size={14}/> Add to My Tracker
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-sm">
                        {roots.map((node, idx) => renderNode(node, idx, roots, courseName))}
                        {(isOwner || isTeacher) && (
                          <button onClick={() => setAddingTo({ parentId: null, course: courseName })} className="w-full py-4 text-xs font-black text-brand-blue hover:bg-blue-50/50 transition-colors border-t border-gray-100 flex items-center justify-center gap-2 uppercase tracking-widest">
                            <Plus size={14} strokeWidth={3}/> Add Root Subject to {courseName}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}

              {(activeView === 'preview' || activeView === 'global_builder') && previewCourse && (
                <div className="border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-sm animate-in fade-in">
                   <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                     <span className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                        {isGlobalMode ? <ShieldCheck size={18} className="text-orange-500"/> : <Globe size={18}/>}
                        {previewCourse}
                     </span>
                     {!isGlobalMode && (
                        <button onClick={() => handleSubscribeToGlobal(previewCourse!)} className="bg-brand-orange px-4 py-1.5 rounded-lg text-xs font-black hover:scale-105 transition-transform flex items-center gap-1">
                          <DownloadCloud size={14}/> ADD TO MY TRACKER
                        </button>
                     )}
                   </div>
                   {previewTree.map((node, idx) => renderNode(node, idx, previewTree, previewCourse!, !isGlobalMode))}
                   
                   {isGlobalMode && (
                      <button onClick={() => setAddingTo({ parentId: null, course: previewCourse! })} className="w-full py-4 text-xs font-black text-brand-orange hover:bg-orange-50/50 transition-colors border-t border-gray-100 flex items-center justify-center gap-2 uppercase tracking-widest">
                        <Plus size={14} strokeWidth={3}/> Add Master Subject to {previewCourse}
                      </button>
                   )}
                </div>
              )}

              {(isOwner || isGlobalMode || isTeacher) && (activeView === 'path' || activeView === 'global_builder') && (
                <div className="border-2 border-dashed border-gray-200 rounded-[32px] p-10 text-center bg-white/50 hover:bg-white transition-all mt-12">
                  {isCreatingCourse ? (
                    <div className="max-w-sm mx-auto space-y-3 animate-in zoom-in-95 duration-200">
                      <input autoFocus value={newCourseName} onChange={e => setNewCourseName(e.target.value)} placeholder="Course Name (e.g., JEE Mains)" className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3 outline-none focus:border-brand-blue font-bold" />
                      <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="First Subject (e.g., Physics)" className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3 outline-none focus:border-brand-blue font-bold" />
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleAddNode(null, newCourseName, newItemName)} disabled={!newCourseName.trim() || !newItemName.trim() || isProcessing} className="flex-1 bg-slate-900 text-white py-3.5 rounded-2xl font-black shadow-lg disabled:opacity-30">CREATE</button>
                        <button onClick={() => setIsCreatingCourse(false)} className="px-5 py-3.5 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-colors">CANCEL</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setIsCreatingCourse(true)} className="flex flex-col items-center gap-3 group mx-auto">
                      <div className="p-5 bg-brand-blue/5 text-brand-blue rounded-full group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white transition-all duration-300">
                        <Plus size={40}/>
                      </div>
                      <span className="text-slate-900 font-black text-lg">Create New {isGlobalMode ? 'Master Catalog' : 'Course Group'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PUSH TO STUDENT MODAL */}
      {showPushModal.isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-4"><Send size={24}/></div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Push Syllabus</h3>
            <p className="text-sm text-gray-500 mb-6">Enter a student's username to copy <b>{showPushModal.courseName}</b> directly into their tracker.</p>
            <input autoFocus type="text" placeholder="student_username" value={pushTargetUsername} onChange={e => setPushTargetUsername(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-brand-blue text-center font-bold mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowPushModal({ isOpen: false, courseName: "" })} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handlePushToStudent} disabled={isProcessing || !pushTargetUsername.trim()} className="flex-[2] py-3 bg-brand-blue text-white rounded-xl font-black shadow-lg shadow-blue-500/20 disabled:opacity-50 flex justify-center items-center">
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : "Push Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE TRIGGER */}
      {!isMobileSidebarOpen && (
        <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden fixed bottom-6 left-6 z-40 bg-slate-900 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform">
          <Globe size={24} />
        </button>
      )}

      {/* TOAST */}
      {toast.show && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 flex items-center gap-2 px-6 py-3.5 rounded-full shadow-2xl font-bold text-sm ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.type === 'success' ? <Check size={18} /> : <X size={18} />} {toast.message}
        </div>
      )}
    </div>
  );
};

export default SyllabusExplorer;