// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (make sure you have a service account key)
admin.initializeApp({
  credential: admin.credential.applicationDefault(),  // Or use a service account key
});

// Function to verify ID token and get UID
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log("Decoded UID:", uid);
    // Now you can interact with Firestore or your backend logic using the UID
    return uid;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    throw new Error("Authentication failed");
  }
};

module.exports = { verifyIdToken };
