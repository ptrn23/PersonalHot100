import csv
import json
import os

# CONFIG
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Note: Ensure this matches your actual CSV filename
CSV_PATH = os.path.join(SCRIPT_DIR, 'weekly_charts', '2026_01-23.csv')
OUTPUT_PATH = os.path.join(SCRIPT_DIR, '..', 'public', 'data', 'latest_chart.json')

def convert_csv_to_json():
    if not os.path.exists(CSV_PATH):
        print(f"Error: Could not find {CSV_PATH}")
        return

    chart_data = {
        "meta": { "year": "2026", "week": "01-23", "generated_at": "2026-01-23" },
        "songs": []
    }

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            try:
                rank = int(row['Position'])
            except ValueError:
                continue 

            # Helper to safely parse floats/ints
            def parse_num(key, type_func=int):
                val = row.get(key, '').strip().replace('%', '')
                return type_func(float(val)) if val else 0

            # Logic for Rank Change
            last_week_raw = row.get('Previous Rank', '')
            last_week = int(last_week_raw) if last_week_raw.isdigit() else None
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

            # Build the rich entry
            song_entry = {
                "rank": rank,
                "title": row.get('Song', ''),
                "artist": row.get('Artist', ''),
                "coverUrl": row.get('Album Cover', ''),
                "status": status,
                "change": change,
                
                # --- NEW METRICS ---
                "points": parse_num('Total Weighted Points'),
                "pointsPct": row.get('%', '-'), # Keep as string to handle "--" or formatting
                
                "peak": row.get('Peak', '-'),
                "peakStreak": row.get('Peak Streak', ''), # For the blue "4x" text
                "woc": row.get('WOC', '-'),
                
                "sales": parse_num('Sales Units'),
                "salesPct": row.get('Sales %', ''),
                
                "streams": parse_num('Streams Units'),
                "streamsPct": row.get('Streams %', ''),
                
                "airplay": parse_num('Airplay Units'),
                "airplayPct": row.get('Airplay %', ''),
                
                "units": parse_num('Total Units')
            }
            
            chart_data["songs"].append(song_entry)

    chart_data["songs"].sort(key=lambda x: x["rank"])
    
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(chart_data, f, indent=2)
        print(f"Success! Exported {len(chart_data['songs'])} songs with detailed metrics.")

if __name__ == "__main__":
    convert_csv_to_json()