import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import { getAuthUser } from '@/lib/auth';

export async function GET(
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

        return NextResponse.json(tournament);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
