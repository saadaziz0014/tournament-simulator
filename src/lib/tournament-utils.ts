export function generateDoubleRoundRobin(teams: string[]) {
    const matches = [];
    const n = teams.length;

    // Single Round Robin
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            matches.push({
                homeTeam: teams[i],
                awayTeam: teams[j],
                matchNumber: 0, // Will assign later
            });
        }
    }

    // Second Leg
    const secondLeg = matches.map(m => ({
        homeTeam: m.awayTeam,
        awayTeam: m.homeTeam,
        matchNumber: 0,
    }));

    const allMatches = [...matches, ...secondLeg];

    // Shuffle to make it look realistic
    for (let i = allMatches.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allMatches[i], allMatches[j]] = [allMatches[j], allMatches[i]];
    }

    return allMatches.map((m, index) => ({
        ...m,
        matchNumber: index + 1
    }));
}
