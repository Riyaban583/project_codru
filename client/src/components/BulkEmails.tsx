import React, { useState } from 'react';
import { CloudDownload, Send, Loader2 } from 'lucide-react';

// 1. Your Interface
export interface TrackerNode {
  _id: string;
  schoolName: string;
  emailIds: string[];      
  contactNumbers: string[]; 
  designationOfAddressee: string;
  nameOfAddresse: string;
}

const BulkEmails = ({ userData }: { userData: any }) => {
  const [csvParsedData, setCsvParsedData] = useState<any[]>([]);
  
  // 🚨 NEW STATES: To handle the loading spinner and success/error messages
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [progress, setProgress] = useState(0);
  const [currentSchool, setCurrentSchool] = useState("");

  // 2. Excel Parsing Logic
  const processSpreadsheetData = async (file: File | Blob, fileName: string) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const XLSX = await import('xlsx');
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      
      const allParsedSheets: { sheetName: string; data: TrackerNode[] }[] = [];

      for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          const sheetData: TrackerNode[] = [];

          for (let i = 1; i < rows.length; i++) {
            const cols = rows[i];
            
            if (!cols || cols.length === 0 || !cols[0]) continue;

            const rawEmails = cols[2]?.toString() || "";
            const parsedEmails = rawEmails.split(/[,;\s]+/).map(email => email.trim()).filter(email => email !== "");

            const rawContacts = cols[3]?.toString() || "";
            const parsedContacts = rawContacts.split(/[,;\s]+/).map(num => num.trim()).filter(num => num !== "");

            const node: TrackerNode = {
              _id: crypto.randomUUID(), 
              schoolName: cols[1]?.toString().trim() || "Unknown",
              emailIds: parsedEmails,
              contactNumbers: parsedContacts,
              designationOfAddressee: cols[4]?.toString().trim() || "", 
              nameOfAddresse: cols[5]?.toString().trim() || "",
            };

            // Only add rows that actually have an email address
            if (parsedEmails.length > 0) {
              sheetData.push(node);
            }
          }
          
          if (sheetData.length > 0) {
              allParsedSheets.push({ sheetName: sheetName, data: sheetData });
          }
      }

      setCsvParsedData(allParsedSheets);
      setStatusMessage(""); // Reset any previous messages
    };
    
    reader.readAsArrayBuffer(file);
  };

  // 3. File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSpreadsheetData(file, file.name);
    e.target.value = ''; // Reset input
  };

  // 🚨 4. NEW: POST DATA TO BACKEND
  const sendDataToBackend = async () => {
    setIsSending(true);
    setStatusMessage("Starting the campaign...");
    setProgress(0);

    try {
      const allRecipients = csvParsedData.flatMap(sheet => sheet.data);
      const token = localStorage.getItem("jwtoken");
      
      // 1. Make the POST request
      const response = await fetch(`${import.meta.env.VITE_API}send-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ recipientsData: allRecipients })
      });

      // 2. Read the stream instead of a single JSON response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) throw new Error("Stream not supported by browser.");

      // Loop continuously as data chunks arrive from Render
      while (true) {
        const { done, value } = await reader.read();
        if (done) break; // Loop is finished!

        // Decode the raw bytes into text
        const chunkText = decoder.decode(value, { stream: true });
        
        // A chunk might contain multiple "data: {...}\n\n" strings, so we split them
        const messages = chunkText.split("\n\n").filter(Boolean);

        for (const message of messages) {
          if (message.startsWith("data: ")) {
            const parsedData = JSON.parse(message.replace("data: ", ""));

            if (parsedData.complete) {
              setStatusMessage("✅ Campaign complete!");
              setTimeout(() => {
                setCsvParsedData([]);
                setProgress(0);
              }, 3000);
              return;
            }

            // 3. Update the UI States in real-time!
            const percentage = Math.round((parsedData.current / parsedData.total) * 100);
            setProgress(percentage);
            setCurrentSchool(`Sent to: ${parsedData.lastSchool}`);
          }
        }
      }

    } catch (error: any) {
      console.error("Error sending data:", error);
      setStatusMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Calculate total recipients to show on the UI
  // Calculate total schools (rows)
  const totalSchools = csvParsedData.reduce((acc, sheet) => acc + sheet.data.length, 0);
  
  // Calculate total individual email addresses across all schools
  const totalEmails = csvParsedData.reduce((acc, sheet) => {
    return acc + sheet.data.reduce((emailCount, node) => emailCount + node.emailIds.length, 0);
  }, 0);

  // 5. The UI Render
  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[60vh] p-8">
      
      {/* Hidden Input */}
      <input
        type="file"
        id="excelUpload"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Conditional UI: If NO data is parsed, show IMPORT. If data IS parsed, show SEND. */}
      {csvParsedData.length === 0 ? (
        
        <button
          onClick={() => document.getElementById('excelUpload')?.click()}
          className="flex flex-col items-center group transition-all duration-200 active:scale-95"
        >
          <div className="w-32 h-32 bg-[#F2FCF5] rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-50 group-hover:shadow-md group-hover:bg-green-50 transition-all">
            <CloudDownload size={56} className="text-[#34A853]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[26px] font-bold text-slate-900 tracking-tight">
            Import from Spreadsheet
          </h2>
        </button>

      ) : (

        <div className="flex flex-col items-center text-center bg-white p-8 rounded-2xl shadow-lg border border-slate-100 max-w-sm w-full">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to Send</h2>
          <p className="text-slate-500 mb-6">
            Found <strong>{totalSchools}</strong> recipients with a total of <strong>{totalEmails}</strong> email addresses.
          </p>
          {/* --- PROGRESS BAR UI --- */}
          {isSending && (
            <div className="w-full mt-4 mb-6">
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                <span>{currentSchool || "Initializing..."}</span>
                <span>{progress}%</span>
              </div>
              
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-[#34A853] h-3 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <button
            onClick={sendDataToBackend}
            disabled={isSending}
            className={`w-full py-3.5 rounded-xl font-bold text-white transition flex justify-center items-center gap-2 ${
              isSending ? "bg-slate-300 cursor-not-allowed" : "bg-brand-orange hover:bg-orange-600 active:scale-95 shadow-md shadow-orange-500/20"
            }`}
          >
            {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            {isSending ? "Processing..." : "Send Emails Now"}
          </button>

          {/* Show Success/Error Messages */}
          {statusMessage && (
            <p className={`mt-4 text-sm font-semibold ${statusMessage.includes('❌') ? 'text-red-500' : 'text-green-600'}`}>
              {statusMessage}
            </p>
          )}

          {/* Reset Button */}
          {!isSending && (
            <button 
              onClick={() => setCsvParsedData([])}
              className="mt-6 text-sm text-slate-400 hover:text-slate-700 underline underline-offset-2"
            >
              Cancel and upload different file
            </button>
          )}
        </div>

      )}

    </div>
  );
};

export default BulkEmails;