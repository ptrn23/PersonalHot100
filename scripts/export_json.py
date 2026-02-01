import csv
import json
import os

# CONFIG
YEAR = 2025
# Relative path from inside the 'scripts' folder
CSV_PATH = f'charts/{YEAR}.csv'
# Output path to the Next.js public folder
OUTPUT_PATH = '../public/data/latest_chart.json' 

def convert_csv_to_json():
    if not os.path.exists(CSV_PATH):
        print(f"Error: Could not find {CSV_PATH}")
        print(f"Current working directory: {os.getcwd()}")
        return

    chart_data = {
        "meta": {
            "year": YEAR,
            "generated_at": "2026-02-01" 
        },
        "songs": []
    }

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)
        
        # We assume the last column is the latest week's rank
        # Standard format: Song, Artist, Album, Image, ...Weeks
        for row in reader:
            if not row: continue
            
            # extract basic info
            song_title = row[0]
            artist_name = row[1]
            album_name = row[2]
            cover_url = row[3]
            
            # get the rank from the very last column
            # if it's empty string, the song isn't charting this week
            current_rank = row[-1]
            
            if current_rank and current_rank.strip():
                song_entry = {
                    "title": song_title,
                    "artist": artist_name,
                    "album": album_name,
                    "coverUrl": cover_url,
                    "rank": int(current_rank)
                }
                chart_data["songs"].append(song_entry)

    # Sort by rank (1, 2, 3...)
    chart_data["songs"].sort(key=lambda x: x["rank"])

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(chart_data, f, indent=2)
        print(f"Success! JSON chart saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    convert_csv_to_json()