import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import dbConnect from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import { getAuthUser } from '@/lib/auth';
import { generateDoubleRoundRobin } from '@/lib/tournament-utils';

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Tournament name is required' }, { status: 400 });
        }

        // Read the_data.json
        const filePath = path.join(process.cwd(), 'the_data.json');
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const { teams: rawTeams } = jsonData;

        const initializedTeams = rawTeams.map((t: any) => ({
            name: t.name,
            players: t.players,
            played: 0,
            won: 0,
            lost: 0,
            tied: 0,
            points: 0,
            nrr: 0,
        }));

        const teamNames = rawTeams.map((t: any) => t.name);
        const generatedMatches = generateDoubleRoundRobin(teamNames);

        const tournament = await Tournament.create({
            name,
            userId: user.userId,
            teams: initializedTeams,
            matches: generatedMatches,
        });

        return NextResponse.json(tournament, { status: 201 });
    } catch (error: any) {
        console.error('Tournament creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const tournaments = await Tournament.find({ userId: user.userId }).sort({ createdAt: -1 });
        return NextResponse.json(tournaments);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
