import { useState, useEffect } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridColDef,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import {
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
} from "@mui/icons-material";
import { Dialog, DialogContent, IconButton, Tooltip, CircularProgress } from "@mui/material";
import { MuiOtpInput } from "mui-one-time-password-input";

// Components
import Muialert from "./Muialert";

function matchIsString(text: unknown): text is string {
  return typeof text === "string";
}

function matchIsNumeric(text: unknown) {
  const isNumber = typeof text === "number";
  const isString = matchIsString(text);
  return (isNumber || (isString && text !== "")) && !isNaN(Number(text));
}

const validateChar = (value: string) => {
  return matchIsNumeric(value);
};

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // OTP Dialog State
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState({ otp: "" });
  const [currentUsername, setCurrentUsername] = useState("");
  
  // Alert State
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<"success" | "error" | "info" | "warning">("info");
  const [showAlert, setShowAlert] = useState(false);
  const [waitingAlert, setWaitingAlert] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API}users`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();

        const mappedData = data.map((user: any, index: number) => ({
          id: index, // DataGrid requires a unique 'id' prop
          ...user,
        }));

        setUsers(mappedData);
      } catch (error) {
        console.error("Error fetching users:", error);
        setAlertSeverity("error");
        setAlertMessage("Failed to load users.");
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id: number, username: string, role: string) => {
    const confirmDelete = window.confirm(`Remove "${username}" from the organization?`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API}user/${username}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      
      if (!response.ok) throw new Error("Network response was not ok");
      
      setUsers(users.filter((user) => user.id !== id));
      setAlertSeverity("success");
      setAlertMessage("User deleted successfully.");
      setShowAlert(true);
    } catch (error) {
      setAlertSeverity("error");
      setAlertMessage("Failed to delete user.");
      setShowAlert(true);
    }
  };

  const handleAssignTask = (username: string) => {
    navigate(`/add-task/${username}`);
  };

  const handleBro = async (username: string, isAdmin: boolean) => {
    try {
      setWaitingAlert(true);
      const response = await fetch(`${import.meta.env.VITE_API}generate-otp-bro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, isAdmin }),
      });
      setWaitingAlert(false);

      if (response.ok) {
        setCurrentUsername(username);
        setValue({ otp: "" });
        setOpen(true);
      } else {
        throw new Error("Failed to generate OTP");
      }
    } catch (error) {
      setWaitingAlert(false);
      setAlertSeverity("error");
      setAlertMessage("Error occurred while generating OTP");
      setShowAlert(true);
    }
  };

  const handleOtpVerification = async (username: string, finalValue: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API}verify-bigbro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, otp: finalValue }),
      });

      const jsonresponse = await res.json();

      if (res.ok) {
        setOpen(false);
        setAlertSeverity("success");
        setAlertMessage(jsonresponse.message);
        setShowAlert(true);
        // Better UX: Instead of reloading the page, update the state directly if possible, 
        // but reloading is a safe fallback for admin state changes.
        setTimeout(() => window.location.reload(), 1500); 
      } else {
        setAlertSeverity("error");
        setAlertMessage(jsonresponse.error);
        setShowAlert(true);
      }
    } catch (err) {
      setAlertSeverity("error");
      setAlertMessage("OTP Verification Failed");
      setShowAlert(true);
    }
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 150 },
    { field: "username", headerName: "Username", flex: 1, minWidth: 150 },
    { field: "email", headerName: "Email", flex: 1.5, minWidth: 200 },
    { field: "phone", headerName: "Phone", flex: 1, minWidth: 120 },
    { 
      field: "role", 
      headerName: "Role", 
      flex: 1, 
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          params.value === 'Student' ? 'bg-blue-100 text-blue-800' : 
          params.value === 'Teacher' ? 'bg-orange-100 text-orange-800' : 
          'bg-gray-100 text-gray-800'
        }`}>
          {params.value}
        </span>
      )
    },
    { 
      field: "isAdmin", 
      headerName: "Admin Status", 
      flex: 1, 
      minWidth: 130,
      renderCell: (params: GridRenderCellParams) => (
        <span className={`font-bold ${params.value ? 'text-green-600' : 'text-gray-400'}`}>
          {params.value ? "Admin" : "Standard"}
        </span>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.5,
      minWidth: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <div className="flex items-center gap-2 h-full">
          {params.row.role === "Student" && (
            <Tooltip title="Assign Task">
              <IconButton onClick={() => handleAssignTask(params.row.username)} size="small" sx={{ color: '#1765a4' }}>
                <AssignmentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {params.row.isAdmin ? (
            <Tooltip title="Revoke Admin Privileges">
              <IconButton onClick={() => handleBro(params.row.username, params.row.isAdmin)} size="small" color="warning">
                <RemoveCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Grant Admin Privileges">
              <IconButton onClick={() => handleBro(params.row.username, params.row.isAdmin)} size="small" color="success">
                <AddCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Delete User">
            <IconButton onClick={() => handleDelete(params.row.id, params.row.username, params.row.role)} size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  function CustomToolbar() {
    return (
      <GridToolbarContainer className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-xl font-display font-bold text-brand-blue">User Directory</h2>
        <GridToolbarQuickFilter 
          placeholder="Search users..." 
          variant="outlined"
          size="small"
          sx={{ 
            width: "300px", 
            backgroundColor: "white", 
            '& .MuiOutlinedInput-root': { borderRadius: '8px' } 
          }} 
        />
      </GridToolbarContainer>
    );
  }

  return (
    <div className="animate-fade-in-up h-[75vh] w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <DataGrid
        rows={users}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        slots={{
          toolbar: CustomToolbar,
          loadingOverlay: () => (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
              <CircularProgress sx={{ color: '#ed7f23' }} />
            </div>
          ),
        }}
        sx={{
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
            color: '#475569',
            fontFamily: '"Arimo", sans-serif',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #f1f5f9',
            fontFamily: '"Arimo", sans-serif',
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#f8fafc',
          },
        }}
      />

      {/* OTP Dialog for Admin Promotion */}
      <Dialog
        open={open}
        onClose={(e, reason) => { if (reason !== "backdropClick") setOpen(false); }}
        PaperProps={{
          style: { padding: "32px", borderRadius: "16px", textAlign: "center" },
        }}
      >
        <DialogContent>
          <h3 className="text-xl font-display font-bold text-brand-blue mb-2">Verify Admin Action</h3>
          <p className="text-sm text-gray-500 mb-6">Enter the 4-digit OTP sent to your email.</p>
          <MuiOtpInput
            length={4}
            autoFocus
            onComplete={(val) => handleOtpVerification(currentUsername, val)}
            value={value.otp}
            onChange={(otp) => setValue({ otp })}
            gap={2}
          />
        </DialogContent>
      </Dialog>

      {/* Unified Alerts */}
      {showAlert && <Muialert message={alertMessage} severity={alertSeverity} onClose={() => setShowAlert(false)} />}
      {waitingAlert && <Muialert message="Processing request... Please wait." severity="info" onClose={() => setWaitingAlert(false)} />}
    </div>
  );
}