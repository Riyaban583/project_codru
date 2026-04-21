import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchWithCache } from '../utils/apiCache';
import { 
  FolderTree, Plus, Trash2, ChevronRight, ChevronDown, 
  Search, X, ArrowLeft, Globe, BookMarked, Check, Loader2, Maximize2, Minimize2, ArrowUp, ArrowDown, BookOpen
} from 'lucide-react';
import { IconButton, Button } from "@mui/material";

export interface TrackerNode {
  _id: string;
  title: string;
  parentId: string | null;
  course: string;
  level: number;
  order: number;
  isCustom: boolean;
}

const SyllabusExplorer = () => {
  const { username: routeUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  // 🚨 targetUsername figures out exactly WHOSE database we are editing
  const targetUsername = routeUsername || localStorage.getItem("Username") || localStorage.getItem("username");

  const [userNodes, setUserNodes] = useState<TrackerNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'my_path' | 'preview'>('my_path');
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
  
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUserNodes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("jwtoken");
      const url = `${import.meta.env.VITE_API}dashboard/tracker/nodes?username=${targetUsername}`; 
      const data = await fetchWithCache(url, { "Authorization": `Bearer ${token}` }, true);
      setUserNodes(Array.isArray(data) ? data : []);
    } catch (err) { setUserNodes([]); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchUserNodes();
    const token = localStorage.getItem("jwtoken");
    fetch(`${import.meta.env.VITE_API}dashboard/tracker/available-courses`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setGlobalCourses(data))
      .catch(() => setGlobalCourses([]));
  }, [targetUsername]);

  useEffect(() => {
    if (activeView === 'preview' && previewCourse) {
      setIsLoadingPreview(true);
      const token = localStorage.getItem("jwtoken"); 
      fetch(`${import.meta.env.VITE_API}dashboard/tracker/blueprint?course=${encodeURIComponent(previewCourse)}`, {
        headers: { "Authorization": `Bearer ${token}` } 
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setPreviewNodes(data))
        .finally(() => setIsLoadingPreview(false));
    }
  }, [activeView, previewCourse]);

  // --- TREE BUILDING LOGIC ---
  const buildTree = (nodes: TrackerNode[]) => {
    const nodesMap = new Map<string, any>();
    const roots: any[] = [];
    nodes.forEach(node => nodesMap.set(node._id, { ...node, children: [] }));
    nodesMap.forEach(node => {
      if (node.parentId && nodesMap.has(node.parentId)) {
        nodesMap.get(node.parentId).children.push(node);
      } else if (!node.parentId) { roots.push(node); }
    });
    const recursiveSort = (arr: any[]) => {
      arr.sort((a, b) => a.order - b.order);
      arr.forEach(item => recursiveSort(item.children));
    };
    recursiveSort(roots);
    return roots;
  };

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
    Object.keys(groups).forEach(course => {
      finalTrees[course] = buildTree(groups[course]);
    });
    return finalTrees;
  }, [userNodes, searchQuery]);

  const previewTree = useMemo(() => buildTree(previewNodes), [previewNodes]);

  // --- HANDLERS ---
  const handleAddNode = async (parentId: string | null, courseName: string, explicitTitle?: string) => {
    const finalTitle = explicitTitle !== undefined ? explicitTitle : newItemName;
    
    if (!finalTitle.trim() || !courseName.trim()) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("jwtoken");
      const res = await fetch(`${import.meta.env.VITE_API}dashboard/tracker/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        // 🚨 Attached username here
        body: JSON.stringify({ 
          title: finalTitle.trim(), 
          parentId, 
          course: courseName.trim(),
          username: targetUsername 
        })
      });
      if (res.ok) {
        setNewItemName("");
        setAddingTo(null);
        setIsCreatingCourse(false); 
        setNewCourseName("");       
        fetchUserNodes();
        showToast("Added successfully");
      } else {
        showToast("Failed to add", "error");
      }
    } catch (err) { showToast("Error adding", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleDeleteNode = async (id: string) => {
    if (!window.confirm("Delete this and all sub-topics?")) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("jwtoken");
      // 🚨 Attached username here as query parameter
      await fetch(`${import.meta.env.VITE_API}dashboard/tracker/nodes/${id}?username=${targetUsername}`, {
        method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
      });
      fetchUserNodes(); showToast("Deleted");
    } finally { setIsProcessing(false); }
  };

  const handleReorder = async (siblings: TrackerNode[], index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;
    const nodeA = siblings[index];
    const nodeB = siblings[targetIdx];
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("jwtoken");
      await fetch(`${import.meta.env.VITE_API}dashboard/tracker/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        // 🚨 Attached username here
        body: JSON.stringify({ updates: [{ id: nodeA._id, order: nodeB.order }, { id: nodeB._id, order: nodeA.order }], username: targetUsername })
      });
      fetchUserNodes();
    } finally { setIsProcessing(false); }
  };

  const handleSubscribe = async () => {
    if (!previewCourse) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("jwtoken");
      const res = await fetch(`${import.meta.env.VITE_API}dashboard/tracker/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        // 🚨 Attached username here
        body: JSON.stringify({ courseName: previewCourse, username: targetUsername })
      });
      if (res.ok) { fetchUserNodes(); setActiveView('my_path'); showToast("Course added!"); }
    } finally { setIsProcessing(false); }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const renderNode = (node: any, index: number, siblings: any[], courseName: string) => {
    const isExpanded = expandedNodes.includes(node._id);
    const hasChildren = node.children.length > 0;
    const canAddChild = node.level < 5;

    return (
      <div key={node._id} className="w-full">
        <div className="flex items-center justify-between py-2.5 pr-4 border-b border-gray-50 hover:bg-slate-50 transition group">
          <div className="flex items-center flex-1 min-w-0" style={{ paddingLeft: `${(node.level - 1) * 1.5}rem` }}>
            {hasChildren ? (
              <button onClick={() => setExpandedNodes(prev => prev.includes(node._id) ? prev.filter(i => i !== node._id) : [...prev, node._id])} className="flex items-center gap-1.5 text-sm font-bold text-gray-700 truncate">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="truncate">{node.title}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 pl-5 text-sm font-medium text-gray-600 truncate">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <span className="truncate">{node.title}</span>
              </div>
            )}
          </div>

          {activeView === 'my_path' && (
            <div className="flex items-center gap-1 ml-2">
              <div className="flex items-center border-r border-gray-100 pr-1">
                <IconButton size="small" disabled={index === 0 || isProcessing} onClick={() => handleReorder(siblings, index, 'up')}><ArrowUp size={14}/></IconButton>
                <IconButton size="small" disabled={index === siblings.length - 1 || isProcessing} onClick={() => handleReorder(siblings, index, 'down')}><ArrowDown size={14}/></IconButton>
              </div>
              {canAddChild && (
                <IconButton size="small" onClick={() => setAddingTo({ parentId: node._id, course: courseName })} className="text-brand-blue"><Plus size={18}/></IconButton>
              )}
              <IconButton size="small" onClick={() => handleDeleteNode(node._id)} className="text-red-500"><Trash2 size={16}/></IconButton>
            </div>
          )}
        </div>

        {addingTo?.parentId === node._id && (
          <div className="flex items-center gap-2 py-2 pr-4 bg-blue-50/30" style={{ paddingLeft: `${node.level * 1.5}rem` }}>
            <input autoFocus value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Name..." className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-sm" />
            <button onClick={() => handleAddNode(node._id, courseName)} className="bg-brand-blue text-white p-1.5 rounded-lg"><Check size={16}/></button>
            <button onClick={() => setAddingTo(null)} className="text-gray-400"><X size={16}/></button>
          </div>
        )}

        {isExpanded && node.children.map((child: any, idx: number) => renderNode(child, idx, node.children, courseName))}
      </div>
    );
  };

  return (
    <div className="w-full h-screen flex bg-white overflow-hidden relative">
      {isMobileSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <div className={`absolute inset-y-0 left-0 z-50 bg-slate-50 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 md:w-80 md:border-r border-gray-200 ${isMobileSidebarOpen ? 'translate-x-0 w-[85%]' : '-translate-x-full w-[85%]'}`}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
          <h2 className="font-black text-xl text-brand-blue flex items-center gap-2"><Globe size={24} /> Explorer</h2>
          <IconButton onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden"><X size={20}/></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <button onClick={() => { setActiveView('my_path'); setIsMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeView === 'my_path' ? 'bg-brand-blue text-white shadow-md' : 'bg-white border text-gray-700'}`}>
            <BookMarked size={18} /> {routeUsername ? `${routeUsername}'s Path` : 'My Personal Path'}
          </button>
          <p className="text-xs font-bold text-gray-400 uppercase pl-2">Global Catalog</p>
          <div className="space-y-2">
            {globalCourses.map(course => (
              <button key={course} onClick={() => { setActiveView('preview'); setPreviewCourse(course); setIsMobileSidebarOpen(false); }} className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium ${previewCourse === course && activeView === 'preview' ? 'bg-orange-50 border-brand-orange text-brand-orange' : 'bg-white border text-gray-600'}`}>
                <span className="truncate">{course}</span><ChevronRight size={16}/>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="p-4 md:p-8 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-gray-50 border rounded-full text-gray-600"><ArrowLeft size={20} /></button>
            <h1 className="text-xl md:text-3xl font-black text-gray-900 leading-tight">
              {activeView === 'my_path' ? 'Personal Path Builder' : `Previewing: ${previewCourse}`}
            </h1>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search tree..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/30 custom-scrollbar">
          {isLoading || isLoadingPreview ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-orange" size={40}/></div> : (
            <>
              {activeView === 'my_path' ? (
                Object.entries(courseTrees).map(([courseName, roots]) => (
                  <div key={courseName} className="mb-10 max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 px-2">
                      <BookOpen size={20} className="text-brand-blue" />
                      <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{courseName}</h2>
                    </div>
                    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                      {roots.map((node, idx) => renderNode(node, idx, roots, courseName))}
                      <button onClick={() => setAddingTo({ parentId: null, course: courseName })} className="w-full py-4 text-sm font-bold text-brand-blue hover:bg-blue-50 transition-colors border-t border-gray-100 flex items-center justify-center gap-2">
                        <Plus size={16}/> Add New Subject to {courseName}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="max-w-5xl mx-auto border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  {previewTree.map((node, idx) => renderNode(node, idx, previewTree, previewCourse!))}
                  <div className="p-4 bg-slate-50 border-t flex justify-center">
                    <Button onClick={handleSubscribe} variant="contained" sx={{ bgcolor: '#ed7f23', fontWeight: 'bold' }}>Add entire {previewCourse} to Tracker</Button>
                  </div>
                </div>
              )}

              {activeView === 'my_path' && (
                <div className="max-w-5xl mx-auto mt-12 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-white/50">
                  {isCreatingCourse ? (
                    <div className="flex flex-col max-w-sm mx-auto gap-3">
                      <input 
                        autoFocus 
                        value={newCourseName} 
                        onChange={e => setNewCourseName(e.target.value)} 
                        placeholder="Course Name (e.g., JEE Mains)" 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 ring-brand-blue outline-none text-sm" 
                      />
                      <input 
                        value={newItemName} 
                        onChange={e => setNewItemName(e.target.value)} 
                        placeholder="First Subject (e.g., Physics)" 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 ring-brand-blue outline-none text-sm" 
                      />
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => handleAddNode(null, newCourseName, newItemName)} 
                          disabled={!newCourseName.trim() || !newItemName.trim() || isProcessing}
                          className="flex-1 bg-brand-blue text-white px-4 py-2.5 rounded-lg font-bold disabled:opacity-50"
                        >
                          Create Course
                        </button>
                        <button onClick={() => setIsCreatingCourse(false)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors"><X size={20}/></button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setIsCreatingCourse(true)} className="flex flex-col items-center gap-2 text-brand-blue font-black hover:scale-105 transition-transform mx-auto">
                      <div className="p-4 bg-blue-50 rounded-full"><Plus size={32}/></div>
                      Create a Completely New Course Group
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          <div className="h-48" />
        </div>
      </div>

      {!isMobileSidebarOpen && (
        <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white px-5 py-2.5 rounded-full shadow-xl text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform">
          <Globe size={16} /> Browse
        </button>
      )}

      {toast.show && (
        <div className="fixed bottom-36 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white font-bold text-sm shadow-2xl">
          {toast.type === 'success' && <Check size={16} className="text-green-400" />} {toast.message}
        </div>
      )}
    </div>
  );
};

export default SyllabusExplorer;