import axios from "axios";
import { API_URL } from "../lib/runtimeConfig";

const API = axios.create({
  baseURL: API_URL
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("lab_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.url && !config.url.startsWith("/api") && !config.url.startsWith("api/")) {
    config.url = `${config.url.startsWith("/") ? "" : "/"}${config.url}`;
  }

  return config;
});

export default API;
