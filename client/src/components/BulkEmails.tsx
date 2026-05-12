import React, { useState } from 'react';
import { CloudDownload } from 'lucide-react';

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
  // 🚨 THIS IS THE FIX: You must define csvParsedData here so React knows it exists!
  const [csvParsedData, setCsvParsedData] = useState<any[]>([]);

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
            const parsedEmails = rawEmails.split(/[,;]/).map(email => email.trim()).filter(email => email !== "");

            const rawContacts = cols[3]?.toString() || "";
            const parsedContacts = rawContacts.split(/[,;]/).map(num => num.trim()).filter(num => num !== "");

            const node: TrackerNode = {
              _id: crypto.randomUUID(), 
              schoolName: cols[1]?.toString().trim() || "Unknown",
              emailIds: parsedEmails,
              contactNumbers: parsedContacts,
              designationOfAddressee: cols[4] || 0, 
              nameOfAddresse: cols[5] || 0,
            };

            sheetData.push(node);
          }
          
          if (sheetData.length > 0) {
              allParsedSheets.push({ sheetName: sheetName, data: sheetData });
          }
      }

      // This will now work because we defined it at the top!
      setCsvParsedData(allParsedSheets);
      console.log("Parsed Excel Data:", allParsedSheets);
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

  // 4. The UI Render
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

      {/* Import Button */}
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

      {/* Debug Terminal View */}
      {csvParsedData.length > 0 && (
        <div className="mt-12 w-full max-w-4xl bg-slate-900 rounded-xl shadow-xl overflow-hidden text-left">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Terminal Output (Parsed Data)</span>
            <span className="text-xs text-green-400 font-mono">{csvParsedData[0].data.length} rows found</span>
          </div>
          <div className="p-4 overflow-auto max-h-96 custom-scrollbar">
            <pre className="text-sm text-green-400 font-mono">
              {JSON.stringify(csvParsedData, null, 2)}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
};

export default BulkEmails;