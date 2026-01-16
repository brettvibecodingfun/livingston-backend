# needed libraries
from urllib.request import urlopen
from bs4 import BeautifulSoup
import pandas as pd
## Importing Necessary Modules
import requests # to get image from the web
import shutil # to save it locally
# URL to scrape


'''
url = "https://www.basketball-reference.com/leagues/NBA_2023_per_game.html#per_game_stats"

playerURL = "https://www.basketball-reference.com/players/a/antetgi01.html"

# collect HTML data
html = urlopen(url)
htmlPlayer = urlopen(playerURL)

# create beautiful soup object from HTML
soup = BeautifulSoup(html, features="lxml")
soupPlayer = BeautifulSoup(htmlPlayer, features = "lxml")

# use getText()to extract the headers into a list
headers = [th.getText() for th in soup.findAll('tr', limit=2)[1].findAll('th')]


# get rows from table
rows = soup.findAll('tr')
rows_data = [[td.getText() for td in rows[i].findAll('td')]
                    for i in range(len(rows))]

rowsPlayer = soupPlayer.findAll('tr')
rows_data_player = [[td.getText() for img in rowsPlayer[i].findAll('src')]
                    for i in range(len(rowsPlayer))]
'''

import urllib.request
import csv

filename = 'nba_player_ids.csv'
with open(filename) as csvfile:
    readCSV = csv.reader(csvfile, delimiter = ',')
    for row in readCSV:
        image_url = "https://cdn.nba.com/headshots/nba/latest/1040x760/" + row[1] + ".png"
        image_filename =  "playerHeadshots/" + row[0]  + ".jpg";

        # Open the url image, set stream to True, this will return the stream content.
        r = requests.get(image_url, stream = True)

        # Check if the image was retrieved successfully
        if r.status_code == 200:
            # Set decode_content value to True, otherwise the downloaded image file's size will be zero.
            r.raw.decode_content = True

            # Open a local file with wb ( write binary ) permission.
            with open(image_filename,'wb') as f:
                shutil.copyfileobj(r.raw, f)

            print('Image sucessfully Downloaded: ',row[0])
        else:
            print('Image Couldn\'t be retreived for' + row[0])

'''
import urllib.request
import json
with urllib.request.urlopen("https://data.nba.net/data/10s/prod/v1/2026/players.json") as url:
    data = json.load(url)
    # print(data['league']['standard'][0]['personId'])
    for row in data['league']['standard']:
        image_url = "https://cdn.nba.com/headshots/nba/latest/260x190/" + row['personId'] + ".png"
        filename = "playerHeadshots/" + row['firstName'] + row['lastName'] + ".png"

        # Open the url image, set stream to True, this will return the stream content.
        r = requests.get(image_url, stream = True)

        # Check if the image was retrieved successfully
        if r.status_code == 200:
            # Set decode_content value to True, otherwise the downloaded image file's size will be zero.
            r.raw.decode_content = True

            # Open a local file with wb ( write binary ) permission.
            with open(filename,'wb') as f:
                shutil.copyfileobj(r.raw, f)

            print('Image sucessfully Downloaded: ',filename)
        else:
            print('Image Couldn\'t be retreived for' + row['firstName'] + ' ' + row['lastName'])



## Set up the image URL and filename
image_url = "https://www.basketball-reference.com/req/202106291/images/players/gilgesh01.jpg"
filename = image_url.split("/")[-1]

# Open the url image, set stream to True, this will return the stream content.
r = requests.get(image_url, stream = True)

# Check if the image was retrieved successfully
if r.status_code == 200:
    # Set decode_content value to True, otherwise the downloaded image file's size will be zero.
    r.raw.decode_content = True

    # Open a local file with wb ( write binary ) permission.
    with open(filename,'wb') as f:
        shutil.copyfileobj(r.raw, f)

    print('Image sucessfully Downloaded: ',filename)
else:
    print('Image Couldn\'t be retreived')


import requests
import csv
import time

NBA_API_URL = "https://stats.nba.com/stats/commonallplayers"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer": "https://www.nba.com/",
    "Origin": "https://www.nba.com"
}

def fetch_player_ids(season="2024-25", only_current=True):
    params = {
        "LeagueID": "00",
        "Season": season,
        "IsOnlyCurrentSeason": "1" if only_current else "0"
    }
    print(f"Fetching player data for season {season} (current-only: {only_current})...")
    response = requests.get(NBA_API_URL, headers=HEADERS, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()
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
    return players

def write_player_ids_to_csv(players, output_path="nba_player_ids.csv"):
    print(f"Writing {len(players)} players to {output_path}...")
    with open(output_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["Name", "PersonID", "Team", "HeadshotURL"])
        for player in players:
            headshot_url = f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player['personId']}.png"
            writer.writerow([player["name"], player["personId"], player["team"], headshot_url])
    print("✅ Done!")

if __name__ == "__main__":
    players = fetch_player_ids(season="2025-26", only_current=True)
    write_player_ids_to_csv(players)
    # Optional: pause to be kind to the API, or add additional seasons if you need historical IDs
    time.sleep(1)

'''