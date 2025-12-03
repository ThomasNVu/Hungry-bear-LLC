import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Navigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import API from "./client";

type Props = {
  children: JSX.Element;
};

/**
 * Simple route guard: waits for Firebase auth, then either renders children
 * or redirects to account creation when unauthenticated.
 */
export default function RequireAuth({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (current) => {
      setUser(current);
      setChecked(true);
    });
    return () => unsub();
  }, []);

  // Refresh backend token + calendarId whenever the Firebase user changes.
  useEffect(() => {
    if (!user) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("calendarId");
      window.dispatchEvent(new Event("calendarIdUpdated"));
      return;
    }
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await API.post("/login", { id_token: idToken });
        const accessToken = res.data?.access_token ?? idToken;
        localStorage.setItem("authToken", accessToken);
        const defaultCalId = res.data?.default_calendar?.id;
        if (defaultCalId) {
          localStorage.setItem("calendarId", defaultCalId);
          window.dispatchEvent(new Event("calendarIdUpdated"));
        } else {
          localStorage.removeItem("calendarId");
          window.dispatchEvent(new Event("calendarIdUpdated"));
        }
      } catch (err) {
        console.error("Failed to refresh backend login", err);
      }
    })();
  }, [user]);

  if (!checked) return null;
  if (!user) {
    // Redirect unauthenticated users to login.
    return <Navigate to="/Login" replace />;
  }
  return children;
}
