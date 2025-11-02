import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import Login from "./pages/Login.tsx";
import Authentication from "./pages/Authentication.tsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PageNotFound from "./pages/PageNotFound.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";

const router = createBrowserRouter([
  { path: "/", element: <CalendarPage /> },
  { path: "/Login", element: <Authentication /> },
  { path: "*", element: <PageNotFound /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
