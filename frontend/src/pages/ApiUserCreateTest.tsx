import { useState } from "react";
import API from "../components/client";

export default function ApiUserCreateTest() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setOutput("");
    setLoading(true);
    try {
      const res = await API.post("/users", {
        email,
        full_name: fullName || null,
        avatar_url: avatarUrl || null,
      });
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
      <h1 className="text-2xl font-semibold">API User Create Test</h1>
      <p className="text-sm text-gray-600">
        Submits POST /users with the values below and shows the raw response.
      </p>

      <form className="space-y-3" onSubmit={handleCreate}>
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
          <span className="text-sm">Full name (optional)</span>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            type="text"
          />
        </label>
        <label className="block">
          <span className="text-sm">Avatar URL (optional)</span>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            type="url"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send to /users"}
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
