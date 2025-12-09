#!/usr/bin/env python3
"""
Fetch NBA Player Birthdates Script

This script fetches current NBA players from BallDontLie API and looks up
their birthdates from NBA.com using the nba_api package, then outputs them
in the format needed for the constants file.

Requirements:
    pip install nba_api requests python-dotenv

Usage:
    python fetch-player-birthdates.py
"""

import os
import sys
import json
import time
from typing import Dict, Optional
from datetime import datetime

try:
    import requests
    from dotenv import load_dotenv
    from nba_api.stats.static import players
    from nba_api.stats.endpoints import commonplayerinfo
except ImportError as e:
    print(f"❌ Missing required package: {e}")
    print("Please install with: pip install nba_api requests python-dotenv")
    sys.exit(1)

# Load environment variables
load_dotenv()

BALLDONTLIE_BASE = os.getenv('BALLDONTLIE_BASE', 'https://api.balldontlie.io/v1')
BALLDONTLIE_KEY = os.getenv('BALLDONTLIE_KEY')

if not BALLDONTLIE_KEY:
    print("⚠️  Warning: BALLDONTLIE_KEY not set - API requests may fail")

# Headers for requests
HEADERS = {
    'Accept': 'application/json',
}

if BALLDONTLIE_KEY:
    HEADERS['Authorization'] = BALLDONTLIE_KEY


