const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    wa_id: { 
        type: String, 
        required: true, 
        unique: true 
    },
    senderName: { 
        type: String 
    },
    userNumber: { 
        type: String, 
        required: true 
    },
    botNumberId: { 
        type: String, 
        required: true 
    },
    messageBody: { 
        type: String 
    },
    messageType: { 
        type: String, 
        default: 'text' 
    },
    mediaUrl: { 
        type: String 
    },
    direction: { 
        type: String, 
        enum: ['incoming', 'outgoing'], 
        required: true 
    },
    
    status: { 
        type: String, 
        enum: ['received', 'sent', 'delivered', 'read', 'failed'], 
        default: 'sent' 
    },
    
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
    deliveredAt: { 
        type: Date 
    },
    readAt: { 
        type: Date 
    }

}, { timestamps: true });

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);