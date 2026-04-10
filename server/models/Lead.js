const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    contactId: { type: String, required: false },
    phoneNumber: { type: String, required: true },
    description: { type: String, default: "" },
    name: { type: String },
    status: { 
        type: String, 
        enum: ['New', 'Contacted', 'Trial Scheduled', 'Converted', 'Lost'], 
        default: 'New' 
    },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // ✅ THIS IS AN ARRAY!
    notes: { type: String, default: "" },
    conversionValue: { type: Number, default: 0 } // For tracking revenue later!
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);