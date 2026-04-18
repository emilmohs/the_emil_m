"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
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
        email,
        password,
        redirect: false,
      });

      console.log("Login result:", res);

      if (res?.error) {
        setError("Ungültige Zugangsdaten. Bitte überprüfe E-Mail und Passwort.");
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
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">ILE Login</h2>
        
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        
        <form onSubmit={handleLocalLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              required
              autoComplete="email"
              className="w-full px-3 py-2 mt-1 border rounded-md text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
