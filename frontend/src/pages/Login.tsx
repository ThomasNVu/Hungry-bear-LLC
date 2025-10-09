import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [user, setUser] = useState<any>(null);  // Store the user object (null means not logged in)

  // Monitor Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);  // Update user state when auth state changes
    });

    return () => unsubscribe();  // Clean up on unmount
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        setMsg("✅ logged in");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setMsg("✅ account created");
      }
    } catch (err: any) {
      setMsg("❌ " + err.message);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
    setMsg("✅ logged out");
  };

  return (
    <div style={{ maxWidth: 320, margin: "48px auto", textAlign: "center" }}>
      {user ? (
        <div>
          <h2>Welcome, {user.email}</h2>
          <button onClick={handleSignOut}>Sign out</button>
        </div>
      ) : (
        <div>
          <h2>{mode === "login" ? "Login" : "Register"}</h2>
          <form onSubmit={submit}>
            <input
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <br />
            <br />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <br />
            <br />
            <button type="submit">{mode === "login" ? "Login" : "Create account"}</button>
          </form>
          <p>{msg}</p>
          <button onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      )}
    </div>
  );
}
