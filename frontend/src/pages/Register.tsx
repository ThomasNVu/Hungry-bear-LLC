import { useEffect, useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

function Register() {
  const [formVisible, setFormVisible] = useState(false);
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setFormVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/");
    });
    return () => unsub();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    )?.value;
    const password = (
      e.currentTarget.elements.namedItem("password") as HTMLInputElement
    )?.value;
    const confirmPassword = (
      e.currentTarget.elements.namedItem("confirmPassword") as HTMLInputElement
    )?.value;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.message ?? "Failed to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const goToLogin = () => {
    // Make sure this path matches your <Route path="/login" ... />
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 font-inter font-light flex-col">
      <h2 className="text-3xl font-semibold text-center mb-4">
        Create your Account
      </h2>

      <div
        className={`relative rounded-lg p-13 max-w-xl w-full
       border border-[#DDDDDD] shadow-[0_4px_4px_1px_rgba(0,0,0,0.15)] hover:shadow-[0_0_25px_5px_rgba(56,140,248,1)] transition duration-300
       ${formVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"} transform transition-all duration-500
        ease-out`}
      >
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="block mb-1.5">
              Email Address
            </label>
            <input
              required
              type="email"
              name="email"
              id="email"
              placeholder="Enter Email Address"
              autoComplete="email"
              className="w-full border border-[#78502C] bg-transparent rounded-md p-3 outline-none text-xs"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="block mb-1.5">
              Password
            </label>
            <input
              required
              type={passwordVisible ? "text" : "password"}
              name="password"
              id="password"
              placeholder="Create a Password"
              autoComplete="new-password"
              className="w-full border border-[#78502C] bg-transparent rounded-md p-3 outline-none text-xs"
            />
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              aria-pressed={passwordVisible}
              className="absolute right-2 top-10 text-gray-400 hover:text-cyan-400 focus:outline-none"
            >
              {passwordVisible ? (
                <AiOutlineEyeInvisible className="h-5 w-5" />
              ) : (
                <AiOutlineEye className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="relative">
            <label htmlFor="confirmPassword" className="block mb-1.5">
              Retype Password
            </label>
            <input
              required
              type={confirmPasswordVisible ? "text" : "password"}
              name="confirmPassword"
              id="confirmPassword"
              placeholder="Retype Password"
              autoComplete="new-password"
              className="w-full border border-[#78502C] bg-transparent rounded-md p-3 outline-none text-xs"
            />
            <button
              type="button"
              onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              aria-label={
                confirmPasswordVisible ? "Hide password" : "Show password"
              }
              aria-pressed={confirmPasswordVisible}
              className="absolute right-2 top-10 text-gray-400 hover:text-cyan-400 focus:outline-none"
            >
              {confirmPasswordVisible ? (
                <AiOutlineEyeInvisible className="h-5 w-5" />
              ) : (
                <AiOutlineEye className="h-5 w-5" />
              )}
            </button>
          </div>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <div className="flex flex-col items-center">
            <button
              type="submit"
              disabled={submitting}
              className=" w-[50%] bg-[#78502C] text-white py-2 rounded-lg hover:bg-amber-950 transition-all duration-300
            focus:outline-none shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm mt-6 flex justify-center">
          <span className="mr-1">Already have an account?</span>
          <button
            onClick={goToLogin}
            className=" hover:underline hover:text-cyan-400 transition-all duration-200"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
