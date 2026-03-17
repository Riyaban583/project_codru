import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DataGrid, GridColDef, GridToolbarContainer, GridToolbarQuickFilter } from "@mui/x-data-grid";
import { RocketLaunch, ArrowBack, Edit, Delete } from "@mui/icons-material";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";

interface ProblemRecord {
  _id: string;
  week: number;
  question: string;
  answer: string;
  link: string;
}

const UpdateReport = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  // Top Form State
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [link, setLink] = useState("");
  
  // Table & Auto-calculate State
  const [history, setHistory] = useState<ProblemRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [nextProblemNo, setNextProblemNo] = useState(1);
  
  // UI Feedback State
  const [status, setStatus] = useState<{ type: string; message: string }>({ type: "", message: "" });

  // --- NEW: Modal States ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProblemRecord | null>(null);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const token = localStorage.getItem("jwtoken"); 

      const response = await fetch(`${import.meta.env.VITE_API}user-report/${username}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        cache: "no-store"
      });
      
      if (!response.ok) throw new Error("Failed to load history");
      const data = await response.json();
      
      const existingTasks: ProblemRecord[] = data.tasks || [];
      setHistory(existingTasks); 
      
      if (existingTasks.length > 0) {
        const highestNum = Math.max(...existingTasks.map(t => t.week || 0));
        setNextProblemNo(highestNum + 1);
      } else {
        setNextProblemNo(1);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [username]);

  // Handle Main Form Submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "loading", message: "Updating Planetary Path..." });

    try {
      const response = await fetch(`${import.meta.env.VITE_API}update-report/${username}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("jwtoken")}`
        },
        body: JSON.stringify({ week: nextProblemNo, question, answer, link }),
      });

      if (!response.ok) throw new Error("Failed to update report");

      setStatus({ type: "success", message: "Report updated successfully! 🚀" });
      setQuestion(""); setAnswer(""); setLink("");
      fetchHistory();
      setTimeout(() => setStatus({ type: "", message: "" }), 3000);
    } catch (error: any) {
      setStatus({ type: "error", message: error.message || "An error occurred" });
    }
  };

  // --- NEW: Handle Edit ---
  const handleEditSubmit = async () => {
    if (!selectedRecord) return;
    setStatus({ type: "loading", message: "Saving changes..." });
    setEditModalOpen(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_API}edit-report-task/${username}/${selectedRecord._id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("jwtoken")}`
        },
        body: JSON.stringify(selectedRecord),
      });

      if (!response.ok) throw new Error("Failed to edit problem");
      setStatus({ type: "success", message: "Problem edited successfully!" });
      fetchHistory();
      setTimeout(() => setStatus({ type: "", message: "" }), 3000);
    } catch (error: any) {
      setStatus({ type: "error", message: error.message || "Failed to edit" });
    }
  };

  // --- UPDATED: Handle Delete (Triggers Re-indexing on Backend) ---
  const handleDeleteConfirm = async () => {
    if (!selectedRecord) return;
    setStatus({ type: "loading", message: "Deleting and re-indexing universe..." });

    try {
      const response = await fetch(`${import.meta.env.VITE_API}delete-report-task/${username}/${selectedRecord.week}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("jwtoken")}` },
      });

      if (!response.ok) throw new Error("Failed to delete problem");
      
      setStatus({ type: "success", message: "Problem deleted and path re-indexed! 🌌" });
      
      // 🚨 WAIT for the fresh data to be pulled from the database BEFORE closing the modal
      await fetchHistory(); 
      
      // Now close the modal, and the table will instantly update without a refresh!
      setDeleteModalOpen(false); 

      setTimeout(() => setStatus({ type: "", message: "" }), 3000);
    } catch (error: any) {
      setStatus({ type: "error", message: error.message || "Failed to delete" });
      setDeleteModalOpen(false);
    }
  };

  const columns: GridColDef[] = [
    { 
      field: "week", 
      headerName: "Prob #", 
      width: 80,
      renderCell: (params) => (
        <span className="font-black text-brand-blue bg-blue-50 px-2 py-1 rounded-md">
          {params.value}
        </span>
      )
    },
    { field: "question", headerName: "Problem Faced", flex: 1, minWidth: 200 },
    { field: "answer", headerName: "Solution Figured", flex: 1.5, minWidth: 300 },
    { 
      field: "link", 
      headerName: "Link", 
      flex: 0.5,
      renderCell: (params) => (
        params.value ? (
          <a href={params.value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold text-xs">
            View
          </a>
        ) : <span className="text-gray-400 text-xs">None</span>
      )
    },
    // --- NEW: Actions Column ---
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <div className="flex items-center gap-3 h-full">
          <button 
            onClick={() => { setSelectedRecord(params.row); setEditModalOpen(true); }}
            className="text-gray-400 hover:text-brand-blue transition"
            title="Edit Problem"
          >
            <Edit fontSize="small" />
          </button>
          <button 
            onClick={() => { setSelectedRecord(params.row); setDeleteModalOpen(true); }}
            className="text-gray-400 hover:text-red-500 transition"
            title="Delete Problem"
          >
            <Delete fontSize="small" />
          </button>
        </div>
      )
    }
  ];

  function CustomToolbar() {
    return (
      <GridToolbarContainer className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="px-4 text-lg font-bold text-gray-700">Evolution History</h2>
        <GridToolbarQuickFilter 
          placeholder="Search problems..." 
          size="small"
          sx={{ width: "250px", '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: 'white' } }} 
        />
      </GridToolbarContainer>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 animate-fade-in-up">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition">
            <ArrowBack sx={{ color: '#4b5563' }} />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold text-brand-blue">Update Report</h1>
            <p className="text-gray-500 text-sm mt-1">Charting the planetary path for <span className="font-bold text-brand-orange">@{username}</span></p>
          </div>
        </div>

        {/* TOP SECTION: The Compact Form */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 p-6 sm:p-8">
          {status.message && (
            <div className={`p-4 mb-6 rounded-xl font-bold text-sm ${status.type === "error" ? "bg-red-50 text-red-700" : status.type === "success" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* ... Existing Form Fields exactly as you had them ... */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Problem No.</label>
                <input type="text" className="w-full bg-gray-100 border border-gray-200 text-gray-700 rounded-xl px-4 py-3 font-black text-center" value={`# ${nextProblemNo}`} readOnly />
              </div>
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Problem Faced</label>
                <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue outline-none transition" value={question} onChange={(e) => setQuestion(e.target.value)} required />
              </div>
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reference Link</label>
                <input type="url" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue outline-none transition" value={link} onChange={(e) => setLink(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Solution Figured</label>
              <textarea className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue outline-none transition resize-none h-24" value={answer} onChange={(e) => setAnswer(e.target.value)} required ></textarea>
            </div>
            <div className="flex justify-end mt-2">
              <button type="submit" disabled={status.type === "loading"} className="bg-brand-blue text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-800 transition flex items-center gap-2 disabled:opacity-50" style={{ backgroundColor: '#1765a4' }}>
                <RocketLaunch fontSize="small" />
                {status.type === "loading" ? "Initializing..." : "Add to Path"}
              </button>
            </div>
          </form>
        </div>

        {/* BOTTOM SECTION: The DataGrid */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden h-[500px] flex flex-col">
          <DataGrid
            rows={history}
            columns={columns}
            getRowId={(row) => row._id || row.week} 
            loading={loadingHistory}
            disableRowSelectionOnClick
            slots={{ toolbar: CustomToolbar }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' },
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9' },
            }}
          />
        </div>
      </div>

      {/* --- NEW: EDIT MODAL --- */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1765a4' }}>Edit Problem #{selectedRecord?.week}</DialogTitle>
        <DialogContent dividers className="flex flex-col gap-4">
          <TextField 
            label="Problem Faced" 
            fullWidth 
            value={selectedRecord?.question || ""} 
            onChange={(e) => setSelectedRecord(prev => prev ? {...prev, question: e.target.value} : null)}
          />
          <TextField 
            label="Solution Figured" 
            fullWidth 
            multiline 
            rows={4}
            value={selectedRecord?.answer || ""} 
            onChange={(e) => setSelectedRecord(prev => prev ? {...prev, answer: e.target.value} : null)}
          />
          <TextField 
            label="Reference Link" 
            fullWidth 
            value={selectedRecord?.link || ""} 
            onChange={(e) => setSelectedRecord(prev => prev ? {...prev, link: e.target.value} : null)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditModalOpen(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" sx={{ bgcolor: '#1765a4', fontWeight: 'bold' }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* --- NEW: DELETE CONFIRMATION MODAL --- */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#dc2626' }}>Delete Problem #{selectedRecord?.week}?</DialogTitle>
        <DialogContent>
          <p className="text-gray-600">
            Are you sure you want to delete this planet from their path? <br/><br/>
            <strong>Note:</strong> All subsequent problems will automatically be shifted down by one number to maintain the path sequence.
          </p>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteModalOpen(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" sx={{ fontWeight: 'bold' }}>Delete & Re-index</Button>
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default UpdateReport;