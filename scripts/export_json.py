import csv
import json
import os

# --- PATH CONFIGURATION ---
# Get the directory where THIS script file lives (e.g., .../personal-hot-100/scripts)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Define input/output relative to the script location
# Input: scripts/weekly_charts/2026_01-23.csv
CSV_PATH = os.path.join(SCRIPT_DIR, 'weekly_charts', '2026_01-23.csv')

# Output: public/data/latest_chart.json (Go up one level from scripts, then into public)
OUTPUT_PATH = os.path.join(SCRIPT_DIR, '..', 'public', 'data', 'latest_chart.json')

def convert_csv_to_json():
    print(f"DEBUG: Looking for CSV at: {CSV_PATH}")
    
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: Could not find CSV file.")
        print(f"Please check that '2026_01-23.csv' is inside the 'scripts/weekly_charts' folder.")
        return

    chart_data = {
        "meta": {
            "year": "2026",
            "week": "01-23",
            "generated_at": "2026-01-23" 
        },
        "songs": []
    }

    try:
        with open(CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                try:
                    rank = int(row['Position'])
                except ValueError:
                    continue 

                # Parse Previous Rank safely
                last_week_str = row.get('Previous Rank', '').strip()
                # Handle "--" or empty strings
                if not last_week_str or not last_week_str.isdigit():
                    last_week = None
                else:
                    last_week = int(last_week_str)

                # Determine Status
                status = "stable"
                change = 0
                
                if last_week is None:
                    status = "new"
                elif rank < last_week:
                    status = "rise"
                    change = last_week - rank
                elif rank > last_week:
                    status = "fall"
                    change = rank - last_week
                
                # Check column names match your CSV specifically
                song_entry = {
                    "rank": rank,
                    "title": row.get('Song', 'Unknown'),
                    "artist": row.get('Artist', 'Unknown'),
                    "album": row.get('Album', 'Unknown'),
                    "coverUrl": row.get('Album Cover', ''),
                    "lastWeek": last_week,
                    "status": status,
                    "change": change,
                    "peak": row.get('Peak', '-'),
                    "weeksOnChart": row.get('WOC', '-')
                }
                
                chart_data["songs"].append(song_entry)

        # Sort and Save
        chart_data["songs"].sort(key=lambda x: x["rank"])
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(chart_data, f, indent=2)
            
        print(f"SUCCESS! Wrote {len(chart_data['songs'])} songs to:")
        print(f"  -> {os.path.abspath(OUTPUT_PATH)}")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    convert_csv_to_json()