import { useState } from "react";
import API from "../components/client";

export default function ApiLoginTest() {
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password");
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setOutput("");
    setLoading(true);
    try {
      const res = await API.post("/login", { email, password });
      const token = res.data?.access_token;
      if (token) {
        localStorage.setItem("authToken", token);
      }
      setOutput(JSON.stringify(res.data, null, 2));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Request failed. See console.";
      setOutput(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">API Login Test</h1>
      <p className="text-sm text-gray-600">
        Submits POST /login with the values below and shows the raw response.
      </p>

      <form className="space-y-3" onSubmit={handleLogin}>
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm">Password</span>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send to /login"}
        </button>
      </form>

      <div>
        <div className="text-sm font-medium mb-1">Response</div>
        <pre className="bg-gray-100 rounded p-3 text-xs whitespace-pre-wrap break-words">
          {output || "No response yet."}
        </pre>
      </div>
    </div>
  );
}
