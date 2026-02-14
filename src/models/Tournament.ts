import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
    name: String,
    role: String,
    country: String,
});

const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    players: [PlayerSchema],
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    tied: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    nrr: { type: Number, default: 0 },
});

const MatchSchema = new mongoose.Schema({
    homeTeam: String,
    awayTeam: String,
    homeScore: { type: Number, default: 0 },
    awayScore: { type: Number, default: 0 },
    homeWickets: { type: Number, default: 0 },
    awayWickets: { type: Number, default: 0 },
    homeOvers: { type: Number, default: 0 },
    awayOvers: { type: Number, default: 0 },
    winner: String, // Team name or 'Tied' or null if not played
    isCompleted: { type: Boolean, default: false },
    matchNumber: Number,
    homeSquad: [String],
    awaySquad: [String],
    detailedStats: { type: mongoose.Schema.Types.Mixed, default: null }
});

const TournamentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    teams: [TeamSchema],
    matches: [MatchSchema],
}, { timestamps: true });

export default mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);
