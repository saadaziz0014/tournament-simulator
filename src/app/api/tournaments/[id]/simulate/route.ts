import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import { getAuthUser } from '@/lib/auth';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const tournamentId = (await params).id;
        const tournament = await Tournament.findOne({ _id: tournamentId, userId: user.userId });

        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        const { home11, away11, finalResults } = await req.json();

        const nextMatch = tournament.matches.find((m: any) => !m.isCompleted);
        if (!nextMatch) {
            return NextResponse.json({ message: 'Tournament completed' });
        }

        if (finalResults) {
            // Use results from client-side interactive arena
            nextMatch.homeSquad = home11;
            nextMatch.awaySquad = away11;
            nextMatch.homeScore = finalResults.homeScore;
            nextMatch.homeWickets = finalResults.homeWickets;
            nextMatch.homeOvers = finalResults.homeOvers;
            nextMatch.awayScore = finalResults.awayScore;
            nextMatch.awayWickets = finalResults.awayWickets;
            nextMatch.awayOvers = finalResults.awayOvers;
            nextMatch.winner = finalResults.winner;
            nextMatch.detailedStats = finalResults.detailedStats;
        } else {
            // Match Simulation Logic (Dice-based T20)
            const simulateInnings = (battingSquad: string[], bowlingSquad: string[]) => {
                let totalRuns = 0;
                let totalWickets = 0;
                let ballsDelivered = 0;
                let lastRoll = 0;

                const batStats: Record<string, any> = {};
                battingSquad.forEach(name => {
                    batStats[name] = { name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
                });

                const bowlStats: Record<string, any> = {};
                bowlingSquad.forEach(name => {
                    bowlStats[name] = { name, balls: 0, runs: 0, wickets: 0 };
                });

                let strikerIdx = 0;
                let nonStrikerIdx = 1;

                for (let i = 0; i < 120; i++) {
                    if (totalWickets >= 10) break;

                    ballsDelivered++;
                    const roll = Math.floor(Math.random() * 6) + 1;
                    const isWicket = roll === 5 && lastRoll === 5;
                    const runs = (!isWicket && (roll === 1 || roll === 4 || roll === 6)) ? roll : 0;

                    const striker = battingSquad[strikerIdx];
                    const bowler = bowlingSquad[Math.floor((ballsDelivered - 1) / 6) % bowlingSquad.length];

                    // Update Batting
                    if (striker) {
                        batStats[striker].balls++;
                        batStats[striker].runs += runs;
                        if (runs === 4) batStats[striker].fours++;
                        if (runs === 6) batStats[striker].sixes++;
                    }

                    // Update Bowling
                    if (bowler) {
                        bowlStats[bowler].balls++;
                        bowlStats[bowler].runs += runs;
                    }

                    if (isWicket) {
                        totalWickets++;
                        if (striker) {
                            batStats[striker].isOut = true;
                            batStats[striker].dismissedBy = bowler;
                        }
                        if (bowler) bowlStats[bowler].wickets++;
                        strikerIdx = Math.max(strikerIdx, nonStrikerIdx) + 1;
                        lastRoll = 0;
                    } else {
                        totalRuns += runs;
                        if (runs % 2 !== 0) [strikerIdx, nonStrikerIdx] = [nonStrikerIdx, strikerIdx];
                        lastRoll = roll;
                    }

                    if (ballsDelivered % 6 === 0) [strikerIdx, nonStrikerIdx] = [nonStrikerIdx, strikerIdx];
                }

                const overs = Math.floor(ballsDelivered / 6) + (ballsDelivered % 6) / 10;
                return { totalRuns, totalWickets, overs, batStats, bowlStats };
            };

            const homeInnings = simulateInnings(home11, away11);
            const awayInnings = simulateInnings(away11, home11);

            nextMatch.homeSquad = home11;
            nextMatch.awaySquad = away11;
            nextMatch.homeScore = homeInnings.totalRuns;
            nextMatch.homeWickets = homeInnings.totalWickets;
            nextMatch.homeOvers = homeInnings.overs;

            nextMatch.awayScore = awayInnings.totalRuns;
            nextMatch.awayWickets = awayInnings.totalWickets;
            nextMatch.awayOvers = awayInnings.overs;

            nextMatch.detailedStats = {
                innings1Batting: homeInnings.batStats,
                innings1Bowling: awayInnings.bowlStats,
                innings2Batting: awayInnings.batStats,
                innings2Bowling: homeInnings.bowlStats
            };

            if (nextMatch.homeScore > nextMatch.awayScore) {
                nextMatch.winner = nextMatch.homeTeam;
            } else if (nextMatch.awayScore > nextMatch.homeScore) {
                nextMatch.winner = nextMatch.awayTeam;
            } else {
                nextMatch.winner = 'Tied';
            }
        }

        nextMatch.isCompleted = true;

        // Update Teams Points Table
        const homeTeam = tournament.teams.find((t: any) => t.name === nextMatch.homeTeam);
        const awayTeam = tournament.teams.find((t: any) => t.name === nextMatch.awayTeam);

        if (homeTeam && awayTeam) {
            homeTeam.played += 1;
            awayTeam.played += 1;

            if (nextMatch.winner === homeTeam.name) {
                homeTeam.won += 1;
                homeTeam.points += 2;
                awayTeam.lost += 1;
            } else if (nextMatch.winner === awayTeam.name) {
                awayTeam.won += 1;
                awayTeam.points += 2;
                homeTeam.lost += 1;
            } else {
                homeTeam.tied += 1;
                awayTeam.tied += 1;
                homeTeam.points += 1;
                awayTeam.points += 1;
            }

            // Proper Net Run Rate (NRR) Calculation
            const homeScore = nextMatch.homeScore;
            const awayScore = nextMatch.awayScore;
            // NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)

            // Simplified incremental NRR update
            const homeNRR = (homeScore / 20) - (awayScore / 20);
            homeTeam.nrr += homeNRR;
            awayTeam.nrr -= homeNRR;
        }

        await tournament.save();
        return NextResponse.json({ message: 'Match results recorded', match: nextMatch });
    } catch (error: any) {
        console.error('Simulation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