def fetch_players_from_api() -> list:
    """Fetch all current NBA players from BallDontLie API."""
    print("📡 Fetching players from BallDontLie API...")
    
    players_list = []
    cursor = None
    page = 1
    
    while True:
        url = f"{BALLDONTLIE_BASE}/players/active"
        params = {'per_page': 100}
        if cursor:
            params['cursor'] = cursor
        
        try:
            response = requests.get(url, headers=HEADERS, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            page_players = data.get('data', [])
            players_list.extend(page_players)
            
            print(f"  📄 Page {page}: {len(page_players)} players (total: {len(players_list)})")
            
            meta = data.get('meta', {})
            cursor = meta.get('next_cursor')
            
            if not cursor:
                break
            
            page += 1
            time.sleep(0.3)  # Rate limiting
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error fetching players: {e}")
            break
    
    print(f"✅ Fetched {len(players_list)} players from API\n")
    return players_list


def normalize_name(name: str) -> str:
    """Normalize player name for matching (lowercase, remove special chars)."""
    return name.lower().strip().replace("'", "").replace("-", " ").replace(".", "")


def find_nba_api_player_id(balldontlie_player: dict, nba_players: list) -> Optional[int]:
    """
    Find NBA API player ID by matching name with BallDontLie player.
    Returns NBA player ID if found, None otherwise.
    """
    first_name = balldontlie_player.get('first_name', '').strip()
    last_name = balldontlie_player.get('last_name', '').strip()
    full_name = f"{first_name} {last_name}"
    
    # Normalize names for matching
    normalized_first = normalize_name(first_name)
    normalized_last = normalize_name(last_name)
    normalized_full = normalize_name(full_name)
    
    # Try exact match first
    for nba_player in nba_players:
        nba_first = normalize_name(nba_player.get('first_name', ''))
        nba_last = normalize_name(nba_player.get('last_name', ''))
        nba_full = normalize_name(f"{nba_player.get('first_name', '')} {nba_player.get('last_name', '')}")
        
        # Exact match
        if (nba_first == normalized_first and nba_last == normalized_last):
            return nba_player.get('id')
        
        # Try matching full name
        if nba_full == normalized_full:
            return nba_player.get('id')
    
    # Try partial matches (in case of name variations)
    for nba_player in nba_players:
        nba_first = normalize_name(nba_player.get('first_name', ''))
        nba_last = normalize_name(nba_player.get('last_name', ''))
        
        # Match if first name starts match and last name matches
        if (nba_first.startswith(normalized_first[:3]) and nba_last == normalized_last):
            return nba_player.get('id')
        
        # Match if last name matches and first name starts match
        if (nba_first == normalized_first and nba_last.startswith(normalized_last[:3])):
            return nba_player.get('id')
    
    return None


def get_player_birthdate_from_nba_api(nba_player_id: int) -> Optional[str]:
    """
    Get player birthdate from NBA API using player ID.
    Returns birthdate in YYYY-MM-DD format or None if not found.
    """
    try:
        player_info = commonplayerinfo.CommonPlayerInfo(player_id=nba_player_id)
        player_dict = player_info.get_dict()
        
        # The birthdate is usually in the 'resultSets' -> 'CommonPlayerInfo' -> first row
        result_sets = player_dict.get('resultSets', [])
        for result_set in result_sets:
            if result_set.get('name') == 'CommonPlayerInfo':
                rows = result_set.get('rowSet', [])
                if rows and len(rows) > 0:
                    # Get headers to find birthdate column
                    headers = result_set.get('headers', [])
                    try:
                        birthdate_idx = headers.index('BIRTHDATE')
                        birthdate = rows[0][birthdate_idx]
                        
                        if birthdate:
                            # Convert to YYYY-MM-DD format
                            # NBA API returns dates in various formats, try to parse
                            if isinstance(birthdate, str):
                                # Try parsing different date formats
                                for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%m-%d-%Y', '%Y/%m/%d']:
                                    try:
                                        dt = datetime.strptime(birthdate, fmt)
                                        return dt.strftime('%Y-%m-%d')
                                    except ValueError:
                                        continue
                            return birthdate
                    except (ValueError, IndexError):
                        # Birthdate column not found or index error
                        pass
        
        time.sleep(0.6)  # Rate limiting
        return None
        
    except Exception as e:
        # Silently handle errors (player not found, API errors, etc.)
        return None


def fetch_birthdates_for_players(ball_dont_lie_players: list) -> Dict[int, str]:
    """
    Fetch birthdates for all players using NBA API.
    Returns dict mapping BallDontLie API ID to birthdate (YYYY-MM-DD).
    """
    print("🔍 Loading NBA players from nba_api...")
    
    # Get all NBA players from nba_api static data
    try:
        nba_players_list = players.get_players()
        print(f"  ✅ Loaded {len(nba_players_list)} players from NBA API\n")
    except Exception as e:
        print(f"  ❌ Error loading NBA players: {e}")
        return {}
    
    print("🔍 Matching players and fetching birthdates from NBA API...")
    print("   (This may take a while due to rate limiting)\n")
    
    birthdates = {}
    found = 0
    not_found = 0
    matched = 0
    
    for i, bdl_player in enumerate(ball_dont_lie_players, 1):
        api_id = bdl_player.get('id')
        first_name = bdl_player.get('first_name', '')
        last_name = bdl_player.get('last_name', '')
        full_name = f"{first_name} {last_name}"
        
        if not api_id:
            continue
        
        print(f"  [{i}/{len(ball_dont_lie_players)}] {full_name} (ID: {api_id})...", end=' ', flush=True)
        
        # Find matching NBA API player ID
        nba_player_id = find_nba_api_player_id(bdl_player, nba_players_list)
        
        if not nba_player_id:
            not_found += 1
            print("❌ No match found in NBA API")
            continue
        
        matched += 1
        print(f"Matched (NBA ID: {nba_player_id})...", end=' ', flush=True)
        
        # Get birthdate from NBA API
        birthdate = get_player_birthdate_from_nba_api(nba_player_id)
        
        if birthdate:
            birthdates[api_id] = birthdate
            found += 1
            print(f"✅ {birthdate}")
        else:
            not_found += 1
            print("❌ Birthdate not found")
        
        # Rate limiting
        time.sleep(0.8)
    
    print(f"\n✅ Matched {matched} players")
    print(f"✅ Found {found} birthdates")
    print(f"❌ Not found: {not_found} birthdates\n")
    
    return birthdates


def output_constants_file(birthdates: Dict[int, str], output_file: str = 'player-birthdates-output.ts'):
    """Output birthdates in the format needed for the constants file."""
    print(f"📝 Writing output to {output_file}...")
    
    with open(output_file, 'w') as f:
        f.write("/**\n")
        f.write(" * Player Birthdates Constants\n")
        f.write(" * \n")
        f.write(" * This file contains birthdates for NBA players keyed by their API ID.\n")
        f.write(" * Generated by fetch-player-birthdates.py using nba_api\n")
        f.write(" * \n")
        f.write(" * Format: YYYY-MM-DD (ISO date string)\n")
        f.write(" */\n\n")
        f.write("export const PLAYER_BIRTHDATES: Record<number, string> = {\n")
        
        # Sort by API ID for easier reading
        for api_id in sorted(birthdates.keys()):
            birthdate = birthdates[api_id]
            f.write(f"  {api_id}: '{birthdate}',\n")
        
        f.write("};\n")
    
    print(f"✅ Output written to {output_file}\n")


def main():
    """Main function."""
    print("🏀 NBA Player Birthdate Fetcher (using nba_api)")
    print("=" * 50 + "\n")
    
    # Fetch players from BallDontLie API
    ball_dont_lie_players = fetch_players_from_api()
    
    if not ball_dont_lie_players:
        print("❌ No players fetched. Exiting.")
        return
    
    # Fetch birthdates using NBA API
    birthdates = fetch_birthdates_for_players(ball_dont_lie_players)
    
    if not birthdates:
        print("❌ No birthdates found. Exiting.")
        return
    
    # Output results
    output_constants_file(birthdates)
    
    # Also output JSON for easy inspection
    json_file = 'player-birthdates.json'
    with open(json_file, 'w') as f:
        json.dump(birthdates, f, indent=2, sort_keys=True)
    print(f"📄 Also saved JSON format to {json_file}")
    
    print("\n✨ Done!")
    print("\nNext steps:")
    print("1. Review the output file")
    print("2. Copy the contents to src/etl/constants/player-birthdates.ts")
    print("3. Manually add any missing players if needed")


if __name__ == '__main__':
    main()
