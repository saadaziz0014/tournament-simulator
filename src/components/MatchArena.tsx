"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Swords, Play, Activity, Zap, ChevronRight, AlertCircle } from "lucide-react";

interface Player {
  name: string;
  role: string;
}

interface MatchArenaProps {
  tournamentId: string;
  match: any;
  homePlayers: Player[];
  awayPlayers: Player[];
  home11: string[];
  away11: string[];
  onComplete: (results: any) => void;
  onCancel: () => void;
  viewOnlyResults?: any;
}

export interface BatterStats {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissedBy?: string;
}

export interface BowlerStats {
  name: string;
  balls: number;
  runs: number;
  wickets: number;
}

export default function MatchArena({
  match,
  homePlayers,
  awayPlayers,
  home11,
  away11,
  onComplete,
  onCancel,
  viewOnlyResults
}: MatchArenaProps) {
  const [innings, setInnings] = useState(1);
  const [selectedInningsTab, setSelectedInningsTab] = useState(1);
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [totalBalls, setTotalBalls] = useState(0);
  
  const [striker, setStriker] = useState<string | null>(null);
  const [nonStriker, setNonStriker] = useState<string | null>(null);
  const [currentBowler, setCurrentBowler] = useState<string | null>(null);
  
  const [showBatterSelect, setShowBatterSelect] = useState(true);
  const [showBowlerSelect, setShowBowlerSelect] = useState(false);

  const [history, setHistory] = useState<any[]>([]);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [battingStats, setBattingStats] = useState<Record<string, BatterStats>>({});
  const [bowlingStats, setBowlingStats] = useState<Record<string, BowlerStats>>({});
  
  const [allStats, setAllStats] = useState<any>({
    innings1Batting: null,
    innings1Bowling: null,
    innings2Batting: null,
    innings2Bowling: null
  });

  const [innings1Score, setInnings1Score] = useState(0);
  const [innings1Wickets, setInnings1Wickets] = useState(0);
  const [innings1Balls, setInnings1Balls] = useState(0);
  const [lastBowler, setLastBowler] = useState<string | null>(null);
  const [showScorecard, setShowScorecard] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (viewOnlyResults) {
      setIsFinished(true);
      setShowScorecard(true);
      setShowBatterSelect(false);
      setShowBowlerSelect(false);
    }
  }, [viewOnlyResults]);

  const effectiveHome11 = home11 || [];
  const effectiveAway11 = away11 || [];

  const battingTeam = innings === 1 ? match?.homeTeam : match?.awayTeam;
  const bowlingTeam = innings === 1 ? match?.awayTeam : match?.homeTeam;
  const battingSquad = innings === 1 ? effectiveHome11 : effectiveAway11;
  const bowlingSquad = innings === 1 ? effectiveAway11 : effectiveHome11;

  const playersMap = useMemo(() => {
    const map: Record<string, Player> = {};
    [...homePlayers, ...awayPlayers].forEach(p => { map[p.name] = p; });
    return map;
  }, [homePlayers, awayPlayers]);

  useEffect(() => {
    const batStats: Record<string, BatterStats> = {};
    battingSquad.forEach(name => {
      batStats[name] = { name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
    });
    setBattingStats(batStats);

    const bowlStats: Record<string, BowlerStats> = {};
    bowlingSquad.forEach(name => {
      bowlStats[name] = { name, balls: 0, runs: 0, wickets: 0 };
    });
    setBowlingStats(bowlStats);
  }, [innings]);

  const rollDice = () => {
    if (!striker || !nonStriker || !currentBowler) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    const isWicket = roll === 5 && lastRoll === 5;
    let runs = 0;

    if (!isWicket && (roll === 1 || roll === 4 || roll === 6)) {
      runs = roll;
    }

    const currentStriker = striker;
    const currentNonStriker = nonStriker;

    setScore(prev => prev + runs);
    setTotalBalls(prev => prev + 1);
    setLastRoll(isWicket ? null : roll);

    setBattingStats(prev => ({
      ...prev,
      [currentStriker]: { 
        ...prev[currentStriker], 
        runs: prev[currentStriker].runs + runs, 
        balls: prev[currentStriker].balls + 1, 
        fours: prev[currentStriker].fours + (runs === 4 ? 1 : 0),
        sixes: prev[currentStriker].sixes + (runs === 6 ? 1 : 0),
        isOut: isWicket,
        dismissedBy: isWicket ? currentBowler : prev[currentStriker].dismissedBy
      }
    }));

    setBowlingStats(prev => ({
      ...prev,
      [currentBowler]: { ...prev[currentBowler], runs: prev[currentBowler].runs + runs, balls: prev[currentBowler].balls + 1, wickets: prev[currentBowler].wickets + (isWicket ? 1 : 0) }
    }));

    setHistory(prev => [{ roll, runs, wicket: isWicket, batter: currentStriker }, ...prev].slice(0, 12));

    const isOverEnd = (totalBalls + 1) % 6 === 0;

    if (isWicket) {
      setWickets(prev => prev + 1);
      const isOverEndNow = (totalBalls + 1) % 6 === 0;

      if (isOverEndNow) {
        setStriker(currentNonStriker);
        setNonStriker(null);
        setCurrentBowler(null);
        if (totalBalls + 1 < 120) setShowBowlerSelect(true);
      } else {
        setStriker(null);
      }
      
      if (wickets + 1 < 10) {
        setShowBatterSelect(true);
      }
    } else {
      let nextStriker = currentStriker;
      let nextNonStriker = currentNonStriker;

      if (runs % 2 !== 0) {
        [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
      }

      if (isOverEnd) {
        [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
        setCurrentBowler(null);
        if (totalBalls + 1 < 120) setShowBowlerSelect(true);
      }

      setStriker(nextStriker);
      setNonStriker(nextNonStriker);
    }

    const isChasing = innings === 2;
    const target = innings1Score + 1;
    const allOut = (isWicket ? wickets + 1 : wickets) >= 10;
    const ballsUp = (totalBalls + 1) >= 120;
    const targetMet = isChasing && (score + runs) >= target;

    if (allOut || ballsUp || targetMet) {
      if (innings === 1) {
        setInnings1Score(score + runs);
        setInnings1Wickets(isWicket ? wickets + 1 : wickets);
        setInnings1Balls(totalBalls + 1);

        // Capture full Innings 1 state
        const finalInnings1Batting = { ...battingStats };
        if (currentStriker) {
          finalInnings1Batting[currentStriker] = {
            ...finalInnings1Batting[currentStriker],
            runs: finalInnings1Batting[currentStriker].runs + runs,
            balls: finalInnings1Batting[currentStriker].balls + 1,
            fours: finalInnings1Batting[currentStriker].fours + (runs === 4 ? 1 : 0),
            sixes: finalInnings1Batting[currentStriker].sixes + (runs === 6 ? 1 : 0),
            isOut: isWicket,
            dismissedBy: isWicket ? currentBowler : finalInnings1Batting[currentStriker].dismissedBy
          };
        }
        
        const finalInnings1Bowling = { ...bowlingStats };
        if (currentBowler) {
           finalInnings1Bowling[currentBowler] = {
             ...finalInnings1Bowling[currentBowler],
             runs: finalInnings1Bowling[currentBowler].runs + runs,
             balls: finalInnings1Bowling[currentBowler].balls + 1,
             wickets: finalInnings1Bowling[currentBowler].wickets + (isWicket ? 1 : 0)
           };
        }

        setAllStats((prev: any) => ({
          ...prev,
          innings1Batting: finalInnings1Batting,
          innings1Bowling: finalInnings1Bowling
        }));

        setTimeout(() => {
          setInnings(2);
          setScore(0); setWickets(0); setTotalBalls(0);
          setStriker(null); setNonStriker(null); setCurrentBowler(null);
          setLastBowler(null);
          setShowBatterSelect(true); setHistory([]); setLastRoll(null);
        }, 1500);
      } else {
        const finalResults = {
          homeScore: match.homeTeam === battingTeam ? (score + runs) : innings1Score,
          homeWickets: match.homeTeam === battingTeam ? (isWicket ? wickets + 1 : wickets) : innings1Wickets,
          homeOvers: match.homeTeam === battingTeam ? (totalBalls + 1) / 6 : innings1Balls / 6,
          awayScore: match.awayTeam === battingTeam ? (score + runs) : innings1Score,
          awayWickets: match.awayTeam === battingTeam ? (isWicket ? wickets + 1 : wickets) : innings1Wickets,
          awayOvers: match.awayTeam === battingTeam ? (totalBalls + 1) / 6 : innings1Balls / 6,
          winner: (score + runs) >= target ? battingTeam : (score + runs) < target - 1 ? bowlingTeam : 'Tied',
          // Store detailed stats for the database
          stats: {
            batting: {
              ...(innings === 2 ? { 
                  [battingTeam]: Object.values(battingStats).map(s => s.name === currentStriker ? {...s, runs: s.runs + runs, balls: s.balls + 1, fours: s.fours + (runs === 4 ? 1 : 0), sixes: s.sixes + (runs === 6 ? 1 : 0), isOut: isWicket, dismissedBy: isWicket ? currentBowler : s.dismissedBy} : s),
                  [bowlingTeam]: [] // Will be populated by previous innings check if we stored it
              } : {})
            },
            bowling: {}
          }
        };
        const finalInnings2Batting = { ...battingStats };
        if (currentStriker) {
          finalInnings2Batting[currentStriker] = {
            ...finalInnings2Batting[currentStriker],
            runs: finalInnings2Batting[currentStriker].runs + runs,
            balls: finalInnings2Batting[currentStriker].balls + 1,
            fours: finalInnings2Batting[currentStriker].fours + (runs === 4 ? 1 : 0),
            sixes: finalInnings2Batting[currentStriker].sixes + (runs === 6 ? 1 : 0),
            isOut: isWicket,
            dismissedBy: isWicket ? currentBowler : finalInnings2Batting[currentStriker].dismissedBy
          };
        }

        const finalInnings2Bowling = { ...bowlingStats };
        if (currentBowler) {
           finalInnings2Bowling[currentBowler] = {
             ...finalInnings2Bowling[currentBowler],
             runs: finalInnings2Bowling[currentBowler].runs + runs,
             balls: finalInnings2Bowling[currentBowler].balls + 1,
             wickets: finalInnings2Bowling[currentBowler].wickets + (isWicket ? 1 : 0)
           };
        }

        const results = {
          homeScore: match.homeTeam === battingTeam ? (score + runs) : innings1Score,
          homeWickets: match.homeTeam === battingTeam ? (isWicket ? wickets + 1 : wickets) : innings1Wickets,
          homeOvers: match.homeTeam === battingTeam ? (totalBalls + 1) / 6 : innings1Balls / 6,
          awayScore: match.awayTeam === battingTeam ? (score + runs) : innings1Score,
          awayWickets: match.awayTeam === battingTeam ? (isWicket ? wickets + 1 : wickets) : innings1Wickets,
          awayOvers: match.awayTeam === battingTeam ? (totalBalls + 1) / 6 : innings1Balls / 6,
          winner: (score + runs) >= target ? battingTeam : (score + runs) < target - 1 ? bowlingTeam : 'Tied',
          detailedStats: {
            innings1Batting: allStats.innings1Batting,
            innings1Bowling: allStats.innings1Bowling,
            innings2Batting: finalInnings2Batting,
            innings2Bowling: finalInnings2Bowling
          }
        };

        setAllStats((prev: any) => ({
          ...prev,
          innings1Batting: allStats.innings1Batting,
          innings1Bowling: allStats.innings1Bowling,
          innings2Batting: finalInnings2Batting,
          innings2Bowling: finalInnings2Bowling
        }));

        setIsFinished(true);
        setTimeout(() => onComplete(results), 5000); // 5 seconds for victory lap
      }
    }
  };

  const getOvers = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;
  const crr = totalBalls > 0 ? ((score / totalBalls) * 6).toFixed(2) : "0.00";
  const rrr = innings === 2 ? ((innings1Score + 1 - score) / ((120 - totalBalls) / 6)).toFixed(2) : null;

  return (
    <div className="fixed inset-0 z-[110] bg-[#020617] text-slate-50 flex flex-col animate-fade-in overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[150px]"></div>
      </div>

      <div className="relative flex-1 flex flex-col p-4 lg:p-8 max-w-7xl mx-auto w-full">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center">
              <Swords className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Active Battle Arena</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Innings {innings} • {battingTeam}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowScorecard(true)}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2"
            >
              <Activity className="w-3 h-3" />
              View Scorecard
            </button>
            <button onClick={onCancel} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all">Abort Simulation</button>
          </div>
        </header>

        <main className="flex-1 grid lg:grid-cols-12 gap-8 min-h-0">
          <section className="lg:col-span-8 flex flex-col gap-8 min-h-0">
            <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Batting: {battingTeam}</p>
                  <div className="flex items-baseline gap-4 justify-center md:justify-start">
                    <span className="text-8xl font-black tracking-tighter text-white">{score}</span>
                    <span className="text-4xl font-black text-slate-600">/ {wickets}</span>
                  </div>
                  <div className="mt-6 flex gap-4 justify-center md:justify-start">
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 font-black uppercase mr-2 tracking-widest">Ovs</span><span className="text-xl font-black">{getOvers(totalBalls)}</span></div>
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10"><span className="text-[10px] text-slate-500 font-black uppercase mr-2 tracking-widest">CRR</span><span className="text-xl font-black text-primary">{crr}</span></div>
                  </div>
                </div>
                {innings === 2 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 text-center min-w-[240px]">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Target Pursuit</p>
                    <p className="text-4xl font-black text-white">{innings1Score + 1 - score} <span className="text-xs text-slate-400">Needed</span></p>
                    <p className="text-[10px] font-black text-slate-500 uppercase mt-2">{120 - totalBalls} Balls Left</p>
                    <div className="mt-6 pt-6 border-t border-primary/10"><span className="text-[10px] text-slate-500 font-black uppercase mr-2">RRR</span><span className="text-2xl font-black">{rrr}</span></div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8">
                <div className="flex items-center gap-3 mb-6"><Activity className="w-5 h-5 text-primary" /><h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Striker Unit</h4></div>
                <div className="space-y-4">
                  {[striker, nonStriker].map((name, i) => (
                    <div key={i} className={`flex items-center justify-between p-5 rounded-2xl border ${i === 0 && name ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${i === 0 ? 'bg-primary' : 'bg-slate-800 text-slate-500'}`}>{name ? name[0] : '?'}</div>
                        <div><p className={`font-black tracking-tight ${i === 0 ? 'text-white' : 'text-slate-500'}`}>{name || "Standby..."}</p><p className="text-[9px] font-black text-slate-600 uppercase mt-1">{i === 0 ? "On Strike" : "Ready"}</p></div>
                      </div>
                      {name && battingStats[name] && <div className="text-right"><p className="text-xl font-black">{battingStats[name].runs}</p><p className="text-[10px] font-black text-slate-500">({battingStats[name].balls})</p></div>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8">
                <div className="flex items-center gap-3 mb-6"><Activity className="w-5 h-5 text-primary" /><h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Vector</h4></div>
                <div className={`flex items-center justify-between p-6 rounded-2xl border ${currentBowler ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-xl font-black text-slate-500">{currentBowler ? currentBowler[0] : '?'}</div>
                    <div><p className="text-xl font-black text-white tracking-tight">{currentBowler || "Awaiting Selection"}</p><p className="text-[9px] font-black text-slate-600 uppercase mt-1">Bowler</p></div>
                  </div>
                  {currentBowler && bowlingStats[currentBowler] && <div className="text-right"><p className="text-xl font-black">{bowlingStats[currentBowler].wickets}-{bowlingStats[currentBowler].runs}</p><p className="text-[10px] font-black text-slate-500">({getOvers(bowlingStats[currentBowler].balls)})</p></div>}
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-4 flex flex-col gap-8 min-h-0">
            <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-8 shadow-2xl">
              <div className="text-center h-48 flex flex-col items-center justify-center group">
                {lastRoll ? (
                  <div className="animate-in zoom-in slide-in-from-bottom duration-300">
                    <div className="w-24 h-24 bg-primary text-white text-6xl font-black flex items-center justify-center rounded-[2rem] shadow-4xl shadow-primary/40 border border-white/20 mb-4">{lastRoll}</div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${lastRoll === 5 ? 'text-orange-500' : 'text-slate-500'}`}>{lastRoll === 5 ? 'Critical Danger' : 'Roll Result'}</p>
                  </div>
                ) : <p className="text-slate-700 font-black uppercase text-[10px] tracking-widest animate-pulse">Interface Idle</p>}
              </div>
              <button onClick={rollDice} disabled={showBatterSelect || showBowlerSelect || !striker || !nonStriker || !currentBowler} className="w-full py-8 bg-primary text-white rounded-[2rem] text-3xl font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 disabled:opacity-20 disabled:grayscale transition-all shadow-2xl shadow-primary/30">Activate Roll</button>
            </div>

            <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[3rem] p-8 min-h-0 flex flex-col">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-6">Battle Feed</h4>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {history.map((h, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${h.wicket ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-center gap-4"><span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${h.wicket ? 'bg-red-500' : 'bg-slate-800 text-slate-400'}`}>{h.roll}</span><div><p className="text-xs font-black text-white uppercase">{h.batter}</p></div></div>
                    <p className={`text-sm font-black ${h.wicket ? 'text-red-500' : 'text-primary'}`}>{h.wicket ? "OUT" : `${h.runs} runs`}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </main>
      </div>

      {/* Detailed Scorecard Modal */}
      {showScorecard && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl" onClick={() => setShowScorecard(false)}></div>
          
          <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[3rem] shadow-4xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div>
                <h3 className="text-4xl font-black tracking-tighter uppercase">Match Scorecard</h3>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Tactical Performance Analysis</p>
                <div className="flex gap-4 mt-6">
                  {[1, 2].map(num => (
                    <button 
                      key={num}
                      onClick={() => setSelectedInningsTab(num)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedInningsTab === num ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                    >
                      Innings {num}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setShowScorecard(false)}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              {(() => {
                const isTab1 = selectedInningsTab === 1;
                const tabBattingTeam = isTab1 ? match?.homeTeam : match?.awayTeam;
                const tabBowlingTeam = isTab1 ? match?.awayTeam : match?.homeTeam;
                const tabBattingSquad = (isTab1 ? home11 : away11) || [];
                const tabBowlingSquad = (isTab1 ? away11 : home11) || [];
                
                // Use viewOnlyResults if available, else current state
                let tabBattingStats = isTab1 ? (allStats.innings1Batting || battingStats) : (allStats.innings2Batting || battingStats);
                let tabBowlingStats = isTab1 ? (allStats.innings1Bowling || bowlingStats) : (allStats.innings2Bowling || bowlingStats);

                if (viewOnlyResults?.detailedStats) {
                  tabBattingStats = isTab1 ? viewOnlyResults.detailedStats.innings1Batting : viewOnlyResults.detailedStats.innings2Batting;
                  tabBowlingStats = isTab1 ? viewOnlyResults.detailedStats.innings1Bowling : viewOnlyResults.detailedStats.innings2Bowling;
                }

                if (!tabBattingStats || Object.keys(tabBattingStats).length === 0) {
                  return <div className="text-center py-20 text-slate-500 font-black uppercase tracking-widest">Innings not started</div>;
                }

                const result = viewOnlyResults ? {
                  homeScore: viewOnlyResults.homeScore,
                  awayScore: viewOnlyResults.awayScore,
                  winner: viewOnlyResults.winner
                } : {
                  winner: (innings === 2 && score >= innings1Score + 1) ? battingTeam : 
                          (innings === 2 && (totalBalls >= 120 || wickets >= 10)) ? (score < innings1Score ? bowlingTeam : (score === innings1Score ? 'Tied' : null)) : 
                          null
                };

                return (
                  <>
                    {(result.winner || viewOnlyResults) && (
                      <div className="mb-10 p-8 bg-primary/10 border border-primary/20 rounded-[2rem] text-center">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Final Battle Result</p>
                        <h4 className="text-3xl font-black uppercase tracking-tighter">
                          {result.winner === 'Tied' ? "THE BATTLE ENDED IN A STALEMATE" : `${result.winner?.toUpperCase()} HAS CONQUERED THE ARENA`}
                        </h4>
                      </div>
                    )}
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/3">Batter ({tabBattingTeam})</th>
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">R</th>
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">B</th>
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">4s</th>
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">6s</th>
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">SR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {tabBattingSquad.map(name => {
                          const stats = tabBattingStats[name];
                          if (!stats) return null;
                          const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
                          const isCurrent = !viewOnlyResults && (name === striker || name === nonStriker);
                          
                          return (
                            <tr key={name} className={`group hover:bg-white/[0.02] transition-colors ${isCurrent ? "bg-primary/5" : ""}`}>
                              <td className="py-5">
                                <div className="flex items-center gap-4">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${stats.isOut ? 'bg-slate-800 text-slate-600' : 'bg-primary text-white'}`}>
                                    {name[0]}
                                  </div>
                                  <div>
                                     <p className={`font-black uppercase tracking-tight ${stats.isOut ? 'text-slate-500' : 'text-white'}`}>
                                       {name} {isCurrent && "★"}
                                     </p>
                                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">
                                       {stats.isOut ? (
                                         <span className="text-red-500/80 italic">b {stats.dismissedBy}</span>
                                       ) : isCurrent ? (
                                         "At Crease"
                                       ) : (
                                         "Not Out"
                                       )}
                                     </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-5 text-right font-black text-xl text-white">{stats.runs}</td>
                              <td className="py-5 text-right font-black text-slate-400">{stats.balls}</td>
                              <td className="py-5 text-right font-black text-slate-500">{stats.fours}</td>
                              <td className="py-5 text-right font-black text-slate-500">{stats.sixes}</td>
                              <td className="py-5 text-right font-black text-primary">{sr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div className="mt-12">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 px-2">Bowling Performance: {tabBowlingTeam}</h4>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/3 px-2">Bowler</th>
                            <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">O</th>
                            <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">R</th>
                            <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">W</th>
                            <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">ECON</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {tabBowlingSquad.filter(name => tabBowlingStats[name]?.balls > 0).map(name => {
                            const stats = tabBowlingStats[name];
                            const econ = stats.balls > 0 ? ((stats.runs / stats.balls) * 6).toFixed(2) : "0.00";
                            const isCurrent = !viewOnlyResults && (name === currentBowler);

                            return (
                              <tr key={name} className={`group hover:bg-white/[0.02] transition-colors ${isCurrent ? "bg-primary/5" : ""}`}>
                                <td className="py-4 px-2">
                                  <p className="font-black text-white uppercase text-sm">{name} {isCurrent && "★"}</p>
                                </td>
                                <td className="py-4 text-right font-black text-white text-lg">{getOvers(stats.balls)}</td>
                                <td className="py-4 text-right font-black text-slate-400">{stats.runs}</td>
                                <td className="py-4 text-right font-black text-primary text-lg">{stats.wickets}</td>
                                <td className="py-4 text-right font-black text-slate-500">{econ}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
              
              <div className="mt-10 p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] flex justify-between items-center text-slate-500 font-black text-[10px] uppercase tracking-widest">
                VIEWING COMPLETED MATCH PERFORMANCE
              </div>
            </div>
          </div>
        </div>
      )}

      {!viewOnlyResults && (showBatterSelect || showBowlerSelect) && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl"></div>
          <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-[3rem] shadow-4xl flex flex-col max-h-[80vh]">
            <div className="p-10 border-b border-white/5">
              <h3 className="text-4xl font-black tracking-tighter">{showBatterSelect ? (striker ? "Select Non-Striker" : "Select Striker") : "Select Bowler"}</h3>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">{showBatterSelect ? "Next Offensive Unit" : "Vector Deployment"}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-3">
              {showBatterSelect ? (
                battingSquad.filter(name => (!battingStats[name] || !battingStats[name].isOut) && name !== striker && name !== nonStriker).map(name => (
                  <button key={name} onClick={() => handleBatterSelect(name)} className="w-full flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all text-left">
                    <div className="flex items-center gap-6"><div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-500 border border-white/5">{name[0]}</div><div><p className="text-lg font-black text-white uppercase">{name}</p><p className="text-[10px] font-black text-slate-600 uppercase">{playersMap[name]?.role}</p></div></div>
                    <ChevronRight className="w-6 h-6 text-slate-800" />
                  </button>
                ))
              ) : (
                bowlingSquad.filter(name => (!bowlingStats[name] || bowlingStats[name].balls < 24) && name !== lastBowler).map(name => (
                  <button key={name} onClick={() => handleBowlerSelect(name)} className="w-full flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all text-left">
                    <div className="flex items-center gap-6"><div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-500 border border-white/5">{name[0]}</div><div><p className="text-lg font-black text-white uppercase">{name}</p><p className="text-[10px] font-black text-slate-600 uppercase">{playersMap[name]?.role}</p></div></div>
                    <div className="text-right flex items-center gap-4"><div><p className="text-lg font-black">{bowlingStats[name]?.wickets || 0}-{bowlingStats[name]?.runs || 0}</p><p className="text-[10px] font-black text-slate-500 uppercase">{getOvers(bowlingStats[name]?.balls || 0)} Ovs</p></div><ChevronRight className="w-6 h-6 text-slate-800" /></div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function handleBatterSelect(name: string) {
    // Determine what we need based on current state
    const needsStriker = !striker;
    const needsNonStriker = !nonStriker;

    if (needsStriker && needsNonStriker) {
      // Starting from scratch (Start of Innings) - Need two batters
      setStriker(name);
      // Keep modal open for the second selection
    } else if (needsStriker) {
      // Only Striker was missing (Mid-over wicket or crossover)
      setStriker(name);
      setShowBatterSelect(false);
      if (!currentBowler && (totalBalls % 6 === 0 || totalBalls === 0)) setShowBowlerSelect(true);
    } else if (needsNonStriker) {
      // Only Non-Striker was missing (Over-end wicket or similar)
      setNonStriker(name);
      setShowBatterSelect(false);
      if (!currentBowler && (totalBalls % 6 === 0 || totalBalls === 0)) setShowBowlerSelect(true);
    }
  }

  function handleBowlerSelect(name: string) {
    setCurrentBowler(name);
    setLastBowler(name);
    setShowBowlerSelect(false);
  }
}

