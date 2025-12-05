// Import Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Firebase configuration (replace with your Firebase project's config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Check if the user is signed in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Get Firebase UID
    const uid = user.uid;
    console.log("User UID:", uid);
    // You can send this UID to your backend (e.g., via an API request)
    // Example: sendUIDToBackend(uid);
  } else {
    console.log("No user signed in");
  }
});
