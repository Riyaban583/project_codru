const mongoose = require('mongoose');

// 🚨 This line forces Mongoose to forget the old "broken" schema
// if (mongoose.models.Contact) {
//     delete mongoose.models.Contact;
// }

const platformAuditSchema = new mongoose.Schema({
    contactPhone: { type: String, required: true, },
    schoolName: { type: String,required: true,},
    contactName: { type: String, required: true,},
    studentCount: { type: String, required: true,},

}, { timestamps: true });

module.exports = mongoose.models.platformAudit || mongoose.model('platformAudit', platformAuditSchema);