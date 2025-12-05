const express = require('express');
const { verifyIdToken } = require('./firebaseAdmin');

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Route to verify Firebase ID token and retrieve UID
app.post('/verify-token', async (req, res) => {
  const { idToken } = req.body;  // Firebase ID token sent from the frontend
  if (!idToken) {
    return res.status(400).send("ID token is required");
  }

  try {
    const uid = await verifyIdToken(idToken);
    res.status(200).send({ uid });
  } catch (error) {
    res.status(500).send("Error verifying token: " + error.message);
  }
});

// Start the server (example for local testing)
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
