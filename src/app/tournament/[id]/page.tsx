"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Play, LayoutGrid, List, Swords, TrendingUp, History, Trophy, Activity } from "lucide-react";
import Link from "next/link";
import MatchArena from "@/components/MatchArena";

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"points" | "matches">("points");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [isPreparing, setIsPreparing] = useState(false);
  const [homeSelection, setHomeSelection] = useState<string[]>([]);
  const [awaySelection, setAwaySelection] = useState<string[]>([]);

  const [isSimulating, setIsSimulating] = useState(false);
  const [viewingMatch, setViewingMatch] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    const res = await fetch(`/api/tournaments/${id}`);
    if (res.ok) {
      const data = await res.json();
      setTournament(data);
    } else {
      router.push("/dashboard");
    }
  };

  const onArenaComplete = async (results: any) => {
    setLoading(true);
    setIsSimulating(false);
    const res = await fetch(`/api/tournaments/${id}/simulate`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        home11: homeSelection, 
        away11: awaySelection,
        finalResults: results 
      })
    });
    if (res.ok) {
      await fetchTournament();
      setIsPreparing(false);
      setHomeSelection([]);
      setAwaySelection([]);
    }
    setLoading(false);
  };

  if (!tournament) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center text-slate-50">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground font-medium animate-pulse uppercase tracking-[0.2em] text-[10px]">Syncing Arena Data...</p>
    </div>
  );

  const sortedTeams = [...tournament.teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });

  const nextMatch = tournament.matches.find((m: any) => !m.isCompleted);
  const completedMatches = tournament.matches.filter((m: any) => m.isCompleted).reverse();

  // Helper to get players for a specific match/team
  const getTeamPlayers = (teamName: string) => tournament.teams.find((t: any) => t.name === teamName)?.players || [];

  const homeTeamPlayers = nextMatch ? getTeamPlayers(nextMatch.homeTeam) : [];
  const awayTeamPlayers = nextMatch ? getTeamPlayers(nextMatch.awayTeam) : [];

  const togglePlayer = (name: string, type: "home" | "away") => {
    const selection = type === "home" ? homeSelection : awaySelection;
    const setSelection = type === "home" ? setHomeSelection : setAwaySelection;

    if (selection.includes(name)) {
      setSelection(selection.filter(n => n !== name));
    } else {
      if (selection.length < 11) {
        setSelection([...selection, name]);
      }
    }
  };

  const getRoleStats = (teamPlayers: any[], selectedNames: string[]) => {
    const selectedPlayers = teamPlayers.filter(p => selectedNames.includes(p.name));
    let batters = 0;
    let bowlers = 0;
    let allrounders = 0;

    selectedPlayers.forEach(p => {
      const role = p.role.toLowerCase();
      if (role.includes('all-rounder')) {
        allrounders++;
      } else if (role.includes('bowler') || role.includes('pacer') || role.includes('spinner')) {
        bowlers++;
      } else {
        batters++;
      }
    });

    return { batters, bowlers, allrounders };
  };

  const homeStats = getRoleStats(homeTeamPlayers, homeSelection);
  const awayStats = getRoleStats(awayTeamPlayers, awaySelection);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-primary/30 relative">
      {/* Interactive Match Arena */}
      {isSimulating && nextMatch && (
        <MatchArena
          tournamentId={id}
          match={nextMatch}
          homePlayers={homeTeamPlayers}
          awayPlayers={awayTeamPlayers}
          home11={homeSelection}
          away11={awaySelection}
          onComplete={onArenaComplete}
          onCancel={() => setIsSimulating(false)}
        />
      )}

      {/* Historical Scorecard View */}
      {viewingMatch && (
        <MatchArena
          tournamentId={id}
          match={viewingMatch}
          homePlayers={getTeamPlayers(viewingMatch.homeTeam)}
          awayPlayers={getTeamPlayers(viewingMatch.awayTeam)}
          home11={viewingMatch.homeSquad}
          away11={viewingMatch.awaySquad}
          viewOnlyResults={viewingMatch}
          onComplete={() => setViewingMatch(null)}
          onCancel={() => setViewingMatch(null)}
        />
      )}

      {/* Preparation Modal */}
      {isPreparing && nextMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={() => setIsPreparing(false)}></div>
          
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h2 className="text-3xl font-black tracking-tight">Recruit Playing 11</h2>
                <div className="flex gap-4 mt-2">
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Select 11 Operators per Faction</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3">
                  <span className={homeSelection.length === 11 ? "text-primary" : "text-slate-500"}>{homeSelection.length}/11</span>
                  <span className="text-slate-700">|</span>
                  <span className={awaySelection.length === 11 ? "text-white" : "text-slate-500"}>{awaySelection.length}/11</span>
                </div>
                <button 
                  onClick={() => setIsPreparing(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <List className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid md:grid-cols-2 gap-10">
                {/* Home Team Selection */}
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 px-2">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/20 border border-primary/20 rounded-xl flex items-center justify-center text-primary font-black">{nextMatch.homeTeam[0]}</div>
                      <div>
                        <h3 className="font-black text-xl">{nextMatch.homeTeam}</h3>
                        <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Home Vanguard</p>
                      </div>
                    </div>
                    {/* Role Counters */}
                    <div className="flex gap-2">
                      <div className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[60px]">
                        <span className="text-primary text-[10px] font-black uppercase">Bat</span>
                        <span className="text-lg font-black">{homeStats.batters}</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[60px]">
                        <span className="text-primary text-[10px] font-black uppercase">Bowl</span>
                        <span className="text-lg font-black">{homeStats.bowlers}</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[60px]">
                        <span className="text-primary text-[10px] font-black uppercase">AR</span>
                        <span className="text-lg font-black">{homeStats.allrounders}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {homeTeamPlayers.map((p: any) => (
                      <button
                        key={p.name}
                        onClick={() => togglePlayer(p.name, "home")}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${homeSelection.includes(p.name) ? 'bg-primary/20 border-primary/30' : 'bg-white/[0.03] border-white/5 hover:border-white/20'}`}
                      >
                        <div className="text-left">
                          <div className="font-bold text-sm">{p.name}</div>
                          <div className="text-[10px] uppercase font-black text-slate-500">{p.role}</div>
                        </div>
                        {homeSelection.includes(p.name) && <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center"><TrendingUp className="w-3 h-3 text-white" /></div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Away Team Selection */}
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 px-2">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white font-black">{nextMatch.awayTeam[0]}</div>
                      <div>
                        <h3 className="font-black text-xl">{nextMatch.awayTeam}</h3>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Invading Force</p>
                      </div>
                    </div>
                    {/* Role Counters */}
                    <div className="flex gap-2">
                      <div className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[60px]">
                        <span className="text-slate-500 text-[10px] font-black uppercase">Bat</span>
                        <span className="text-lg font-black">{awayStats.batters}</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[60px]">
                        <span className="text-slate-500 text-[10px] font-black uppercase">Bowl</span>
                        <span className="text-lg font-black">{awayStats.bowlers}</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[60px]">
                        <span className="text-slate-500 text-[10px] font-black uppercase">AR</span>
                        <span className="text-lg font-black">{awayStats.allrounders}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {awayTeamPlayers.map((p: any) => (
                      <button
                        key={p.name}
                        onClick={() => togglePlayer(p.name, "away")}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${awaySelection.includes(p.name) ? 'bg-white/10 border-white/30' : 'bg-white/[0.03] border-white/5 hover:border-white/20'}`}
                      >
                        <div className="text-left">
                          <div className="font-bold text-sm">{p.name}</div>
                          <div className="text-[10px] uppercase font-black text-slate-500">{p.role}</div>
                        </div>
                        {awaySelection.includes(p.name) && <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center"><TrendingUp className="w-3 h-3 text-slate-950" /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-slate-950/50">
              <button
                onClick={() => setIsSimulating(true)}
                disabled={loading || homeSelection.length !== 11 || awaySelection.length !== 11}
                className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 ${homeSelection.length === 11 && awaySelection.length === 11 ? 'bg-primary text-white shadow-2xl shadow-primary/30 active:scale-[0.98]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                  <>
                    <Swords className="w-5 h-5" />
                    Commence Simulation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10 lg:py-16">
        {/* Navigation & Header */}
        <header className="mb-12 animate-fade-in">
          <Link href="/dashboard" className="group flex items-center gap-3 text-slate-400 hover:text-white mb-10 transition-all w-fit px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Return to Command Hub</span>
          </Link>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-10 bg-primary rounded-full"></div>
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight">{tournament.name}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 rounded-full">Double Round Robin</span>
                <span className="flex items-center gap-2.5 text-slate-400 text-sm font-bold bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                  <Swords className="w-4 h-4 text-primary" />
                  {completedMatches.length} <span className="text-slate-600 font-medium">OF</span> {tournament.matches.length} BATTLES CONCLUDED
                </span>
              </div>
            </div>
            
            {nextMatch && (
              <div className="w-full lg:w-auto p-1.5 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-md">
                <button 
                  onClick={() => setIsPreparing(true)}
                  disabled={loading}
                  className="relative group w-full lg:w-auto px-10 py-5 overflow-hidden rounded-[1.5rem]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 group-hover:scale-105 transition-transform"></div>
                  <div className={`relative flex items-center justify-center gap-3 text-white font-black uppercase tracking-wider ${loading ? 'opacity-80' : 'animate-pulse-glow'}`}>
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing Sim...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        Execute Next Match
                      </>
                    )}
                  </div>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 bg-slate-900/50 backdrop-blur-xl rounded-[1.5rem] w-full sm:w-fit mb-12 border border-white/10 shadow-2xl">
          <button 
            onClick={() => setActiveTab("points")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-[1rem] transition-all font-black text-xs uppercase tracking-widest ${activeTab === "points" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-slate-500 hover:text-white"}`}
          >
            <TrendingUp className="w-4 h-4" />
            Standings
          </button>
          <button 
            onClick={() => setActiveTab("matches")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-[1rem] transition-all font-black text-xs uppercase tracking-widest ${activeTab === "matches" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-slate-500 hover:text-white"}`}
          >
            <Swords className="w-4 h-4" />
            Fixtures
          </button>
        </div>

        {activeTab === "points" ? (
          <div className="animate-slide-up">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.03]">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Pos</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Team Identity</th>
                      <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">P</th>
                      <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">W</th>
                      <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">L</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">PTS</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">NRR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedTeams.map((team, idx) => (
                      <tr key={team.name} className="group hover:bg-white/[0.04] transition-colors">
                        <td className="px-8 py-7">
                          <span className={`flex items-center justify-center w-10 h-10 rounded-2xl font-black text-sm ${idx < 4 ? 'bg-primary/20 text-primary border border-primary/20 shadow-lg shadow-primary/10' : 'bg-slate-800/50 text-slate-500 border border-white/5'}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-8 py-7">
                          <div className="font-black text-xl text-white group-hover:text-primary transition-colors">{team.name}</div>
                          <div className="text-[9px] uppercase tracking-[0.25em] font-black text-slate-600 mt-1.5">Registered Squad</div>
                        </td>
                        <td className="px-4 py-7 text-center font-bold text-slate-300">{team.played}</td>
                        <td className="px-4 py-7 text-center text-green-400 font-black">{team.won}</td>
                        <td className="px-4 py-7 text-center text-red-500 font-black">{team.lost}</td>
                        <td className="px-8 py-7 text-center">
                          <span className="text-3xl font-black bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">
                            {team.points}
                          </span>
                        </td>
                        <td className="px-10 py-7 text-right font-mono text-sm font-bold">
                          <span className={`${team.nrr >= 0 ? "text-blue-400" : "text-orange-500"} bg-white/5 px-3 py-1.5 rounded-lg border border-white/5`}>
                            {team.nrr > 0 ? "+" : ""}{team.nrr.toFixed(3)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-10 animate-slide-up">
            {/* Next Match Highlight */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-8">
              <div className="flex items-center gap-3 px-2">
                <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">Battle Sector</h2>
              </div>
              
              {nextMatch ? (
                <div className="relative group bg-slate-900 border border-white/10 rounded-[3rem] p-12 overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                  
                  <div className="relative z-10 flex flex-col items-center gap-12">
                    <div className="flex items-center justify-between w-full">
                      <div className="text-center flex-1 space-y-4">
                        <div className="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-white/5 shadow-2xl group-hover:border-primary/30 transition-colors">
                          <span className="text-3xl font-black text-white">{nextMatch.homeTeam[0]}</span>
                        </div>
                        <div>
                          <p className="font-black text-2xl text-white tracking-tight line-clamp-1">{nextMatch.homeTeam}</p>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Home Advantage</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-4xl font-black italic text-slate-800 tracking-tighter">VS</div>
                        <div className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 rounded-full">ROUND {Math.ceil(nextMatch.matchNumber / 4)}</div>
                      </div>

                      <div className="text-center flex-1 space-y-4">
                        <div className="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-white/5 shadow-2xl group-hover:border-primary/30 transition-colors">
                          <span className="text-3xl font-black text-white">{nextMatch.awayTeam[0]}</span>
                        </div>
                        <div>
                          <p className="font-black text-2xl text-white tracking-tight line-clamp-1">{nextMatch.awayTeam}</p>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Challenger</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setIsPreparing(true)}
                      disabled={loading}
                      className="w-full relative group/btn overflow-hidden rounded-2xl"
                    >
                      <div className="absolute inset-0 bg-white text-slate-950 font-black uppercase tracking-[0.15em] flex items-center justify-center py-5 group-hover/btn:bg-primary group-hover/btn:text-white transition-all">
                        Simulate Protocol
                      </div>
                      <div className="invisible py-5">Placeholder</div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-white/10 rounded-[3rem] p-16 text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <Trophy className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-3xl font-black text-white">Season Terminal</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mt-4 font-bold">All scheduled encounters have been resolved. The Arena is silent.</p>
                </div>
              )}
            </div>

            {/* Results Timeline */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-8">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-white/5">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  Battle Logs
                </h2>
              </div>
              
              <div className="space-y-5 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
                {completedMatches.length === 0 ? (
                  <div className="bg-slate-900/30 border-2 border-dashed border-white/10 rounded-[2.5rem] p-20 text-center">
                    <p className="text-slate-600 font-black uppercase tracking-widest text-sm">Waiting for first blood...</p>
                  </div>
                ) : (
                  completedMatches.map((m: any, idx: number) => (
                    <div key={m._id} className="group bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 flex flex-col gap-6 transition-all hover:bg-slate-800/60" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1 w-full space-y-4">
                          <div className={`flex justify-between items-center px-6 py-4 rounded-2xl border ${m.winner === m.homeTeam ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/5'}`}>
                            <span className={`text-lg font-black ${m.winner === m.homeTeam ? "text-primary" : "text-slate-400"}`}>{m.homeTeam}</span>
                            <span className={`text-2xl font-black ${m.winner === m.homeTeam ? "text-white" : "text-slate-500"}`}>{m.homeScore}<span className="text-sm font-normal text-slate-600 ml-1">/ {m.homeWickets}</span></span>
                          </div>
                          <div className={`flex justify-between items-center px-6 py-4 rounded-2xl border ${m.winner === m.awayTeam ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/5'}`}>
                            <span className={`text-lg font-black ${m.winner === m.awayTeam ? "text-primary" : "text-slate-400"}`}>{m.awayTeam}</span>
                            <span className={`text-2xl font-black ${m.winner === m.awayTeam ? "text-white" : "text-slate-500"}`}>{m.awayScore}<span className="text-sm font-normal text-slate-600 ml-1">/ {m.awayWickets}</span></span>
                          </div>
                        </div>
                        
                        <div className="text-center md:text-right min-w-[200px] pt-6 md:pt-0 border-t md:border-t-0 border-white/5 w-full md:w-auto space-y-4">
                          <div className="text-[10px] font-black uppercase text-slate-600 tracking-[0.25em] mb-2">Outcome</div>
                          <div className={`inline-block font-black text-sm px-6 py-2.5 rounded-xl border-2 mb-4 ${m.winner === 'Tied' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-primary/20 text-primary border-primary/30'}`}>
                            {m.winner === 'Tied' ? "STALEMATE" : `${m.winner.toUpperCase()} VICTORIOUS`}
                          </div>
                          
                          <button 
                            onClick={() => setViewingMatch(m)}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all"
                          >
                            <Activity className="w-3 h-3" />
                            View Scorecard
                          </button>
                        </div>
                      </div>

                      {m.homeSquad && m.homeSquad.length > 0 && (
                        <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-8">
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest mb-3">Home Force</p>
                            <div className="flex flex-wrap gap-2">
                              {m.homeSquad.map((name: string) => <span key={name} className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-md text-[9px] font-bold text-slate-400 uppercase">{name}</span>)}
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest mb-3">Invading Force</p>
                            <div className="flex flex-wrap gap-2">
                              {m.awaySquad.map((name: string) => <span key={name} className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-md text-[9px] font-bold text-slate-400 uppercase">{name}</span>)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
