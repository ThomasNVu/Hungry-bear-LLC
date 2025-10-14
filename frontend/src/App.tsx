import Navbar from "./component/Navbar";
import Calendar from "./component/Calendar";
import Login from "./pages/Login"; // Import the Login component

function App() {
  return (
    <div>
      <Navbar />
      <Calendar />
      <Login /> {/* Render the Login component here */}
    </div>
  );
}

export default App;
