// Function to send UID to backend
const sendUIDToBackend = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const idToken = await user.getIdToken();
    
    // Send ID token to backend
    const response = await fetch('http://localhost:3000/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });
    
    const data = await response.json();
    console.log('Backend UID:', data.uid);
  }
};
