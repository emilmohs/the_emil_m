"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting login...");
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      console.log("Login result:", res);

      if (res?.error) {
        setError("Ungültige Zugangsdaten. Bitte überprüfe Benutzername und Passwort.");
      } else if (res?.ok) {
        console.log("Login successful, redirecting...");
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Ein unbekannter Fehler ist aufgetreten.");
      }
    } catch (err) {
      console.error("Login catch block:", err);
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center gap-4 mb-6">
          <img 
            src="/novum/Logo_full_Novum.png" 
            alt="Novum Logo" 
            className="h-12 w-auto mb-2"
          />
          <h2 className="text-2xl font-bold text-center text-gray-900 tracking-tight">Anmelden bei Novum</h2>
        </div>
        
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        
        <form onSubmit={handleLocalLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Benutzername</label>
            <input 
              type="text" 
              required
              autoComplete="username"
              className="w-full px-3 py-2 mt-1 border rounded-md text-black"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Passwort</label>
            <input 
              type="password" 
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 mt-1 border rounded-md text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Anmelden…" : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}
