#!/usr/bin/env python3
"""
Download NBA player headshots from NBA.com CDN
Reads player IDs from a CSV file and downloads headshot images
"""

import requests
import shutil
import csv
import os
from pathlib import Path

def download_player_headshots(csv_filename='nba_player_ids.csv', output_dir='playerHeadshots'):
    """
    Download player headshots from NBA.com CDN based on player IDs in CSV file
    
    Args:
        csv_filename: Path to CSV file with columns: Name, PersonID (or similar)
        output_dir: Directory to save downloaded images
    """
    # Create output directory if it doesn't exist
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    if not os.path.exists(csv_filename):
        print(f"❌ Error: CSV file '{csv_filename}' not found")
        return
    
    downloaded_count = 0
    failed_count = 0
    
    with open(csv_filename, 'r', encoding='utf-8') as csvfile:
        readCSV = csv.reader(csvfile, delimiter=',')
        
        # Skip header row if present
        headers = next(readCSV, None)
        
        # Try to find PersonID column index
        person_id_idx = 1  # Default to second column
        name_idx = 0  # Default to first column
        
        if headers:
            try:
                person_id_idx = headers.index('PersonID')
            except ValueError:
                try:
                    person_id_idx = headers.index('personId')
                except ValueError:
                    pass
            
            try:
                name_idx = headers.index('Name')
            except ValueError:
                pass
        
        for row in readCSV:
            if len(row) < 2:
                continue
                
            person_id = row[person_id_idx].strip()
            player_name = row[name_idx].strip() if len(row) > name_idx else person_id
            
            # Construct image URL
            image_url = f"https://cdn.nba.com/headshots/nba/latest/1040x760/{person_id}.png"
            image_filename = os.path.join(output_dir, f"{player_name.replace(' ', '_')}.jpg")
            
            # Skip if file already exists
            if os.path.exists(image_filename):
                print(f"⏭️  Skipping {player_name} (already exists)")
                continue
            
            try:
                # Download the image
                r = requests.get(image_url, stream=True, timeout=10)
                
                # Check if the image was retrieved successfully
                if r.status_code == 200:
                    # Set decode_content value to True
                    r.raw.decode_content = True
                    
                    # Save the image
                    with open(image_filename, 'wb') as f:
                        shutil.copyfileobj(r.raw, f)
                    
                    print(f"✅ Downloaded: {player_name}")
                    downloaded_count += 1
                else:
                    print(f"❌ Failed to download {player_name} (Status: {r.status_code})")
                    failed_count += 1
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ Error downloading {player_name}: {e}")
                failed_count += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Downloaded: {downloaded_count}")
    print(f"   ❌ Failed: {failed_count}")
    print(f"   📁 Output directory: {output_dir}")

if __name__ == "__main__":
    import sys
    
    # Allow CSV filename to be passed as command line argument
    csv_file = sys.argv[1] if len(sys.argv) > 1 else 'nba_player_ids.csv'
    output_directory = sys.argv[2] if len(sys.argv) > 2 else 'playerHeadshots'
    
    print(f"📥 Starting headshot download...")
    print(f"   CSV file: {csv_file}")
    print(f"   Output directory: {output_directory}\n")
    
    download_player_headshots(csv_file, output_directory)
