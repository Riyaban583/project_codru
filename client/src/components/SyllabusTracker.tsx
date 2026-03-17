import React, { useState, useEffect, useMemo } from 'react';
import { fetchWithCache, invalidateCacheItem } from '../utils/apiCache';
import { 
  CheckCircle, Circle, AlertCircle, Filter, ChevronDown, 
  ChevronRight, User, TrendingUp, Clock, Zap, Maximize2, Minimize2, Search, X, Download 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface SyllabusTopic {
  id?: string;
  _id?: string;
  subject: string;
  topicName: string;
  path?: string[];     
  leafName?: string;   
  status: 'not_started' | 'completed' | 'completed_with_doubt'; 
  hasDoubt: boolean;
  lastUpdated?: string;
}

interface FolderNode {
  name: string;
  pathId: string;
  subFolders: Record<string, FolderNode>;
  topics: SyllabusTopic[];
}

interface SyllabusTrackerProps {
  role: 'student' | 'teacher' | string;
  readOnly?: boolean;
  selectedStudentUsername?: string | null;
}

// 🚨 HELPERS
const getAllFolderIds = (node: FolderNode): string[] => {
    let ids = [node.pathId];
    Object.values(node.subFolders).forEach(sub => { ids = [...ids, ...getAllFolderIds(sub)]; });
    return ids;
};

const getAllTopicsFromNode = (node: FolderNode): SyllabusTopic[] => {
    let topics = [...node.topics];
    Object.values(node.subFolders).forEach(sub => { topics = [...topics, ...getAllTopicsFromNode(sub)]; });
    return topics;
};

const ProgressBar = ({ percent, colorClass = "bg-brand-blue" }: { percent: number, colorClass?: string }) => (
  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
    <div className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)] ${colorClass}`} style={{ width: `${percent}%` }} />
  </div>
);

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const SyllabusTracker: React.FC<SyllabusTrackerProps> = ({ role, readOnly = false, selectedStudentUsername }) => {
  const [localTopics, setLocalTopics] = useState<SyllabusTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'doubts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [teacherStudents, setTeacherStudents] = useState<any[]>([]);

  const safeRole = role?.toLowerCase() || 'student';

  useEffect(() => {
    const fetchTeacherStudents = async () => {
      if (safeRole === 'teacher') {
        const teacherUsername = localStorage.getItem("Username") || localStorage.getItem("username");
        if (!teacherUsername) return;
        const token = localStorage.getItem("jwtoken");
        const res = await fetch(`${import.meta.env.VITE_API}my-students/${teacherUsername}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) setTeacherStudents(await res.json());
      }
    };
    fetchTeacherStudents();
  }, [safeRole]);

  useEffect(() => {
    const fetchSyllabus = async () => {
      if (safeRole === 'teacher' && !selectedStudentUsername) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const token = localStorage.getItem("jwtoken");
        const headers = { "Authorization": `Bearer ${token}` };
        let url = `${import.meta.env.VITE_API}dashboard/syllabus`;
        if (safeRole === 'teacher' && selectedStudentUsername) {
          url = `${import.meta.env.VITE_API}dashboard/syllabus?username=${selectedStudentUsername}`;
        }
        const data = await fetchWithCache(url, headers);
        if (data) {
          setLocalTopics(Array.isArray(data) ? data.map((topic: any) => ({ ...topic, id: topic._id || topic.id, status: topic.status || 'not_started', hasDoubt: !!topic.hasDoubt })) : []);
        }
      } catch (error) { console.error(error); setLocalTopics([]); } finally { setIsLoading(false); }
    };
    fetchSyllabus();
  }, [safeRole, selectedStudentUsername]);

  const activeTopics = useMemo(() => localTopics.filter(t => t.topicName && t.topicName !== "New Topic"), [localTopics]);

  const overallStats = useMemo(() => {
    const total = activeTopics.length;
    const completed = activeTopics.filter(t => t.status.includes('completed')).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const latestDate = activeTopics.map(t => t.lastUpdated).filter(Boolean).sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];
    return { total, completed, percentage, lastActivity: latestDate };
  }, [activeTopics]);

  const commonDoubts = useMemo(() => {
    if (safeRole !== 'teacher' || teacherStudents.length === 0) return [];
    const doubtMap = new Map<string, { count: number; subject: string; lastUpdated: string | null }>();
    teacherStudents.forEach(student => {
      const studentSyllabus = Array.isArray(student.syllabus) ? student.syllabus : [];
      studentSyllabus.forEach((topic: any) => {
        if (topic.topicName && topic.topicName !== "New Topic" && (topic.hasDoubt || topic.status === 'completed_with_doubt')) {
          const key = topic.topicName;
          const existing = doubtMap.get(key);
          if (existing) { existing.count++; if (topic.lastUpdated && (!existing.lastUpdated || new Date(topic.lastUpdated) > new Date(existing.lastUpdated))) existing.lastUpdated = topic.lastUpdated; }
          else doubtMap.set(key, { count: 1, subject: topic.subject || "General", lastUpdated: topic.lastUpdated || null });
        }
      });
    });
    return Array.from(doubtMap.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.count - a.count);
  }, [teacherStudents, safeRole]);

  const filteredTopics = useMemo(() => {
    let base = activeTopics;
    if (filter === 'doubts') base = base.filter(t => t.hasDoubt || t.status === 'completed_with_doubt');
    if (searchQuery.trim()) base = base.filter(t => t.topicName.toLowerCase().includes(searchQuery.toLowerCase()) || t.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    return base;
  }, [activeTopics, filter, searchQuery]);

  const groupedTopics = useMemo(() => filteredTopics.reduce((acc, topic) => {
      const subjectName = topic.subject || "General";
      if (!acc[subjectName]) acc[subjectName] = [];
      acc[subjectName].push(topic);
      return acc;
    }, {} as Record<string, SyllabusTopic[]>), [filteredTopics]);

  // 🚨 HANDLERS
  const handleUpdateTopic = async (topicId: string, updates: Partial<SyllabusTopic>) => {
    if (readOnly || safeRole === 'teacher') return; 
    const now = new Date().toISOString();
    const currentTopic = activeTopics.find(t => (t._id === topicId || t.id === topicId));
    if (!currentTopic) return;
    setLocalTopics(prev => prev.map(t => ((t.id === topicId || t._id === topicId) ? { ...t, ...updates, lastUpdated: now } : t) as SyllabusTopic));
    try {
      const token = localStorage.getItem("jwtoken");
      await fetch(`${import.meta.env.VITE_API}dashboard/syllabus/${topicId}`, {
        method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ ...updates, topicName: currentTopic.topicName, subject: currentTopic.subject })   
      });
      invalidateCacheItem(`${import.meta.env.VITE_API}dashboard/syllabus`);
    } catch (error) { console.error(error); }
  };

  const handleBulkUpdate = async (topicsToUpdate: SyllabusTopic[], updates: { status?: SyllabusTopic['status'], hasDoubt?: boolean }) => {
    if (readOnly || safeRole === 'teacher' || topicsToUpdate.length === 0) return;
    const now = new Date().toISOString();
    const topicIds = topicsToUpdate.map(t => t.id || t._id as string);
    setLocalTopics(prev => prev.map(t => {
      const tId = t.id || t._id;
      if (tId && topicIds.includes(tId)) {
        let newStatus = updates.status !== undefined ? updates.status : t.status;
        let newDoubt = updates.hasDoubt !== undefined ? updates.hasDoubt : t.hasDoubt;
        if (newDoubt && newStatus === 'completed') newStatus = 'completed_with_doubt';
        if (!newDoubt && newStatus === 'completed_with_doubt') newStatus = 'completed';
        return { ...t, status: newStatus, hasDoubt: newDoubt, lastUpdated: now } as SyllabusTopic;
      }
      return t;
    }));
    try {
      const token = localStorage.getItem("jwtoken");
      await Promise.all(topicsToUpdate.map(async (t) => {
        const tId = t.id || t._id;
        let newStatus = updates.status !== undefined ? updates.status : t.status;
        let newDoubt = updates.hasDoubt !== undefined ? updates.hasDoubt : t.hasDoubt;
        if (newDoubt && newStatus === 'completed') newStatus = 'completed_with_doubt';
        if (!newDoubt && newStatus === 'completed_with_doubt') newStatus = 'completed';
        await fetch(`${import.meta.env.VITE_API}dashboard/syllabus/${tId}`, {
          method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ status: newStatus, hasDoubt: newDoubt, topicName: t.topicName, subject: t.subject })
        });
      }));
      invalidateCacheItem(`${import.meta.env.VITE_API}dashboard/syllabus`);
    } catch (error) { console.error(error); }
  };

  const handleExpandAll = () => {
    const allSubjects = Array.from(new Set(activeTopics.map(t => t.subject)));
    const allFolderPaths: string[] = [];
    activeTopics.forEach(t => {
      const pathArray = t.path || t.topicName.split(' > ').slice(0, -1);
      let currentPath = t.subject;
      pathArray.forEach(segment => { currentPath = `${currentPath} > ${segment}`; allFolderPaths.push(currentPath); });
    });
    setExpandedSubjects(allSubjects); setExpandedFolders(Array.from(new Set(allFolderPaths)));
  };

  const handleCollapseAll = () => { setExpandedSubjects([]); setExpandedFolders([]); setSearchQuery(''); };
  const toggleSubject = (subject: string) => setExpandedSubjects(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
  const toggleFolder = (folderId: string) => setExpandedFolders(prev => prev.includes(folderId) ? prev.filter(f => f !== folderId) : [...prev, folderId]);

  // 🚨 PDF LOGIC
  const generatePDF = () => {
    const doc = new jsPDF();
    const studentName = teacherStudents.find(s => s.username === selectedStudentUsername)?.name || "Student";
    const date = new Date().toLocaleDateString('en-GB');

    // 1. HEADER SECTION (Dual Circles)
    doc.setFillColor(23, 101, 164); // Brand Blue
    doc.rect(0, 0, 210, 45, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("ACADEMIC INSIGHT REPORT", 14, 25);
    doc.setFontSize(10);
    doc.text(`STUDENT: ${studentName.toUpperCase()}`, 14, 35);
    doc.text(`GENERATED: ${date}`, 160, 35);

    // Circles Header
    const remainingPercent = 100 - overallStats.percentage;
    
    // Mastery Circle
    doc.setDrawColor(34, 197, 94); // Green
    doc.setLineWidth(1.5);
    doc.circle(40, 75, 15, 'S');
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(12);
    doc.text(`${overallStats.percentage}%`, 35, 77);
    doc.setFontSize(8);
    doc.text("MASTERED", 32, 95);

    // Remaining Circle
    doc.setDrawColor(234, 179, 8); // Yellow/Amber
    doc.circle(80, 75, 15, 'S');
    doc.setTextColor(234, 179, 8);
    doc.setFontSize(12);
    doc.text(`${remainingPercent}%`, 75, 77);
    doc.setFontSize(8);
    doc.text("REMAINING", 72, 95);

    // 2. COMPLETED TOPICS (Detailed)
    doc.setTextColor(40);
    doc.setFontSize(14);
    doc.text("I. COMPLETED MILESTONES", 14, 115);
    
    const completedRows = activeTopics
      .filter(t => t.status.includes('completed'))
      .map(t => [t.subject, t.path?.[0] || 'General', t.leafName || t.topicName.split(' > ').pop() || '']);

    autoTable(doc, {
      startY: 120,
      head: [['Subject', 'Chapter', 'Sub-Topic']],
      body: completedRows,
      headStyles: { fillColor: [34, 197, 94] }, // Green
      styles: { fontSize: 8 },
    });

    // 3. DOUBT LEDGER (With Total Count Top Right)
    doc.addPage();
    const doubtCount = activeTopics.filter(t => t.hasDoubt).length;
    doc.setFillColor(239, 68, 68); // Red
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("II. PRIORITY DOUBTS", 14, 13);
    doc.setFontSize(10);
    doc.text(`TOTAL ACTIVE DOUBTS: ${doubtCount}`, 150, 13);

    const doubtRows = activeTopics
      .filter(t => t.hasDoubt)
      .map(t => [t.subject, t.path?.[0] || 'General', t.leafName || t.topicName.split(' > ').pop() || '']);

    autoTable(doc, {
      startY: 30,
      head: [['Subject', 'Chapter', 'Specific Sub-Topic']],
      body: doubtRows,
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 8 },
    });

    // 4. REMAINING TOPICS
    doc.addPage();
    doc.setFillColor(100, 116, 139); // Slate
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("III. REMAINING SYLLABUS", 14, 13);

    const remainingRows = activeTopics
      .filter(t => t.status === 'not_started')
      .map(t => [t.subject, t.path?.[0] || 'General', t.leafName || t.topicName.split(' > ').pop() || '']);

    autoTable(doc, {
      startY: 30,
      head: [['Subject', 'Chapter', 'Pending Topic']],
      body: remainingRows,
      headStyles: { fillColor: [100, 116, 139] },
      styles: { fontSize: 8 },
    });

    doc.save(`${studentName}_Full_Progress_Report.pdf`);
  };

  if (isLoading) return <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 h-full flex items-center justify-center text-gray-400 font-display"><div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mr-3"></div> Loading data...</div>;

  // 🚨 TEACHER INSIGHTS VIEW
  if (safeRole === 'teacher' && !selectedStudentUsername) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h3 className="font-display text-lg text-gray-800 flex items-center gap-2"><Zap className="text-brand-orange animate-pulse" size={20} /> Class Insights: Common Doubts</h3>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {commonDoubts.length === 0 ? <div className="flex flex-col items-center justify-center py-20 opacity-40"><CheckCircle size={48} className="text-green-500 mb-4" /><p className="text-gray-500 font-bold">No active doubts in the class!</p></div> : commonDoubts.map((doubt, idx) => (
            <div key={idx} className="p-4 bg-red-50/50 border border-red-100 rounded-xl flex justify-between items-center transition-all hover:bg-red-50">
              <div><h4 className="font-bold text-gray-800 text-sm">{doubt.name}</h4><div className="flex items-center gap-2 mt-1"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{doubt.subject}</p><span className="text-[10px] text-red-400 italic">Last active: {formatTimeAgo(doubt.lastUpdated || undefined) || "Recently"}</span></div></div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-red-100 shadow-sm ml-4"><User size={14} className="text-red-500" /><span className="font-bold text-red-600">{doubt.count}</span></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 🚨 INDIVIDUAL TRACKER VIEW
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 h-full flex flex-col overflow-hidden">
      
      {/* JOURNEY HEADER */}
      <div className="mb-6 p-6 bg-slate-50 border border-slate-100 rounded-[32px] relative overflow-hidden group flex-shrink-0">
        <Zap className="absolute -right-4 -top-4 text-brand-orange opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-700" size={120} />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div><h3 className="font-display text-2xl font-black text-gray-900 flex items-center gap-2 mb-1"><TrendingUp className="text-brand-blue" size={24} />{safeRole === 'teacher' ? `${teacherStudents.find(s => s.username === selectedStudentUsername)?.name?.split(' ')[0]}'s Syllabus` : 'Your Journey Progress'}</h3><div className="flex items-center gap-3 text-sm font-medium text-gray-500"><span>{overallStats.completed} / {overallStats.total} Topics Done</span>{overallStats.lastActivity && <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-gray-100 flex items-center gap-1"><Clock size={10}/> {formatTimeAgo(overallStats.lastActivity)}</span>}</div></div>
          <div className="text-right"><span className="text-5xl font-black text-brand-blue tabular-nums">{overallStats.percentage}%</span></div>
        </div>
        <ProgressBar percent={overallStats.percentage} colorClass={overallStats.percentage === 100 ? "bg-green-500" : "bg-brand-blue"} />
      </div>

      {/* CONTROLS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Search topics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-blue transition" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X size={16}/></button>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generatePDF} className="p-2 px-3 bg-brand-orange text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition shadow-md flex items-center gap-1.5"><Download size={14}/> Report</button>
          <button onClick={handleExpandAll} className="p-2 px-3 bg-blue-50 text-brand-blue rounded-xl text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1.5"><Maximize2 size={14}/> Expand All</button>
          <button onClick={handleCollapseAll} className="p-2 px-3 bg-gray-50 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-100 transition flex items-center gap-1.5"><Minimize2 size={14}/> Reset</button>
          <div className="w-px h-6 bg-gray-100 mx-1" />
          <button onClick={() => setFilter(prev => prev === 'all' ? 'doubts' : 'all')} className={`p-2 px-4 rounded-xl transition flex items-center gap-2 text-xs font-bold ${filter === 'doubts' ? 'bg-red-50 text-red-500 shadow-sm' : 'bg-slate-900 text-white'}`}><Filter size={14}/> {filter === 'doubts' ? 'Doubts' : 'All'}</button>
        </div>
      </div>

      {/* SYLLABUS TREE */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar dashboard-content-scroll">
        {Object.entries(groupedTopics).map(([subject, subjectTopics]) => {
          const root: FolderNode = { name: 'root', pathId: `root-${subject}`, subFolders: {}, topics: [] };
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

          const subjectPercentage = Math.round((subjectTopics.filter(t => t.status.includes('completed')).length / subjectTopics.length) * 100);
          const isSubjectCompleted = subjectPercentage === 100;
          const hasSubjectDoubt = subjectTopics.some(t => t.hasDoubt);

          const renderFolder = (node: FolderNode, depth: number) => {
              return (
                  <div key={node.pathId} className="w-full">
                      {Object.values(node.subFolders).map(subFolder => {
                          const folderTopics = getAllTopicsFromNode(subFolder);
                          const isFolderCompleted = folderTopics.length > 0 && folderTopics.every(t => t.status.includes('completed'));
                          const hasFolderDoubt = folderTopics.some(t => t.hasDoubt);

                          return (
                              <div key={subFolder.pathId} className="w-full flex flex-col">
                                  <div style={{ paddingLeft: `${(depth * 1.5) + 1}rem` }} className="p-3 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-100 bg-white group">
                                      <button disabled={readOnly || safeRole === 'teacher'} onClick={() => handleBulkUpdate(folderTopics, { status: isFolderCompleted ? 'not_started' : 'completed' })} className="mt-0.5 flex-shrink-0 cursor-pointer hover:scale-110 transition disabled:cursor-default">{isFolderCompleted ? <CheckCircle className="text-green-500" size={18} /> : <Circle className="text-gray-300" size={18} />}</button>
                                      <div className="flex-1 flex items-center justify-between min-w-0">
                                        <button onClick={() => toggleFolder(subFolder.pathId)} className={`flex items-center gap-2 text-sm font-bold text-left transition mt-0.5 truncate ${isFolderCompleted ? 'text-gray-400 line-through' : 'text-gray-700 hover:text-brand-blue'}`}>{expandedFolders.includes(subFolder.pathId) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}{subFolder.name}<span className="text-[10px] text-gray-500 font-normal bg-gray-100 px-1.5 py-0.5 rounded ml-1 no-underline">{folderTopics.filter(t => t.status.includes('completed')).length}/{folderTopics.length}</span></button>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mr-2">
                                          <button onClick={(e) => { e.stopPropagation(); setExpandedFolders(prev => Array.from(new Set([...prev, ...getAllFolderIds(subFolder)]))); }} className="p-1 text-brand-blue hover:bg-blue-50 rounded" title="Expand"><Maximize2 size={12}/></button>
                                          <button onClick={(e) => { e.stopPropagation(); const ids = getAllFolderIds(subFolder); setExpandedFolders(prev => prev.filter(id => !ids.includes(id))); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Collapse"><Minimize2 size={12}/></button>
                                        </div>
                                      </div>
                                      <button disabled={readOnly || safeRole === 'teacher'} onClick={() => handleBulkUpdate(folderTopics, { hasDoubt: !hasFolderDoubt })} className={`p-1.5 rounded-lg transition ${hasFolderDoubt ? 'bg-red-100 text-red-500' : 'text-gray-200 hover:text-red-400'} disabled:cursor-default`}><AlertCircle size={16} /></button>
                                  </div>
                                  {expandedFolders.includes(subFolder.pathId) && <div className="w-full animate-in fade-in duration-300">{renderFolder(subFolder, depth + 1)}</div>}
                              </div>
                          );
                      })}
                      {node.topics.map(topic => {
                          const topicId = topic.id || (topic as any)._id;
                          const isCompleted = topic.status.includes('completed');
                          return (
                              <div key={topicId} style={{ paddingLeft: `${(depth * 1.5) + 2.5}rem` }} className="p-3 flex items-start gap-3 hover:bg-gray-50 transition border-b border-gray-100 bg-white group">
                                  <button disabled={readOnly || safeRole === 'teacher'} onClick={() => handleUpdateTopic(topicId, { status: isCompleted ? 'not_started' : 'completed' })} className="mt-0.5 flex-shrink-0 cursor-pointer hover:scale-110 transition disabled:cursor-default">{isCompleted ? <CheckCircle className="text-green-500" size={18} /> : <Circle className="text-gray-300" size={18} />}</button>
                                  <div className="flex-1"><p className={`text-sm font-medium leading-tight mt-0.5 ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{topic.leafName || topic.topicName.split(' > ').pop()}</p></div>
                                  <button disabled={readOnly || safeRole === 'teacher'} onClick={() => handleUpdateTopic(topicId, { hasDoubt: !topic.hasDoubt })} className={`p-1.5 rounded-lg transition ${topic.hasDoubt ? 'bg-red-100 text-red-500' : 'text-gray-200 hover:text-red-400'} disabled:cursor-default`}><AlertCircle size={16} /></button>
                              </div>
                          );
                      })}
                  </div>
              );
          };

          return (
              <div key={subject} className="border border-gray-200 rounded-2xl overflow-hidden bg-white mb-4 group/subject transition-all hover:border-brand-blue/30">
                  <div className="w-full p-4 bg-slate-50 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button disabled={readOnly || safeRole === 'teacher'} onClick={() => handleBulkUpdate(subjectTopics, { status: isSubjectCompleted ? 'not_started' : 'completed' })} className="mt-0.5 flex-shrink-0 cursor-pointer hover:scale-110 transition disabled:cursor-default">{isSubjectCompleted ? <CheckCircle className="text-green-500" size={20} /> : <Circle className="text-gray-300" size={20} />}</button>
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleSubject(subject)} className={`font-bold text-base transition ${isSubjectCompleted ? 'text-gray-400 line-through' : 'text-gray-800 hover:text-brand-blue'}`}>{subject}</button>
                            {expandedSubjects.includes(subject) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            <div className="opacity-0 group-hover/subject:opacity-100 transition-opacity flex items-center gap-1 ml-2">
                              <button onClick={(e) => { e.stopPropagation(); setExpandedSubjects(prev => Array.from(new Set([...prev, subject]))); const ids: string[] = []; Object.values(root.subFolders).forEach(n => ids.push(...getAllFolderIds(n))); setExpandedFolders(prev => Array.from(new Set([...prev, ...ids]))); }} className="p-1 text-brand-blue hover:bg-blue-100 rounded"><Maximize2 size={14}/></button>
                              <button onClick={(e) => { e.stopPropagation(); setExpandedSubjects(prev => prev.filter(s => s !== subject)); const ids = []; Object.values(root.subFolders).forEach(n => ids.push(...getAllFolderIds(n))); setExpandedFolders(prev => prev.filter(id => !ids.includes(id))); }} className="p-1 text-gray-400 hover:bg-gray-200 rounded"><Minimize2 size={14}/></button>
                            </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <span className={`text-xs font-black px-2 py-1 rounded-md border shadow-sm ${isSubjectCompleted ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-gray-200 text-brand-blue'}`}>{subjectPercentage}%</span>
                          <button disabled={readOnly || safeRole === 'teacher'} onClick={() => handleBulkUpdate(subjectTopics, { hasDoubt: !hasSubjectDoubt })} className={`p-1.5 rounded-lg transition ${hasSubjectDoubt ? 'bg-red-100 text-red-500' : 'text-gray-200 hover:text-red-400'} disabled:cursor-default`}><AlertCircle size={18} /></button>
                      </div>
                    </div>
                    <ProgressBar percent={subjectPercentage} colorClass={isSubjectCompleted ? "bg-green-500" : "bg-brand-blue"} />
                  </div>
                  {expandedSubjects.includes(subject) && <div className="w-full animate-in slide-in-from-top-2 duration-300">{renderFolder(root, 0)}</div>}
              </div>
          );
        })}
      </div>
    </div>
  );
};

export default SyllabusTracker;