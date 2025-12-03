import axios from "axios";
import { auth } from "../firebaseConfig";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/",
});

// Reads Firebase ID token when available; falls back to localStorage copy.
API.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("authToken", token);
        }
        return config;
      } catch (err) {
        console.error("Failed to get Firebase ID token", err);
      }
    }

    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("authToken")
        : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// If the backend rejects with 401, drop the token and send user to login.
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("authToken");
      if (typeof window !== "undefined") {
        window.location.replace("/Login");
      }
    }
    return Promise.reject(error);
  },
);

export default API;
