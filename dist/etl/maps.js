/**
 * Map API team to DB team shape
 */
export function mapTeamToDb(apiTeam) {
    return {
        apiId: apiTeam.id,
        name: apiTeam.name,
        abbreviation: apiTeam.abbreviation,
        city: apiTeam.city,
        conference: apiTeam.conference,
        division: apiTeam.division,
    };
}
/**
 * Map API player to DB player shape
 * Note: teamId will be resolved separately via team api_id lookup
 */
export function mapPlayerToDb(apiPlayer, teamId) {
    return {
        apiId: apiPlayer.id,
        fullName: `${apiPlayer.first_name} ${apiPlayer.last_name}`,
        firstName: apiPlayer.first_name,
        lastName: apiPlayer.last_name,
        teamId: teamId,
        position: apiPlayer.position,
        height: apiPlayer.height,
        weight: apiPlayer.weight,
        birthdate: undefined, // API doesn't provide birthdate
    };
}
/**
 * Map API game to DB game shape
 * Note: homeTeamId and awayTeamId will be resolved via team api_id lookup
 */
export function mapGameToDb(apiGame, homeTeamId, awayTeamId) {
    return {
        apiId: apiGame.id,
        season: apiGame.season,
        date: apiGame.date,
        homeTeamId: homeTeamId,
        awayTeamId: awayTeamId,
        homeScore: apiGame.home_team_score,
        awayScore: apiGame.visitor_team_score,
    };
}
/**
 * Map API box score to DB box score shape
 * Note: gameId, playerId, and teamId will be resolved via api_id lookup
 *
 * Normalizes stats:
 * - Combines oreb + dreb into rebounds
 * - Maps fg3m/fg3a to tpm/tpa
 * - Converts minutes string to decimal number
 */
export function mapBoxScoreToDb(apiBoxScore, gameId, playerId, teamId) {
    // Parse minutes from "MM:SS" to decimal
    let minutes = null;
    if (apiBoxScore.min) {
        const parts = apiBoxScore.min.split(':');
        if (parts.length === 2) {
            const mins = parseInt(parts[0] || '0', 10);
            const secs = parseInt(parts[1] || '0', 10);
            minutes = mins + (secs / 60);
        }
    }
    // Combine offensive and defensive rebounds
    const rebounds = (apiBoxScore.oreb || 0) + (apiBoxScore.dreb || 0);
    return {
        gameId: gameId,
        playerId: playerId,
        teamId: teamId,
        minutes: minutes,
        points: apiBoxScore.pts,
        assists: apiBoxScore.ast,
        rebounds: rebounds > 0 ? rebounds : null,
        steals: apiBoxScore.stl,
        blocks: apiBoxScore.blk,
        turnovers: apiBoxScore.turnover,
        fgm: apiBoxScore.fgm,
        fga: apiBoxScore.fga,
        tpm: apiBoxScore.fg3m, // three-pointers made
        tpa: apiBoxScore.fg3a, // three-pointers attempted
        ftm: apiBoxScore.ftm,
        fta: apiBoxScore.fta,
    };
}
//# sourceMappingURL=maps.js.map