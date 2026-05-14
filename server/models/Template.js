const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    displayName: { type: String, required: true }, // e.g., "Welcome Poster" (Editable by you)
    metaName: { type: String, required: true, unique: true }, // e.g., "welcome_msg_01" (From Meta)
    language: { type: String, default: "en" },
    metaStatus: { type: String, default: "APPROVED" }, // Matches Meta's status
    
    // Asset Management
    requiresImage: { type: Boolean, default: false }, // Did Meta say this has an image header?
    headerImageUrl: { type: String, default: "" },    // Your Cloudinary URL
    
    // UI Control
    isConfigured: { type: Boolean, default: false },  // 🔥 Will hide it from Chat UI until true!
    buttonColor: { type: String, default: "blue" },
    variableCount: { type: Number, default: 0 },
    isFlow: { type: Boolean, default: false },

    isVisible: { type: Boolean, default: true }, // For the toggle
    sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);