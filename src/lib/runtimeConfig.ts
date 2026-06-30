const DEFAULT_API_URL = "https://labback-wz5w.onrender.com/api";
const DEFAULT_SOCKET_URL = "https://labback-wz5w.onrender.com";

export const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || DEFAULT_SOCKET_URL;