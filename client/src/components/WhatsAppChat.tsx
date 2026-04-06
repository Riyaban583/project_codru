import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { socket } from '../socket';
import { Search, Send, Phone, User, Clock, AlertCircle, Loader2, Sparkles, ArrowLeft, Plus, X, Settings, RefreshCw, CheckCircle2, UserPlus } from 'lucide-react';

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
    
    // Dynamic Template States
    const [templates, setTemplates] = useState<any[]>([]); 
    const [allTemplates, setAllTemplates] = useState<any[]>([]); 
    const [isSendingTemplate, setIsSendingTemplate] = useState(false);
    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [updatingTemplateId, setUpdatingTemplateId] = useState<string | null>(null);

    // 🚨 NEW: States for Pre-Flight Variable Modal
    const [pendingTemplate, setPendingTemplate] = useState<any | null>(null);
    const [templateVariables, setTemplateVariables] = useState<string[]>([]);

    const [showNewContactModal, setShowNewContactModal] = useState(false);
    const [newContactName, setNewContactName] = useState("");
    const [newContactPhone, setNewContactPhone] = useState("");
    const [isAddingContact, setIsAddingContact] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const activeContact = contacts.find(c => c._id === selectedContactId);
    const activeUserNumber = activeContact?.phoneNumber;

    // ==========================================
    // DATA FETCHING 
    // ==========================================
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

    const fetchReadyTemplates = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/templates/ready`);
            setTemplates(res.data);
        } catch (err) {
            console.error("Error loading ready templates:", err);
        }
    }, []);

    const fetchAllTemplates = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/templates`);
            setAllTemplates(res.data);
        } catch (err) {
            console.error("Error loading all templates:", err);
        }
    }, []);

    useEffect(() => {
        fetchContacts();
        fetchReadyTemplates();
    }, [fetchContacts, fetchReadyTemplates]);

    useEffect(() => {
        if (showTemplateManager) {
            fetchAllTemplates();
        }
    }, [showTemplateManager, fetchAllTemplates]);

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

    // ==========================================
    // SOCKET LISTENER
    // ==========================================
    useEffect(() => {
        const handleNewMessage = (newMsg: WhatsAppMessage) => {
            const incomingNum = cleanNum(newMsg.userNumber);
            const currentActiveNum = cleanNum(activeUserNumber);

            if (incomingNum === currentActiveNum) {
                setMessages((prev) => {
                    if (prev.some(m => m.wa_id === newMsg.wa_id || m._id === newMsg._id)) return prev;
                    return [...prev, newMsg];
                });
            }

            if (newMsg.direction === 'incoming' && document.hidden) {
                new Notification(`New message from ${newMsg.senderName}`, {
                    body: newMsg.messageBody,
                    icon: '/logo.png' 
                });
            }

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
                            lastSeen: new Date().toISOString(),
                            unreadCount: incomingNum === currentActiveNum ? 0 : (c.unreadCount || 0) + 1
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
            setMessages((prev) => prev.map(m => 
                m.wa_id === updatedMsg.wa_id ? { ...m, ...updatedMsg } : m
            ));
        });
        return () => { 
            socket.off("whatsapp_message_update", handleNewMessage); 
            socket.off("whatsapp_status_update");
        };
    }, [activeUserNumber, fetchContacts]);

    // ==========================================
    // HANDLERS
    // ==========================================
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
        } catch (error) {
            console.error("Failed to send message:", error);
            setInputText(tempText);
        }
    };

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedNum = cleanNum(newContactPhone);
        if (!cleanedNum) return;
        setIsAddingContact(true);

        try {
            const res = await axios.post(`${API_BASE}/contacts`, {
                name: newContactName || cleanedNum,
                phoneNumber: cleanedNum
            });
            await fetchContacts();
            if (res.data && res.data._id) {
                setSelectedContactId(res.data._id);
            }
        } catch (error) {
            console.error("Failed to save new contact:", error);
            alert("Failed to save contact. Please check your connection and try again.");
        } finally {
            setShowNewContactModal(false);
            setNewContactName("");
            setNewContactPhone("");
            setIsAddingContact(false);
        }
    };

    // 🚨 NEW: The Pre-Flight Interceptor
    const initiateTemplateSend = (template: any) => {
        if (!activeContact) return;
        
        // If template has variables, open the modal!
        if (template.variableCount && template.variableCount > 0) {
            setPendingTemplate(template);
            setTemplateVariables(new Array(template.variableCount).fill(""));
        } else {
            // No variables? Send instantly!
            executeTemplateSend(template, []);
        }
    };

    // 🚨 UPDATED: The actual execution function
    const executeTemplateSend = async (template: any, vars: string[]) => {
        setIsSendingTemplate(true);
        try {
            await axios.post(`${API_BASE}/send-template`, {
                to: activeContact?.phoneNumber,
                templateName: template.metaName,
                headerUrl: template.headerImageUrl,
                languageCode: template.language || "en",
                variables: vars // Send the filled-in array!
            });
            setPendingTemplate(null); // Close modal on success
        } catch (err) {
            console.error("Failed to send template:", err);
            alert("Failed to send template.");
        } finally {
            setIsSendingTemplate(false);
        }
    };

    const handleSyncTemplates = async () => {
        setIsSyncing(true);
        try {
            const res = await axios.post(`${API_BASE}/templates/sync`);
            await fetchAllTemplates(); 
            alert(res.data.message || "Templates synced from Meta successfully!");
        } catch (error) {
            console.error("Sync Error:", error);
            alert("Failed to sync templates. Make sure your WABA_ID is set in the backend.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSaveTemplateConfig = async (template: any) => {
        setUpdatingTemplateId(template._id);
        try {
            await axios.post(`${API_BASE}/templates`, {
                displayName: template.displayName,
                metaName: template.metaName,
                language: template.language,
                headerImageUrl: template.headerImageUrl,
                buttonColor: template.buttonColor,
                variableCount: Number(template.variableCount) || 0 // 🚨 Save variable count
            });
            await fetchAllTemplates();
            await fetchReadyTemplates(); 
        } catch (error) {
            console.error("Save Template Error:", error);
            alert("Failed to save template configuration.");
        } finally {
            setUpdatingTemplateId(null);
        }
    };

    const formatLastSeen = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <>
            <div className="flex h-[calc(100%+2rem)] md:h-[calc(100%+2.5rem)] -mb-8 md:-mb-10 w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative">
                
                {/* LEFT SIDEBAR */}
                <div className={`
                    ${selectedContactId ? 'hidden' : 'flex'} 
                    w-full md:w-80 md:flex bg-slate-50 border-r border-gray-100 flex-col flex-shrink-0
                `}>
                    <div className="p-4 border-b border-gray-100 bg-white">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-display font-bold text-brand-blue">Live Support</h2>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowTemplateManager(true)}
                                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-brand-blue hover:text-white active:scale-95 transition-all"
                                    title="Template Manager"
                                >
                                    <Settings size={16} />
                                </button>
                                <button 
                                    onClick={() => setShowNewContactModal(true)}
                                    className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center shadow-md hover:bg-blue-700 active:scale-95 transition-all"
                                >
                                    <Plus size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search contacts..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all" 
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
                                        setContacts(prev => prev.map(c => 
                                            c._id === contact._id ? { ...c, unreadCount: 0 } : c
                                        ));
                                        axios.post(`${API_BASE}/contacts/reset-unread/${contact._id}`).catch(() => {});
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                                        selectedContactId === contact._id 
                                        ? 'bg-white border-brand-blue/20 shadow-sm' 
                                        : 'bg-transparent border-transparent hover:bg-slate-100'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                                        selectedContactId === contact._id ? 'bg-brand-blue' : 'bg-slate-300'
                                    }`}>
                                        {contact.name?.charAt(0) || "U"}
                                    </div>
                                    
                                    <div className="flex-1 overflow-hidden text-left">
                                        <h4 className={`text-sm font-bold truncate ${selectedContactId === contact._id ? 'text-slate-800' : 'text-slate-600'}`}>
                                            {contact.name || "Unknown"}
                                        </h4>
                                        <p className="text-xs text-slate-400 truncate">
                                            {contact.lastMessage || "No messages yet"}
                                        </p>
                                    </div>

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
                    <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
                        <div className="flex items-center gap-3">
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
                                <Sparkles size={48} className="mb-4 text-brand-blue/20" />
                                <p className="font-medium">No messages yet.</p>
                                <p className="text-sm opacity-70">Send a template below to get started!</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isOutgoing = msg.direction === 'outgoing';
                                const msgTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const dlvTime = msg.deliveredAt ? new Date(msg.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                                const readTime = msg.readAt ? new Date(msg.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

                                return (
                                    <div key={msg._id} className={`flex w-full ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                                        
                                        {!isOutgoing && (
                                            <div className="max-w-[85%] md:max-w-[70%] p-3.5 shadow-sm text-sm rounded-2xl bg-white text-slate-800 border border-gray-100 rounded-tl-sm">
                                                <p className="leading-relaxed whitespace-pre-wrap">{msg.messageBody}</p>
                                                <p className="text-[10px] mt-1 text-slate-400 text-left">{msgTime}</p>
                                            </div>
                                        )}

                                        {isOutgoing && (
                                            <div className="flex flex-col items-end max-w-[85%] md:max-w-[75%]">
                                                <div className="p-3.5 shadow-sm text-sm rounded-2xl bg-brand-blue text-white rounded-tr-sm w-full">
                                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.messageBody}</p>
                                                </div>
                                                
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

                    {/* TEMPLATE BUTTONS */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
                        {templates.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">No active templates. Configure them in Template Manager!</p>
                        ) : (
                            templates.map((tpl) => (
                                <button
                                    key={tpl._id}
                                    onClick={() => initiateTemplateSend(tpl)} // 🚨 Calls Pre-Flight
                                    disabled={isSendingTemplate || !activeUserNumber}
                                    className={`px-4 py-2 text-xs font-bold border rounded-xl transition disabled:opacity-50 shadow-sm ${
                                        tpl.buttonColor === 'green' ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' :
                                        tpl.buttonColor === 'orange' ? 'bg-orange-50 text-brand-orange border-orange-100 hover:bg-orange-100' :
                                        'bg-blue-50 text-brand-blue border-blue-100 hover:bg-blue-100'
                                    }`}
                                >
                                    {isSendingTemplate && pendingTemplate?._id === tpl._id ? "Sending..." : tpl.displayName}
                                </button>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
                        <input 
                            type="text" 
                            value={inputText} 
                            onChange={(e) => setInputText(e.target.value)} 
                            placeholder={activeUserNumber ? "Type your message..." : "Select a valid contact to chat"}
                            disabled={!activeUserNumber}
                            className="flex-1 bg-slate-50 border border-gray-200 py-3 px-6 rounded-full text-sm outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-50"
                        />
                        <button type="submit" disabled={!inputText.trim() || !activeUserNumber} className="bg-brand-orange text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-orange-600 transition-all disabled:opacity-50 shadow-lg">
                            <Send size={20} className="ml-1" />
                        </button>
                    </form>
                </div>
            </div>

            {/* 🚨 NEW: PRE-FLIGHT VARIABLES MODAL */}
            {pendingTemplate && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Complete Template</h3>
                            <button onClick={() => setPendingTemplate(null)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition">
                                <X size={20}/>
                            </button>
                        </div>
                        
                        <p className="text-sm text-slate-500 mb-6">This template requires {pendingTemplate.variableCount} custom variables.</p>

                        <div className="space-y-5">
                            {Array.from({ length: pendingTemplate.variableCount }).map((_, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Variable {`{{${i + 1}}}`}</label>
                                        
                                        {/* Auto-Fill Button */}
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const newVars = [...templateVariables];
                                                newVars[i] = activeContact?.name || "";
                                                setTemplateVariables(newVars);
                                            }}
                                            className="text-[10px] font-bold text-brand-blue bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-blue-100 transition"
                                        >
                                            <UserPlus size={12} /> Auto-fill Contact Name
                                        </button>
                                    </div>
                                    
                                    <input 
                                        type="text" 
                                        value={templateVariables[i] || ""}
                                        onChange={(e) => {
                                            const newVars = [...templateVariables];
                                            newVars[i] = e.target.value;
                                            setTemplateVariables(newVars);
                                        }}
                                        placeholder={`Enter text for {{${i + 1}}}`}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all" 
                                    />
                                </div>
                            ))}
                            
                            <div className="pt-4">
                                <button 
                                    onClick={() => executeTemplateSend(pendingTemplate, templateVariables)}
                                    disabled={isSendingTemplate || templateVariables.some(v => !v.trim())}
                                    className="w-full py-3.5 bg-brand-blue text-white font-black rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all flex justify-center items-center gap-2"
                                >
                                    {isSendingTemplate ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send size={18}/> SEND NOW</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD CONTACT MODAL */}
            {showNewContactModal && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Start New Chat</h3>
                            <button onClick={() => setShowNewContactModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition">
                                <X size={20}/>
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddContact} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contact Name <span className="text-slate-300 capitalize">(Optional)</span></label>
                                <input 
                                    type="text" 
                                    value={newContactName} 
                                    onChange={e => setNewContactName(e.target.value)} 
                                    placeholder="e.g. John Doe" 
                                    className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all" 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">WhatsApp Number</label>
                                <input 
                                    type="text" 
                                    value={newContactPhone} 
                                    onChange={e => setNewContactPhone(e.target.value)} 
                                    placeholder="Include country code (e.g. 919876543210)" 
                                    required 
                                    className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all" 
                                />
                            </div>
                            
                            <div className="pt-4">
                                <button 
                                    type="submit" 
                                    disabled={isAddingContact || !newContactPhone} 
                                    className="w-full py-3.5 bg-brand-blue text-white font-black rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all flex justify-center items-center"
                                >
                                    {isAddingContact ? <Loader2 className="w-5 h-5 animate-spin" /> : "START CHAT"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TEMPLATE MANAGER MODAL */}
            {showTemplateManager && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-10">
                    <div className="bg-white rounded-[32px] w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-slate-800">Template Manager</h2>
                                <p className="text-sm text-slate-500 mt-1">Sync from Meta and configure Cloudinary URLs.</p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={handleSyncTemplates}
                                    disabled={isSyncing}
                                    className="flex items-center gap-2 bg-brand-orange text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50 shadow-md"
                                >
                                    <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                                    {isSyncing ? "Syncing..." : "Sync Meta"}
                                </button>
                                <button onClick={() => setShowTemplateManager(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition">
                                    <X size={24}/>
                                </button>
                            </div>
                        </div>

                        {/* Body List */}
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-6">
                            {allTemplates.length === 0 ? (
                                <div className="text-center py-20">
                                    <Sparkles size={48} className="mx-auto mb-4 text-brand-blue/20" />
                                    <h3 className="text-lg font-bold text-slate-700">No Templates Found</h3>
                                    <p className="text-slate-500 mt-2">Click "Sync Meta" to pull your approved templates from WhatsApp.</p>
                                </div>
                            ) : (
                                allTemplates.map((tpl) => (
                                    <div key={tpl._id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                                        
                                        {/* Left Side: Basic Info */}
                                        <div className="w-full md:w-1/3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-bold text-slate-800 text-lg">{tpl.metaName}</h3>
                                                {tpl.isConfigured ? (
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={12}/> Ready</span>
                                                ) : (
                                                    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Setup Needed</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-4">Meta Status: {tpl.metaStatus}</p>
                                            
                                            {tpl.requiresImage && (
                                                <div className="w-full h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                                                    {tpl.headerImageUrl ? (
                                                        <img src={tpl.headerImageUrl} alt="Header Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-bold">No Image Provided</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side: Edit Form */}
                                        <div className="flex-1 w-full space-y-4">
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Button Display Name</label>
                                                    <input 
                                                        type="text" 
                                                        value={tpl.displayName} 
                                                        onChange={(e) => setAllTemplates(prev => prev.map(t => t._id === tpl._id ? { ...t, displayName: e.target.value } : t))}
                                                        className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10" 
                                                    />
                                                </div>
                                                
                                                {/* 🚨 NEW: Variable Count Setup */}
                                                <div className="w-24">
                                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Variables</label>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        max="5"
                                                        value={tpl.variableCount || 0} 
                                                        onChange={(e) => setAllTemplates(prev => prev.map(t => t._id === tpl._id ? { ...t, variableCount: parseInt(e.target.value) || 0 } : t))}
                                                        className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10" 
                                                    />
                                                </div>
                                            </div>

                                            {tpl.requiresImage && (
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Cloudinary Image URL</label>
                                                    <input 
                                                        type="text" 
                                                        value={tpl.headerImageUrl} 
                                                        onChange={(e) => setAllTemplates(prev => prev.map(t => t._id === tpl._id ? { ...t, headerImageUrl: e.target.value } : t))}
                                                        placeholder="https://res.cloudinary.com/..." 
                                                        className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10" 
                                                    />
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between pt-2">
                                                <div className="flex items-center gap-4">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Button Color:</label>
                                                    <select 
                                                        value={tpl.buttonColor}
                                                        onChange={(e) => setAllTemplates(prev => prev.map(t => t._id === tpl._id ? { ...t, buttonColor: e.target.value } : t))}
                                                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none cursor-pointer"
                                                    >
                                                        <option value="blue">Blue</option>
                                                        <option value="green">Green</option>
                                                        <option value="orange">Orange</option>
                                                    </select>
                                                </div>

                                                <button 
                                                    onClick={() => handleSaveTemplateConfig(tpl)}
                                                    disabled={updatingTemplateId === tpl._id}
                                                    className="bg-brand-blue text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-md disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {updatingTemplateId === tpl._id ? <Loader2 size={16} className="animate-spin" /> : "Save Config"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default WhatsAppChat;