import { io } from "socket.io-client";
import { SOCKET_URL } from "./runtimeConfig";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ["websocket", "polling"],
  withCredentials: true,
  auth: {
    token: localStorage.getItem("lab_token") || ""
  }
});

export const refreshSocketAuth = () => {
  const wasConnected = socket.connected;
  socket.auth = {
    token: localStorage.getItem("lab_token") || ""
  };

  // If auth changes while connected, reconnect so rooms are rejoined with fresh token.
  if (wasConnected) {
    socket.disconnect();
    socket.connect();
  }
};
