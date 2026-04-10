const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dueDate: { type: Date },
    priority: { 
        type: String, 
        enum: ['High', 'Medium', 'Low'], 
        default: 'Medium' 
    },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    isCalendarSynced: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);