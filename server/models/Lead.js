const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
    phoneNumber: { type: String, required: true },
    name: { type: String },
    status: { 
        type: String, 
        enum: ['New', 'Contacted', 'Trial Scheduled', 'Converted', 'Lost'], 
        default: 'New' 
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Linked to your Staff
    notes: { type: String, default: "" },
    conversionValue: { type: Number, default: 0 } // For tracking revenue later!
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);