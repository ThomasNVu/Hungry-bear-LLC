import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Login from "./pages/Login.tsx";
import SignUp from "./pages/SignUp.tsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PageNotFound from "./pages/PageNotFound.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";

const router = createBrowserRouter([
  { path: "/", element: <CalendarPage /> },
  { path: "/Login", element: <Login /> },
  { path: "/SignUp", element: <SignUp /> },
  { path: "*", element: <PageNotFound /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
