import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("✅ User has been logged out.");
      navigate("/login"); // 👈 optional redirect (back to login page)
    } catch (error) {
      console.error("❌ Error signing out:", error);
    }
  };

  return (
    <nav className="top-0 w-full z-50 transition-all duration-300 backdrop-blur-sm border-b-2 border-b-[#78502C]">
      <div className="max-w-8xl mx-auto px-2 sm:px-3 lg:px-4">
        <div className="flex justify-between items-center h-10 sm:h-12 lg:h-16">
          <div>
            <img
              src="../logo-starter.png"
              className="h-10 sm:h-12 lg:h-18"
              alt="Hungry Bear Logo"
            />
          </div>

          <button className="hover:cursor-pointer" onClick={handleSignOut}>
            <img
              src="image.png"
              alt="User Icon"
              className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12"
            />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
