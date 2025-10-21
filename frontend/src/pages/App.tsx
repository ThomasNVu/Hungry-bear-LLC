import Navbar from "../components/Navbar";
import Calendar from "../components/Calendar";

function App() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="h-16 shrink-0">
        <Navbar />
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="w-[80%] mx-auto h-full p-6">
          <Calendar />
        </div>
      </main>
    </div>
  );
}

export default App;
