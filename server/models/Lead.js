const mongoose = require('mongoose');
const leadSchema = new mongoose.Schema({
    name: String,
    phoneNumber: { type: String, unique: true },
    source: { type: String, default: 'WhatsApp' },
    status: { 
        type: String, 
        enum: ['New', 'Contacted', 'Trial Scheduled', 'Converted', 'Lost'], 
        default: 'New' 
    },
    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: [String],
    conversionDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);