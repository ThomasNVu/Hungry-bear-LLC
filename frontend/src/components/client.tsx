import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/",
});

// Reads Token from Local Storage and sends it back with API Calls
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
