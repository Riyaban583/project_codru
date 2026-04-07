const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    dueDate: Date,
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    addedToCalendar: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);