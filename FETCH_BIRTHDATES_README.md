# Fetch Player Birthdates Script

This Python script fetches current NBA players from the BallDontLie API and looks up their birthdates from NBA.com using the `nba_api` package.

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Ensure your `.env` file has the BallDontLie API key:**
   ```bash
   BALLDONTLIE_KEY=your_api_key_here
   BALLDONTLIE_BASE=https://api.balldontlie.io/v1
   ```

## Usage

Run the script:
```bash
python fetch-player-birthdates.py
```

Or if you made it executable:
```bash
./fetch-player-birthdates.py
```

## What it does

1. Fetches all current NBA players from BallDontLie API (to get their API IDs)
2. Matches players with NBA.com using the `nba_api` package
3. Fetches birthdates from NBA.com's official API
4. Outputs two files:
   - `player-birthdates-output.ts` - TypeScript constants file format
   - `player-birthdates.json` - JSON format for easy inspection

## Next Steps

1. Review the output file (`player-birthdates-output.ts`)
2. Copy the contents to `src/etl/constants/player-birthdates.ts`
3. Manually add any missing players if needed (some players may not match or have missing data)

## Notes

- The script uses the official `nba_api` package which accesses NBA.com's APIs
- Rate limiting is included to be respectful to the APIs
- Some players may not match due to name variations (e.g., Jr., III, etc.)
- For missing players, you can manually look them up and add to the constants file

