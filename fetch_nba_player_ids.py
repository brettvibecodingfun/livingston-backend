#!/usr/bin/env python3
"""
Fetch NBA player IDs from NBA.com API and save to CSV file
This script queries the NBA stats API to get all current players and their IDs
"""

import requests
import csv
import time
import sys

NBA_API_URL = "https://stats.nba.com/stats/commonallplayers"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer": "https://www.nba.com/",
    "Origin": "https://www.nba.com"
}

def fetch_player_ids(season="2024-25", only_current=True):
    """
    Fetch player data from NBA API
    
    Args:
        season: NBA season (e.g., "2024-25", "2025-26")
        only_current: If True, only fetch players from current season
    
    Returns:
        List of player dictionaries with name, personId, and team
    """
    params = {
        "LeagueID": "00",
        "Season": season,
        "IsOnlyCurrentSeason": "1" if only_current else "0"
    }
    print(f"📡 Fetching player data for season {season} (current-only: {only_current})...")
    
    try:
        response = requests.get(NBA_API_URL, headers=HEADERS, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if not data.get("resultSets") or len(data["resultSets"]) == 0:
            print("❌ No data returned from API")
            return []
        
        rows = data["resultSets"][0]["rowSet"]
        headers = data["resultSets"][0]["headers"]
        
        idx_person_id = headers.index("PERSON_ID")
        idx_player_name = headers.index("DISPLAY_FIRST_LAST")
        idx_team = headers.index("TEAM_CITY") if "TEAM_CITY" in headers else None
        idx_team_name = headers.index("TEAM_NAME") if "TEAM_NAME" in headers else None
        
        players = []
        for row in rows:
            person_id = row[idx_person_id]
            player_name = row[idx_player_name]
            team = ""
            if idx_team is not None and idx_team_name is not None:
                if row[idx_team] and row[idx_team_name]:
                    team = f"{row[idx_team]} {row[idx_team_name]}"
            players.append({
                "name": player_name,
                "personId": str(person_id),
                "team": team
            })
        
        print(f"✅ Fetched {len(players)} players")
        return players
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching player data: {e}")
        return []
    except (KeyError, IndexError, ValueError) as e:
        print(f"❌ Error parsing API response: {e}")
        return []

def write_player_ids_to_csv(players, output_path="nba_player_ids.csv"):
    """
    Write player data to CSV file
    
    Args:
        players: List of player dictionaries
        output_path: Path to output CSV file
    """
    if not players:
        print("❌ No players to write")
        return
    
    print(f"📝 Writing {len(players)} players to {output_path}...")
    try:
        with open(output_path, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(["Name", "PersonID", "Team", "HeadshotURL"])
            for player in players:
                headshot_url = f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player['personId']}.png"
                writer.writerow([player["name"], player["personId"], player["team"], headshot_url])
        print(f"✅ Successfully wrote {len(players)} players to {output_path}")
    except IOError as e:
        print(f"❌ Error writing to file: {e}")

if __name__ == "__main__":
    # Allow season to be passed as command line argument
    season = sys.argv[1] if len(sys.argv) > 1 else "2024-25"
    output_file = sys.argv[2] if len(sys.argv) > 2 else "nba_player_ids.csv"
    
    print("🏀 NBA Player ID Fetcher")
    print("=" * 50)
    
    players = fetch_player_ids(season=season, only_current=True)
    
    if players:
        write_player_ids_to_csv(players, output_file)
        print(f"\n✅ Complete! Player IDs saved to {output_file}")
    else:
        print("\n❌ Failed to fetch player data")
        sys.exit(1)
    
    # Be kind to the API
    time.sleep(1)
