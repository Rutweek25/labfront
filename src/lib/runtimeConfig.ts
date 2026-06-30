const isProduction = import.meta.env.PROD;

export const API_URL = import.meta.env.VITE_API_URL || (isProduction ? "/api" : "http://localhost:5000/api");
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isProduction ? window.location.origin : "http://localhost:5000");