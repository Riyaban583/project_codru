import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { socket } from '../socket';
import { Search, Send, Phone, User, Clock, AlertCircle, Loader2, Sparkles, ArrowLeft } from 'lucide-react';

export interface WhatsAppMessage {
    _id: string;
    wa_id: string;
    senderName: string;
    userNumber: string;
    messageBody: string;
    messageType: 'text' | 'template' | 'image' | 'document';
    direction: 'incoming' | 'outgoing';
    status: 'received' | 'sent' | 'read';
    timestamp: string;
    deliveredAt?: string;
    readAt?: string;
}

const cleanNum = (num: any) => String(num || "").replace(/\D/g, "");
const API_BASE = (import.meta.env.VITE_API || "http://localhost:8080").replace(/\/$/, "");

const WhatsAppChat: React.FC = () => {
    const [contacts, setContacts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedContactId, setSelectedContactId] = useState<string>("");
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [inputText, setInputText] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [isSendingTemplate, setIsSendingTemplate] = useState(false);

    // FIX 1: Auto-Scroll Function
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auto-scroll whenever messages array changes
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Derived values
    const activeContact = contacts.find(c => c._id === selectedContactId);
    const activeUserNumber = activeContact?.phoneNumber;

    // FIX 2: Move fetchContacts OUTSIDE so Socket can use it
    const fetchContacts = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/contacts`);
            setContacts(res.data);
            const isMobile = window.innerWidth < 768;
            if (res.data.length > 0 && !selectedContactId && !isMobile) {
                setSelectedContactId(res.data[0]._id);
            }
        } catch (err) {
            console.error("Error loading contacts:", err);
        }
    }, [selectedContactId]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    // 2. FETCH HISTORY
    useEffect(() => {
        const fetchChatHistory = async () => {
            if (!activeUserNumber) return;
            setIsLoading(true);
            try {
                const response = await axios.get<WhatsAppMessage[]>(`${API_BASE}/chats/${activeUserNumber}`);
                setMessages(response.data);
            } catch (error) {
                console.error("Failed to fetch chat history:", error);
                setMessages([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchChatHistory();
    }, [activeUserNumber]);

    // FIX 3: REFINED Socket Listener with Notifications
    useEffect(() => {
        const handleNewMessage = (newMsg: WhatsAppMessage) => {
            console.log("📥 Socket Event:", newMsg);

            const incomingNum = cleanNum(newMsg.userNumber);
            const currentActiveNum = cleanNum(activeUserNumber);

            // A. Update Chat History if active
            if (incomingNum === currentActiveNum) {
                setMessages((prev) => {
                    if (prev.some(m => m.wa_id === newMsg.wa_id || m._id === newMsg._id)) return prev;
                    return [...prev, newMsg];
                });
            }

            // B. Trigger System Notification (Like your notify.js)
            if (newMsg.direction === 'incoming' && document.hidden) {
                new Notification(`New message from ${newMsg.senderName}`, {
                    body: newMsg.messageBody,
                    icon: '/logo.png' // Replace with your path
                });
            }

            // C. Update Sidebar (Contacts List)
            setContacts((prevContacts) => {
                const contactExists = prevContacts.some(c => cleanNum(c.phoneNumber) === incomingNum);
                if (!contactExists) {
                    fetchContacts(); 
                    return prevContacts;
                }

                const updated = prevContacts.map((c) => {
                    if (cleanNum(c.phoneNumber) === incomingNum) {
                        return { 
                            ...c, 
                            lastMessage: newMsg.messageBody, 
                            lastSeen: new Date().toISOString() 
                        };
                    }
                    return c;
                });

                return [...updated].sort((a, b) => 
                    new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime()
                );
            });
        };

        socket.on("whatsapp_message_update", handleNewMessage);
        socket.on("whatsapp_status_update", (updatedMsg: WhatsAppMessage) => {
            console.log("🔄 Status Update Received:", updatedMsg.status);
            
            // This finds the exact bubble and injects the exact delivery/read times instantly
            setMessages((prev) => prev.map(m => 
                m.wa_id === updatedMsg.wa_id ? { ...m, ...updatedMsg } : m
            ));
        });
        return () => { 
            socket.off("whatsapp_message_update", handleNewMessage); 
            socket.off("whatsapp_status_update");
        };
    }, [activeUserNumber, fetchContacts]);

    // 4. Handle Send Message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeUserNumber || !inputText.trim()) return;

        const tempText = inputText;
        setInputText("");

        try {
            await axios.post(`${API_BASE}/send`, {
                to: activeUserNumber,
                messageBody: tempText
            });
            // We rely on the socket to update the UI for both incoming/outgoing
        } catch (error) {
            console.error("Failed to send message:", error);
            setInputText(tempText);
        }
    };

    const formatLastSeen = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        
        // If today: Show Time (10:30 AM)
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // If yesterday
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }
        
        // Older: Show Date (Mar 28)
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const handleSendTemplate = async (type: 'welcome' | 'website') => {
        if (!activeContact) return;
        setIsSendingTemplate(true);

        // Dynamic config based on which button is clicked
        const config = {
            welcome: {
                name: "welcome",
                image: "https://res.cloudinary.com/da6jhcsmm/image/upload/v1774657056/poster.curiousteamlearning.com__w1kypa.png",
                vars: [] // Add vars here if you ever add {{1}} to this template
            },
            website: {
                name: "website",
                image: "https://poster.curiousteamlearning.com/preview.jpg", // If website template has no image header
                vars: []
            }
        };

        const selected = config[type];

        try {
            await fetch(`${import.meta.env.VITE_API}send-template`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: activeContact.phoneNumber,
                    templateName: selected.name,
                    headerUrl: selected.image,
                    variables: selected.vars,
                    languageCode: "en" 
                })
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSendingTemplate(false);
        }
};

    return (
        <div className="flex h-full w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            
            {/* LEFT SIDEBAR */}
            <div className={`
                ${selectedContactId ? 'hidden' : 'flex'} 
                w-full md:w-80 md:flex bg-slate-50 border-r border-gray-100 flex-col flex-shrink-0
            `}>
                <div className="p-4 border-b border-gray-100 bg-white">
                    <h2 className="text-lg font-display font-bold text-brand-blue mb-3">Live Support</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search contacts..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm outline-none" 
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 gap-2 flex flex-col">
                    {contacts
                        .filter(c => 
                            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.phoneNumber?.includes(searchTerm)
                        )
                        .map((contact) => (
                            <button 
                                key={contact._id}
                                onClick={() => {
                                    setSelectedContactId(contact._id);
                                    // 🚨 RESET UNREAD UI: Clear the badge immediately on click
                                    setContacts(prev => prev.map(c => 
                                        c._id === contact._id ? { ...c, unreadCount: 0 } : c
                                    ));
                                    // Optional: Call backend to reset DB count
                                    axios.post(`${API_BASE}/contacts/reset-unread/${contact._id}`).catch(() => {});
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                                    selectedContactId === contact._id 
                                    ? 'bg-white border-brand-blue/20 shadow-sm' 
                                    : 'bg-transparent border-transparent hover:bg-slate-100'
                                }`}
                            >
                                {/* Profile Pic */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                                    selectedContactId === contact._id ? 'bg-brand-blue' : 'bg-slate-300'
                                }`}>
                                    {contact.name?.charAt(0) || "U"}
                                </div>
                                
                                {/* Name & Preview */}
                                <div className="flex-1 overflow-hidden text-left">
                                    <h4 className={`text-sm font-bold truncate ${selectedContactId === contact._id ? 'text-slate-800' : 'text-slate-600'}`}>
                                        {contact.name || "Unknown Student"}
                                    </h4>
                                    <p className="text-xs text-slate-400 truncate">
                                        {contact.lastMessage || "No messages yet"}
                                    </p>
                                </div>

                                {/* 🚨 TIME & UNREAD BADGE */}
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <div className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {formatLastSeen(contact.lastSeen || contact.updatedAt)}
                                    </div>
                                    {(contact.unreadCount || 0) > 0 && selectedContactId !== contact._id && (
                                        <div className="bg-brand-orange text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm">
                                            {contact.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                </div>
            </div>

            {/* RIGHT CHAT AREA */}
            <div className={`
                ${!selectedContactId ? 'hidden' : 'flex'} 
                flex-1 flex-col bg-white relative w-full md:flex
            `}>
                <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-3">

                        {/* 🚨 MOBILE BACK BUTTON - Only shows on small screens */}
                        <button 
                            onClick={() => setSelectedContactId("")}
                            className="md:hidden p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-full"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center shadow-md font-bold">
                            {activeContact?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 leading-tight">{activeContact?.name || "Select a Chat"}</h3>
                            <div className="flex items-center gap-1 text-xs text-brand-orange font-medium">
                                <Phone size={10} /> {activeUserNumber ? `+${activeUserNumber}` : "Invalid Contact Info"}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-50/50 dashboard-content-scroll">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full text-brand-blue animate-pulse font-bold">Connecting to Space...</div>
                    ) : !activeUserNumber ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-10">
                            <AlertCircle size={48} className="mb-4 text-rose-300" />
                            <p className="font-bold text-slate-600">This contact is missing a phone number.</p>
                            <p className="text-sm">We cannot send or receive messages for this record.</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Clock size={48} className="mb-4 opacity-20" />
                            <p>No messages yet. Say hello!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isOutgoing = msg.direction === 'outgoing';
                            const msgTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const dlvTime = msg.deliveredAt ? new Date(msg.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                            const readTime = msg.readAt ? new Date(msg.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

                            return (
                                <div key={msg._id} className={`flex w-full ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                                    
                                    {/* INCOMING MESSAGE (Clean & Simple) */}
                                    {!isOutgoing && (
                                        <div className="max-w-[70%] p-3.5 shadow-sm text-sm rounded-2xl bg-white text-slate-800 border border-gray-100 rounded-tl-sm">
                                            <p className="leading-relaxed">{msg.messageBody}</p>
                                            <p className="text-[10px] mt-1 text-slate-400 text-left">{msgTime}</p>
                                        </div>
                                    )}

                                    {/* OUTGOING MESSAGE (Redesigned with Status Timeline) */}
                                    {isOutgoing && (
                                        <div className="flex flex-col items-end max-w-[75%]">
                                            {/* The Bubble */}
                                            <div className="p-3.5 shadow-sm text-sm rounded-2xl bg-brand-blue text-white rounded-tr-sm w-full">
                                                <p className="leading-relaxed">{msg.messageBody}</p>
                                            </div>
                                            
                                            {/* The Custom Receipt Timeline (Tick-less) */}
                                            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-medium tracking-wide">
                                                <span className="text-slate-400">Sent {msgTime}</span>
                                                
                                                {dlvTime && (
                                                    <>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span className="text-slate-500">Dlv {dlvTime}</span>
                                                    </>
                                                )}
                                                
                                                {readTime && (
                                                    <>
                                                        <span className="w-1 h-1 bg-brand-orange rounded-full"></span>
                                                        <span className="text-brand-orange">Read {readTime}</span>
                                                    </>
                                                )}

                                                {/* Failsafe indicator if they blocked the bot */}
                                                {msg.status === 'failed' && (
                                                    <>
                                                        <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
                                                        <span className="text-rose-500">Failed</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                    {/* INTRO BUTTON */}
                    <button
                        onClick={() => handleSendTemplate('welcome')}
                        className="px-3 py-1.5 bg-blue-50 text-brand-blue rounded-lg text-xs font-bold border border-blue-100"
                    >
                        Send Intro
                    </button>

                    {/* WEBSITE BUTTON */}
                    <button
                        onClick={() => handleSendTemplate('website')}
                        className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold border border-green-100"
                    >
                        Send Website
                    </button>
                </div>

                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
                    <input 
                        type="text" 
                        value={inputText} 
                        onChange={(e) => setInputText(e.target.value)} 
                        placeholder={activeUserNumber ? "Type your message..." : "Select a valid contact to chat"}
                        disabled={!activeUserNumber}
                        className="flex-1 bg-slate-50 border border-gray-200 py-3 px-6 rounded-full text-sm outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-50"
                    />
                    <button type="submit" disabled={!inputText.trim() || !activeUserNumber} className="bg-brand-orange text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-orange-600 transition-all disabled:opacity-50 shadow-lg">
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WhatsAppChat;