"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-primary/30 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]"></div>
      </div>

      <div className="relative w-full max-w-[480px] animate-fade-in group">
        {/* Decorative elements around the card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
        
        <div className="relative bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 md:p-14 shadow-2xl overflow-hidden">
          {/* Subtle light streak */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

          <div className="text-center mb-12 relative z-10">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-2xl relative group-hover:scale-110 transition-transform duration-500">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-3">Arena Access</h1>
            <p className="text-slate-500 font-bold text-sm tracking-wide uppercase">Simulation Protocol v2.0</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-500 ml-1">Command Identity</label>
              <input
                type="text"
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-500">Secure Key</label>
                <Link href="#" className="text-[10px] uppercase tracking-widest font-black text-primary/60 hover:text-primary transition-colors">Lost Access?</Link>
              </div>
              <input
                type="password"
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center animate-shake">
                <p className="text-red-400 text-xs font-bold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="relative group/btn w-full overflow-hidden rounded-[1.25rem] mt-4"
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-700 transition-all group-hover/btn:scale-105"></div>
              <div className="relative flex items-center justify-center gap-3 py-4 text-white font-black uppercase tracking-[0.15em] text-sm">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Engage Engine"
                )}
              </div>
            </button>
          </form>

          <p className="mt-10 text-center text-xs font-bold text-slate-600 uppercase tracking-widest relative z-10">
            No Credentials?{" "}
            <Link href="/auth/signup" className="text-primary hover:text-blue-400 transition-colors ml-1">
              Initialize New Account
            </Link>
          </p>
        </div>
        
        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">Empowerment Systems © 2026</p>
        </div>
      </div>
    </div>
  );
}
