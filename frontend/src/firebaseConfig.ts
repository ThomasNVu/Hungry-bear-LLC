// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getAnalytics,
  isSupported as analyticsSupported,
} from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6NWxdkzQlH8uhGokaaMe0Ejna6iATzYA",
  authDomain: "hungry-bear-llc.firebaseapp.com",
  projectId: "hungry-bear-llc",
  storageBucket: "hungry-bear-llc.firebasestorage.app",
  messagingSenderId: "1081997800081",
  appId: "1:1081997800081:web:10434d9c9a31c52f494530",
  measurementId: "G-Y60FYMZN7B",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase
(async () => {
  if (typeof window !== "undefined" && (await analyticsSupported())) {
    getAnalytics(app);
  }
})();

// Initialize Firebase Auth
export const auth = getAuth(app);
export default app;
