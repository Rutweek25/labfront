import { io } from "socket.io-client";
import { SOCKET_URL } from "./runtimeConfig";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
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
