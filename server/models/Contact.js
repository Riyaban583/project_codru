const mongoose = require('mongoose');

// 🚨 This line forces Mongoose to forget the old "broken" schema
// if (mongoose.models.Contact) {
//     delete mongoose.models.Contact;
// }

const contactSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true, },
    name: { type: String, default: "New Student" },
    lastMessage: { type: String },
    lastSeen: { type: Date, default: Date.now },
    isArchived: { type: Boolean, default: false },
    unreadCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.models.Contact || mongoose.model('Contact', contactSchema);