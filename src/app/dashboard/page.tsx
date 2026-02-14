"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Plus, LogOut, ChevronRight, Activity, Calendar, Users } from "lucide-react";

export default function Dashboard() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    const res = await fetch("/api/tournaments");
    if (res.ok) {
      const data = await res.json();
      setTournaments(data);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);

    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/tournament/${data._id}`);
    } else {
      alert("Failed to create tournament");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-primary/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10 lg:py-16">
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between mb-16 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center justify-center w-14 h-14 bg-slate-900 rounded-2xl border border-white/10">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white m-0">ARENA</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/80 -mt-1">Battle Hub v2.0</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-95"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
            <span className="font-bold text-sm text-slate-300 group-hover:text-white transition-colors">Terminate Session</span>
          </button>
        </nav>

        <main className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Action Panel */}
          <aside className="lg:col-span-4 space-y-8 animate-slide-up">
            <div className="relative overflow-hidden group bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-8 bg-primary rounded-full"></div>
                  <h2 className="text-2xl font-black text-white">New Tournament</h2>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-black text-slate-500 ml-1">League Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Champions League 2026"
                      required
                    />
                  </div>

                  <button 
                    className="relative group/btn w-full overflow-hidden"
                    disabled={loading}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-700 transition-all group-hover/btn:scale-105"></div>
                    <div className="relative flex items-center justify-center gap-3 py-4 text-white font-black uppercase tracking-wider text-sm">
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          Initialize Arena
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 text-center hover:border-primary/30 transition-all">
                <Activity className="w-5 h-5 text-primary mx-auto mb-3" />
                <p className="text-3xl font-black text-white">{tournaments.length}</p>
                <p className="text-[10px] uppercase tracking-tighter font-bold text-slate-500">Active Leagues</p>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 text-center hover:border-blue-400/30 transition-all">
                <Users className="w-5 h-5 text-blue-400 mx-auto mb-3" />
                <p className="text-3xl font-black text-white">{tournaments.length * 8}</p>
                <p className="text-[10px] uppercase tracking-tighter font-bold text-slate-500">Registered Teams</p>
              </div>
            </div>
          </aside>

          {/* Tournament Feed */}
          <section className="lg:col-span-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-3xl font-black text-white flex items-center gap-4">
                Your Legacy
                <span className="flex items-center justify-center bg-primary/10 text-primary text-xs w-8 h-8 rounded-full border border-primary/20">{tournaments.length}</span>
              </h2>
            </div>

            <div className="space-y-5">
              {tournaments.length === 0 ? (
                <div className="relative group bg-slate-900/30 border-2 border-dashed border-white/10 rounded-[2.5rem] p-20 text-center hover:border-primary/40 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]"></div>
                  <div className="relative z-10">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                      <Calendar className="w-10 h-10 text-slate-600 group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-200">The Arena Awaits</h3>
                    <p className="text-slate-400 max-w-sm mx-auto mt-3">No active tournaments found. Orchestrate your first championship using the panel on the left.</p>
                  </div>
                </div>
              ) : (
                tournaments.map((t, index) => {
                  const completed = t.matches.filter((m: any) => m.isCompleted).length;
                  const total = t.matches.length;
                  const progress = (completed / total) * 100;

                  return (
                    <div 
                      key={t._id}
                      onClick={() => router.push(`/tournament/${t._id}`)}
                      className="group relative bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 cursor-pointer overflow-hidden transition-all hover:translate-y-[-4px] hover:bg-slate-800/60 hover:border-primary/30 shadow-xl"
                      style={{ animationDelay: `${0.1 * index}s` }}
                    >
                      {/* Progress background bar */}
                      <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 py-2">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-4">
                            <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors">{t.name}</h3>
                            {progress === 100 && (
                              <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20 rounded-lg">Hall of Fame</span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-blue-400" />
                              </div>
                              <span className="text-sm font-bold text-slate-400">{t.teams.length} Teams</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-sm font-bold text-slate-400">{completed} / {total} Matches</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-6 md:pt-0">
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Sim Status</p>
                            <p className="text-lg font-black text-white">{Math.round(progress)}%</p>
                          </div>
                          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all">
                            <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
