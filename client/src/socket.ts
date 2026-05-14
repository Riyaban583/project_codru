import { io } from "socket.io-client";

const API_BASE = (import.meta.env.VITE_API || "http://localhost:8080").replace(/\/$/, "");

export const socket = io(API_BASE, {
    transports: ["websocket", 'polling'],
    upgrade: false,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity, // Keep trying to reconnect forever
    reconnectionDelay: 1000,
});