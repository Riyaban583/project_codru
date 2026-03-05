import React, { useState, useRef, useEffect } from "react";
import {
  TextField, Radio, RadioGroup, FormControlLabel, FormControl,
  FormLabel, Checkbox, Button, Avatar, IconButton, Alert, Snackbar
} from "@mui/material";
import { PhotoCamera, Save } from "@mui/icons-material";

const Profile = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 1. Centralized state for all form fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    photo: "",
    dob: "",
    gender: "male",
    phone: "",
    altPhone: "",
    address: "",
    classSemester: "",
    schoolCollege: "",
    subjects: ["", "", "", "", "", ""],
    fatherName: "",
    fatherOcc: "",
    motherName: "",
    motherOcc: "",
    declaration: false
  });

  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", severity: "success" as "success" | "error" });

  // 2. Fetch existing data when the component loads
  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem("jwtoken");
      if (!token) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_API}get-user-profile`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok) {
          // Merge existing DB data with our default state to prevent "undefined" errors
          setFormData(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };

    fetchProfileData();
  }, []);

  // 3. Handle standard input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 4. Handle changes specifically for the subjects array
  const handleSubjectChange = (index: number, value: string) => {
    const newSubjects = [...formData.subjects];
    newSubjects[index] = value;
    setFormData(prev => ({ ...prev, subjects: newSubjects }));
  };

  // Currently just handles local preview. You'd need a cloud storage solution (like Cloudinary/AWS) to save files permanently.
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, photo: imageUrl }));
    }
  };

  // 5. Save the updated profile back to the database
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtoken");

    try {
      const res = await fetch(`${import.meta.env.VITE_API}update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setAlertInfo({ show: true, message: "Profile saved successfully!", severity: "success" });
      } else {
        setAlertInfo({ show: true, message: "Failed to save profile.", severity: "error" });
      }
    } catch (error) {
      setAlertInfo({ show: true, message: "Network error occurred.", severity: "error" });
    }
  };

  const inputStyles = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

  return (
    <div className="animate-fade-in-up bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Header */}
      <div className="bg-brand-blue text-white p-8 text-center relative overflow-hidden">
        <h1 className="text-3xl font-display font-bold relative z-10">📚 CuTe Learning</h1>
        <p className="text-blue-100 font-body mt-2 relative z-10 italic">Learn how to learn.</p>
      </div>

      <div className="p-8 md:p-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-800">Admission Profile</h2>
            <p className="text-gray-500 text-sm mt-1">Please fill out all required fields.</p>
          </div>

          {/* Avatar Section */}
          <div className="mt-6 md:mt-0 flex flex-col items-center">
            <div className="relative">
              <Avatar src={formData.photo || ""} sx={{ width: 100, height: 100, border: '4px solid #f1f5f9' }} />
              <IconButton
                color="primary" component="label" onClick={() => fileInputRef.current?.click()}
                sx={{ position: 'absolute', bottom: -10, right: -10, backgroundColor: '#ed7f23', color: 'white', '&:hover': { backgroundColor: '#d9701a' } }}
              >
                <PhotoCamera fontSize="small" />
              </IconButton>
              <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-8">
          
          {/* Section 1: Personal Details */}
          <div>
            <h3 className="text-lg font-bold text-brand-blue mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField label="Full Name" name="name" value={formData.name} onChange={handleChange} variant="outlined" fullWidth required sx={inputStyles} />
              <TextField label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" variant="outlined" fullWidth required disabled sx={inputStyles} /> {/* Usually email is disabled if Google authenticated */}
              <TextField label="Date of Birth" name="dob" value={formData.dob} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} fullWidth sx={inputStyles} />
              
              <FormControl component="fieldset">
                <FormLabel component="legend" className="text-sm">Gender</FormLabel>
                <RadioGroup row name="gender" value={formData.gender} onChange={handleChange}>
                  <FormControlLabel value="male" control={<Radio sx={{ color: '#1765a4', '&.Mui-checked': { color: '#1765a4' } }} />} label="Male" />
                  <FormControlLabel value="female" control={<Radio sx={{ color: '#1765a4', '&.Mui-checked': { color: '#1765a4' } }} />} label="Female" />
                  <FormControlLabel value="other" control={<Radio sx={{ color: '#1765a4', '&.Mui-checked': { color: '#1765a4' } }} />} label="Other" />
                </RadioGroup>
              </FormControl>

              <TextField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} variant="outlined" fullWidth sx={inputStyles} />
              <TextField label="Alt Phone Number" name="altPhone" value={formData.altPhone} onChange={handleChange} variant="outlined" fullWidth sx={inputStyles} />
              <div className="md:col-span-2">
                <TextField label="Permanent Address" name="address" value={formData.address} onChange={handleChange} variant="outlined" multiline rows={3} fullWidth sx={inputStyles} />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Details */}
          <div>
            <h3 className="text-lg font-bold text-brand-blue mb-4">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField label="Class / Semester" name="classSemester" value={formData.classSemester} onChange={handleChange} variant="outlined" fullWidth sx={inputStyles} />
              <TextField label="School / College" name="schoolCollege" value={formData.schoolCollege} onChange={handleChange} variant="outlined" fullWidth sx={inputStyles} />
              
              <div className="md:col-span-2">
                <FormLabel component="legend" className="text-sm mb-3">Chosen Subjects</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.subjects.map((subject, index) => (
                    <TextField 
                      key={index} 
                      value={subject}
                      onChange={(e) => handleSubjectChange(index, e.target.value)}
                      placeholder={`Subject ${index + 1}`} 
                      variant="outlined" 
                      size="small" 
                      fullWidth 
                      sx={inputStyles} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Guardian Details */}
          <div>
            <h3 className="text-lg font-bold text-brand-blue mb-4">Guardian Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleChange} variant="outlined" fullWidth sx={inputStyles} />
              <TextField label="Father's Occupation" name="fatherOcc" value={formData.fatherOcc} onChange={handleChange} variant="outlined" fullWidth sx={inputStyles} />
              <TextField label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleChange} variant="outlined" fullWidth sx={inputStyles} />
              <TextField label="Mother's Occupation" name="motherOcc" value={formData.motherOcc} onChange={handleChange} variant="outlined" fullWidth sx={inputStyles} />
            </div>
          </div>

          {/* Declaration Section */}
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 mt-8">
            <h3 className="text-lg font-bold text-brand-orange mb-2">Declaration</h3>
            <FormControlLabel
              control={
                <Checkbox 
                  required 
                  name="declaration"
                  checked={formData.declaration || false} 
                  // Checkboxes use 'e.target.checked' instead of 'e.target.value'
                  onChange={(e) => setFormData(prev => ({ ...prev, declaration: e.target.checked }))}
                  sx={{ color: '#ed7f23', '&.Mui-checked': { color: '#ed7f23' } }} 
                />
              }
              label={<span className="text-sm text-gray-700">I hereby declare that I will obey all rules...</span>}
            />
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-4">
            <Button type="submit" variant="contained" startIcon={<Save />} sx={{ backgroundColor: '#1765a4', padding: '12px 32px', borderRadius: '12px', fontWeight: 'bold', textTransform: 'none', fontSize: '1.1rem', '&:hover': { backgroundColor: '#124d7d' } }}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>

      {/* Snackbar for Success/Error Alerts */}
      <Snackbar open={alertInfo.show} autoHideDuration={6000} onClose={() => setAlertInfo({ ...alertInfo, show: false })}>
        <Alert severity={alertInfo.severity} sx={{ width: '100%' }}>
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Profile;