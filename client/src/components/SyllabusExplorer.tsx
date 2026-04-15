import React, { useState, useEffect, useMemo } from 'react';
import { fetchWithCache } from '../utils/apiCache';
import { 
  BookOpen, FolderTree, Plus, Trash2, ChevronRight, ChevronDown, 
  Search, X, ArrowLeft, Globe, BookMarked, Check, Loader2
} from 'lucide-react';
import { IconButton, Button } from "@mui/material";
import Muialert from "./Muialert";
import { SyllabusTopic } from './SyllabusTracker';

interface FolderNode {
  name: string;
  pathId: string;
  subFolders: Record<string, FolderNode>;
  topics: SyllabusTopic[];
}

interface SyllabusExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  targetUsername: string | null | undefined;
  currentTopics: SyllabusTopic[];
  onSuccess: () => void;
}

const SyllabusExplorer: React.FC<SyllabusExplorerProps> = ({ isOpen, onClose, targetUsername, currentTopics, onSuccess }) => {
  // 1. View & Navigation State
  const [activeView, setActiveView] = useState<'my_path' | 'preview'>('my_path');
  const [previewCourse, setPreviewCourse] = useState<string | null>(null);
  const [globalCourses, setGlobalCourses] = useState<string[]>([]);
  const [previewTopics, setPreviewTopics] = useState<SyllabusTopic[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // 2. Inline Adding State
  const [addingTo, setAddingTo] = useState<{ subject: string, path: string | null } | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", type: "info" as "success" | "error" | "info" });

  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch available global courses on mount
  useEffect(() => {
    if (isOpen) {
      // 🚨 You will need to add this simple route to your backend: Syllabus.distinct("classSemester")
      fetch(`${import.meta.env.VITE_API}dashboard/syllabus/available-courses`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setGlobalCourses(data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  // Fetch Preview Data when a global course is clicked
  useEffect(() => {
    if (activeView === 'preview' && previewCourse) {
      setIsLoadingPreview(true);
      // Fetching the master syllabus for this specific class/course
      fetch(`${import.meta.env.VITE_API}dashboard/syllabus?classSemester=${previewCourse}`)
        .then(res => res.json())
        .then(data => setPreviewTopics(data))
        .catch(err => console.error(err))
        .finally(() => setIsLoadingPreview(false));
    }
  }, [activeView, previewCourse]);

  // Use the active dataset based on the view
  const displayTopics = activeView === 'my_path' ? currentTopics : previewTopics;

  // Filter & Group Topics
  const filteredTopics = useMemo(() => {
    let base = displayTopics || [];
    if (searchQuery.trim()) {
      base = base.filter(t => t.topicName.toLowerCase().includes(searchQuery.toLowerCase()) || t.subject?.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return base;
  }, [displayTopics, searchQuery]);

  const groupedTopics = useMemo(() => {
    return filteredTopics.reduce((acc, topic) => {
      const subjectName = topic.subject || "General";
      if (!acc[subjectName]) acc[subjectName] = [];
      acc[subjectName].push(topic);
      return acc;
    }, {} as Record<string, SyllabusTopic[]>);
  }, [filteredTopics]);

  // --- API HANDLERS ---

  const handleInlineAdd = async () => {
    if (!newItemName.trim() || !addingTo) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("jwtoken");
      const username = targetUsername || localStorage.getItem("Username");

      // Construct the full path. If adding to root subject, path is just the item.
      // If adding to a folder, append it.
      const fullTopicPath = addingTo.path ? `${addingTo.path} > ${newItemName.trim()}` : newItemName.trim();

      const res = await fetch(`${import.meta.env.VITE_API}dashboard/syllabus/add-custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          username,
          subject: addingTo.subject.trim(),
          topicName: fullTopicPath,
          isCustom: true
        })
      });

      if (res.ok) {
        setNewItemName("");
        setAddingTo(null);
        onSuccess(); // Refreshes the tracker
      } else throw new Error("Failed to add");
    } catch (error) {
      setAlertInfo({ show: true, message: "Error adding topic.", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (topicId: string, isCustom: boolean) => {
    if (!window.confirm(isCustom ? "Delete this custom topic?" : "Hide this topic from your path?")) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("jwtoken");
      const username = targetUsername || localStorage.getItem("Username");
      const res = await fetch(`${import.meta.env.VITE_API}dashboard/syllabus/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ username, topicId, isCustom })
      });
      if (res.ok) onSuccess();
      else throw new Error("Failed to delete");
    } catch (error) {
      setAlertInfo({ show: true, message: "Error removing topic.", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscribeToCourse = async () => {
    // This requires a backend route to push the `previewCourse` to the user's `activeSyllabuses` array
    if(!window.confirm(`Add the entire ${previewCourse} syllabus to your path?`)) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("jwtoken");
      const username = targetUsername || localStorage.getItem("Username");
      await fetch(`${import.meta.env.VITE_API}dashboard/syllabus/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ username, courseName: previewCourse })
      });
      setAlertInfo({ show: true, message: `${previewCourse} added to your tracker!`, type: "success" });
      onSuccess();
    } catch(err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => prev.includes(folderId) ? prev.filter(f => f !== folderId) : [...prev, folderId]);
  };

  if (!isOpen) return null;

  // --- RECURSIVE TREE RENDERER WITH INLINE ADDING ---
  const renderFolder = (node: FolderNode, depth: number, subject: string) => {
    return (
      <div className="w-full">
        {/* Render Subfolders */}
        {Object.values(node.subFolders).map(subFolder => {
          const isExpanded = expandedFolders.includes(subFolder.pathId);
          return (
            <div key={subFolder.pathId} className="w-full flex flex-col">
              <div className="flex items-center justify-between py-2.5 pr-4 border-b border-gray-50 hover:bg-slate-50 group">
                <div className="flex items-center flex-1 min-w-0" style={{ paddingLeft: `${(depth * 1.5) + 1}rem` }}>
                  <button onClick={() => toggleFolder(subFolder.pathId)} className="flex items-center gap-1.5 text-sm font-bold text-gray-700 hover:text-brand-blue truncate">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {subFolder.name}
                  </button>
                </div>
                {/* INLINE ADD BUTTON (Only visible in My Path) */}
                {activeView === 'my_path' && (
                  <IconButton onClick={() => setAddingTo({ subject, path: subFolder.pathId })} size="small" className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-blue">
                    <Plus size={16} />
                  </IconButton>
                )}
              </div>

              {/* Recursive Children & Inline Input Field */}
              {isExpanded && (
                <div className="w-full bg-white/50">
                  {renderFolder(subFolder, depth + 1, subject)}
                  
                  {/* The Inline Input Field for this folder */}
                  {addingTo?.path === subFolder.pathId && (
                    <div className="flex items-center gap-2 py-2 pr-4 border-b border-gray-50 bg-blue-50/30" style={{ paddingLeft: `${((depth + 1) * 1.5) + 2}rem` }}>
                      <ChevronRight size={14} className="text-brand-blue" />
                      <input 
                        autoFocus
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInlineAdd()}
                        placeholder={`Add topic inside ${subFolder.name}...`}
                        className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-blue"
                      />
                      <button onClick={handleInlineAdd} disabled={isProcessing || !newItemName.trim()} className="bg-brand-blue text-white p-1.5 rounded-lg hover:bg-blue-800 disabled:opacity-50"><Check size={16}/></button>
                      <button onClick={() => {setAddingTo(null); setNewItemName("");}} className="text-gray-400 hover:text-red-500 p-1.5"><X size={16}/></button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Render Leaf Topics */}
        {node.topics.map(topic => {
          const isCustom = (topic as any).isCustom || false;
          return (
            <div key={topic.id || topic._id} className="flex items-center justify-between py-2 pr-4 border-b border-gray-50 hover:bg-slate-50 group">
              <div className="flex items-center flex-1 min-w-0 gap-2" style={{ paddingLeft: `${(depth * 1.5) + 2.5}rem` }}>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-600 truncate">{topic.leafName || topic.topicName.split(' > ').pop()}</span>
                {isCustom && activeView === 'my_path' && <span className="text-[9px] uppercase font-black text-brand-orange bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded">Custom</span>}
              </div>
              {activeView === 'my_path' && (
                <IconButton onClick={() => handleDelete((topic._id || topic.id) as string, isCustom)} size="small" className="opacity-0 group-hover:opacity-100 text-red-500">
                  <Trash2 size={14} />
                </IconButton>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-200">
      
      {/* 1. SIDEBAR (Global Courses & Navigation) */}
      <div className="w-full md:w-80 bg-slate-50 border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between bg-white">
          <h2 className="font-display font-black text-xl text-brand-blue flex items-center gap-2">
            <Globe size={24} /> Explorer
          </h2>
          <IconButton onClick={onClose} size="small" className="md:hidden"><X size={20}/></IconButton>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* My Path Section */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">Your Tracker</p>
            <button 
              onClick={() => { setActiveView('my_path'); setPreviewCourse(null); setAddingTo(null); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${activeView === 'my_path' ? 'bg-brand-blue text-white shadow-md' : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-blue/50 hover:shadow-sm'}`}
            >
              <BookMarked size={18} /> My Personal Path
            </button>
          </div>

          {/* Global Catalog Section */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">Global Catalog</p>
            <div className="space-y-2">
              {globalCourses.length === 0 ? (
                <p className="text-sm text-gray-500 pl-2">Loading courses...</p>
              ) : (
                globalCourses.map(course => (
                  <button
                    key={course}
                    onClick={() => { setActiveView('preview'); setPreviewCourse(course); setAddingTo(null); }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-sm font-medium ${activeView === 'preview' && previewCourse === course ? 'bg-orange-50 border border-brand-orange text-brand-orange shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-orange/50'}`}
                  >
                    {course} <ChevronRight size={16} className={activeView === 'preview' && previewCourse === course ? 'text-brand-orange' : 'text-gray-300'}/>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-white hidden md:block">
          <Button onClick={onClose} fullWidth variant="outlined" startIcon={<ArrowLeft size={18}/>} sx={{ borderRadius: '12px', color: '#64748b', borderColor: '#cbd5e1', textTransform: 'none', fontWeight: 'bold' }}>Back to Dashboard</Button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA (Tree Editor/Previewer) */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        
        {/* Main Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-1">
              {activeView === 'my_path' ? 'Edit Your Syllabus' : `Previewing: ${previewCourse}`}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              {activeView === 'my_path' ? 'Add, organize, or hide topics in your personal tracker.' : 'Browse the official curriculum before adding it.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search tree..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-blue" />
            </div>
            {activeView === 'preview' && (
              <Button onClick={handleSubscribeToCourse} disabled={isProcessing} variant="contained" sx={{ bgcolor: '#ed7f23', fontWeight: 'bold', borderRadius: '12px', textTransform: 'none', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#d66b1a' } }}>
                {isProcessing ? "Adding..." : "Add to Tracker"}
              </Button>
            )}
          </div>
        </div>

        {/* Tree Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
          
          {isLoadingPreview ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10"><Loader2 className="animate-spin text-brand-orange mb-4" size={40} /></div>
          ) : Object.keys(groupedTopics).length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <FolderTree size={60} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-bold text-gray-500">No topics found.</p>
              {activeView === 'my_path' && <p className="text-sm mt-2">Click the plus icons below or browse the Global Catalog to add some.</p>}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white max-w-5xl mx-auto">
              {Object.entries(groupedTopics).map(([subject, subjectTopics]) => {
                const root: FolderNode = { name: 'root', pathId: subject, subFolders: {}, topics: [] };
                subjectTopics.forEach(topic => {
                    const pathArray = topic.path || topic.topicName.split(' > ').slice(0, -1);
                    let currentFolder = root; let runningPath = subject;
                    pathArray.forEach(folderName => {
                        runningPath = `${runningPath} > ${folderName}`;
                        if (!currentFolder.subFolders[folderName]) currentFolder.subFolders[folderName] = { name: folderName, pathId: runningPath, subFolders: {}, topics: [] };
                        currentFolder = currentFolder.subFolders[folderName];
                    });
                    currentFolder.topics.push(topic);
                });

                return (
                  <div key={subject} className="border-b border-gray-200 last:border-0">
                    {/* Subject Header */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 group">
                      <div className="flex items-center gap-2 font-bold text-gray-900 text-lg">
                        <FolderTree size={20} className="text-brand-blue" /> {subject}
                      </div>
                      {/* INLINE ADD BUTTON FOR SUBJECT */}
                      {activeView === 'my_path' && (
                        <IconButton onClick={() => setAddingTo({ subject, path: null })} size="small" className="opacity-0 group-hover:opacity-100 text-brand-blue bg-white shadow-sm">
                          <Plus size={18} />
                        </IconButton>
                      )}
                    </div>

                    {/* Inline Add Input for Root Subject Level */}
                    {addingTo?.subject === subject && addingTo?.path === null && (
                      <div className="flex items-center gap-2 p-3 pl-8 border-b border-gray-100 bg-blue-50/50">
                        <ChevronRight size={14} className="text-brand-blue" />
                        <input autoFocus value={newItemName} onChange={(e) => setNewItemName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInlineAdd()} placeholder={`Add root folder or topic to ${subject}...`} className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-blue" />
                        <button onClick={handleInlineAdd} disabled={isProcessing || !newItemName.trim()} className="bg-brand-blue text-white p-1.5 rounded-lg hover:bg-blue-800 disabled:opacity-50"><Check size={16}/></button>
                        <button onClick={() => {setAddingTo(null); setNewItemName("");}} className="text-gray-400 hover:text-red-500 p-1.5"><X size={16}/></button>
                      </div>
                    )}

                    {/* Render the Tree */}
                    <div className="bg-white">
                      {renderFolder(root, 0, subject)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Completely New Subject Button */}
          {activeView === 'my_path' && (
            <div className="max-w-5xl mx-auto mt-6 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-brand-blue hover:bg-slate-50 transition-colors">
              {addingTo?.subject === 'NEW_SUBJECT' ? (
                <div className="flex items-center max-w-md mx-auto gap-2">
                  <input autoFocus value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Type new Subject name..." className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue shadow-sm" />
                  <button onClick={() => {
                    if(!newItemName.trim()) return;
                    setAddingTo({ subject: newItemName.trim(), path: null });
                    setNewItemName(""); // Setup to instantly add a topic underneath it next
                    setAlertInfo({ show: true, message: `Subject created! Add a topic inside ${newItemName} to save it.`, type: "info" });
                  }} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-bold text-sm">Next</button>
                  <button onClick={() => setAddingTo(null)} className="text-gray-400 hover:text-red-500 p-2"><X size={20}/></button>
                </div>
              ) : (
                <button onClick={() => setAddingTo({ subject: 'NEW_SUBJECT', path: null })} className="font-bold text-brand-blue flex items-center justify-center gap-2 w-full">
                  <Plus size={20} /> Create Completely New Subject
                </button>
              )}
            </div>
          )}
          
          <div className="h-32 flex-shrink-0" /> {/* Bottom scroll padding */}
        </div>

      </div>

      {alertInfo.show && <Muialert message={alertInfo.message} severity={alertInfo.type} onClose={() => setAlertInfo({ ...alertInfo, show: false })} />}
    </div>
  );
};

export default SyllabusExplorer;