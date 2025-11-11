/**
 * Example Queries with Drizzle Relations
 * Demonstrates how to use the relational API for joins
 */
export declare function getTeamWithPlayers(teamId: number): Promise<{
    id: number;
    apiId: number;
    name: string;
    abbreviation: string;
    city: string;
    conference: string;
    division: string;
    players: {
        id: number;
        apiId: number;
        fullName: string;
        firstName: string;
        lastName: string;
        teamId: number | null;
        position: string | null;
        height: string | null;
        weight: string | null;
        college: string | null;
        draftYear: number | null;
        birthdate: string | null;
    }[];
} | undefined>;
export declare function getPlayerWithStats(playerId: number): Promise<{
    id: number;
    apiId: number;
    fullName: string;
    firstName: string;
    lastName: string;
    teamId: number | null;
    position: string | null;
    height: string | null;
    weight: string | null;
    college: string | null;
    draftYear: number | null;
    birthdate: string | null;
    boxScores: {
        id: number;
        teamId: number;
        gameId: number;
        playerId: number;
        minutes: number | null;
        points: number | null;
        assists: number | null;
        rebounds: number | null;
        steals: number | null;
        blocks: number | null;
        turnovers: number | null;
        fgm: number | null;
        fga: number | null;
        tpm: number | null;
        tpa: number | null;
        ftm: number | null;
        fta: number | null;
        game: {
            date: string;
            id: number;
            apiId: number;
            season: number;
            homeTeamId: number;
            awayTeamId: number;
            homeScore: number | null;
            awayScore: number | null;
            homeTeam: {
                id: number;
                apiId: number;
                name: string;
                abbreviation: string;
                city: string;
                conference: string;
                division: string;
            };
            awayTeam: {
                id: number;
                apiId: number;
                name: string;
                abbreviation: string;
                city: string;
                conference: string;
                division: string;
            };
        };
    }[];
    team: {
        id: number;
        apiId: number;
        name: string;
        abbreviation: string;
        city: string;
        conference: string;
        division: string;
    } | null;
} | undefined>;
export declare function getGameWithAllStats(gameId: number): Promise<{
    date: string;
    id: number;
    apiId: number;
    season: number;
    homeTeamId: number;
    awayTeamId: number;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: {
        id: number;
        apiId: number;
        name: string;
        abbreviation: string;
        city: string;
        conference: string;
        division: string;
    };
    awayTeam: {
        id: number;
        apiId: number;
        name: string;
        abbreviation: string;
        city: string;
        conference: string;
        division: string;
    };
    boxScores: {
        id: number;
        teamId: number;
        gameId: number;
        playerId: number;
        minutes: number | null;
        points: number | null;
        assists: number | null;
        rebounds: number | null;
        steals: number | null;
        blocks: number | null;
        turnovers: number | null;
        fgm: number | null;
        fga: number | null;
        tpm: number | null;
        tpa: number | null;
        ftm: number | null;
        fta: number | null;
        team: {
            id: number;
            apiId: number;
            name: string;
            abbreviation: string;
            city: string;
            conference: string;
            division: string;
        };
        player: {
            id: number;
            apiId: number;
            fullName: string;
            firstName: string;
            lastName: string;
            teamId: number | null;
            position: string | null;
            height: string | null;
            weight: string | null;
            college: string | null;
            draftYear: number | null;
            birthdate: string | null;
        };
    }[];
} | undefined>;
export declare function getSeasonGames(season: number): Promise<{
    date: string;
    id: number;
    apiId: number;
    season: number;
    homeTeamId: number;
    awayTeamId: number;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: {
        id: number;
        apiId: number;
        name: string;
        abbreviation: string;
        city: string;
        conference: string;
        division: string;
    };
    awayTeam: {
        id: number;
        apiId: number;
        name: string;
        abbreviation: string;
        city: string;
        conference: string;
        division: string;
    };
}[]>;
export declare function getPlayerSeasonStats(playerId: number, season: number): Promise<{
    id: number;
    teamId: number;
    gameId: number;
    playerId: number;
    minutes: number | null;
    points: number | null;
    assists: number | null;
    rebounds: number | null;
    steals: number | null;
    blocks: number | null;
    turnovers: number | null;
    fgm: number | null;
    fga: number | null;
    tpm: number | null;
    tpa: number | null;
    ftm: number | null;
    fta: number | null;
    team: {
        id: number;
        apiId: number;
        name: string;
        abbreviation: string;
        city: string;
        conference: string;
        division: string;
    };
    game: {
        date: string;
        id: number;
        apiId: number;
        season: number;
        homeTeamId: number;
        awayTeamId: number;
        homeScore: number | null;
        awayScore: number | null;
        homeTeam: {
            id: number;
            apiId: number;
            name: string;
            abbreviation: string;
            city: string;
            conference: string;
            division: string;
        };
        awayTeam: {
            id: number;
            apiId: number;
            name: string;
            abbreviation: string;
            city: string;
            conference: string;
            division: string;
        };
    };
    player: {
        id: number;
        apiId: number;
        fullName: string;
        firstName: string;
        lastName: string;
        teamId: number | null;
        position: string | null;
        height: string | null;
        weight: string | null;
        college: string | null;
        draftYear: number | null;
        birthdate: string | null;
    };
}[]>;
export declare function getTopScorersInGame(gameId: number, limit?: number): Promise<{
    teams: {
        id: number;
        apiId: number;
        name: string;
        abbreviation: string;
        city: string;
        conference: string;
        division: string;
    };
    players: {
        id: number;
        apiId: number;
        fullName: string;
        firstName: string;
        lastName: string;
        teamId: number | null;
        position: string | null;
        height: string | null;
        weight: string | null;
        college: string | null;
        draftYear: number | null;
        birthdate: string | null;
    };
    box_scores: {
        id: number;
        gameId: number;
        playerId: number;
        teamId: number;
        minutes: number | null;
        points: number | null;
        assists: number | null;
        rebounds: number | null;
        steals: number | null;
        blocks: number | null;
        turnovers: number | null;
        fgm: number | null;
        fga: number | null;
        tpm: number | null;
        tpa: number | null;
        ftm: number | null;
        fta: number | null;
    };
}[]>;
export declare function getPlayersByPosition(position: string): Promise<{
    id: number;
    apiId: number;
    fullName: string;
    firstName: string;
    lastName: string;
    teamId: number | null;
    position: string | null;
    height: string | null;
    weight: string | null;
    college: string | null;
    draftYear: number | null;
    birthdate: string | null;
    team: {
        id: number;
        apiId: number;
        name: string;
        abbreviation: string;
        city: string;
        conference: string;
        division: string;
    } | null;
}[]>;
export declare function getTeamSeasonRecord(teamId: number, season: number): Promise<{
    homeGames: {
        date: string;
        id: number;
        apiId: number;
        season: number;
        homeTeamId: number;
        awayTeamId: number;
        homeScore: number | null;
        awayScore: number | null;
        homeTeam: {
            id: number;
            apiId: number;
            name: string;
            abbreviation: string;
            city: string;
            conference: string;
            division: string;
        };
        awayTeam: {
            id: number;
            apiId: number;
            name: string;
            abbreviation: string;
            city: string;
            conference: string;
            division: string;
        };
    }[];
    awayGames: {
        date: string;
        id: number;
        apiId: number;
        season: number;
        homeTeamId: number;
        awayTeamId: number;
        homeScore: number | null;
        awayScore: number | null;
        homeTeam: {
            id: number;
            apiId: number;
            name: string;
            abbreviation: string;
            city: string;
            conference: string;
            division: string;
        };
        awayTeam: {
            id: number;
            apiId: number;
            name: string;
            abbreviation: string;
            city: string;
            conference: string;
            division: string;
        };
    }[];
    totalGames: number;
}>;
//# sourceMappingURL=example-queries.d.ts.map