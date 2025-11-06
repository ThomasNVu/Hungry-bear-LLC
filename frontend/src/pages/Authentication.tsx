import { useState } from "react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";

function Authentication() {
  const [mode, setMode] = useState("login");

  return (
    <div className="max-w-[60%] mx-auto h-screen flex justify-center flex-col  bg-red-50">
      <h1 className="text-center">
        {mode === "login" ? "Login" : "Create Account"}
      </h1>

      {mode === "login" ? <LoginForm /> : <RegisterForm />}

      <div className="m-t-16, text-cente">
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "Need an account? Register"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}

export default Authentication;
