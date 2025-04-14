import os
import csv
from points.album_cover import get_album_cover

WEEKLY_OUTPUT_DIR = "weekly_charts"
WEEKLY_LIMIT = 100

def process_weekly_charts(year, specific_week=None):
    points_dir = f"points/{year}"
    os.makedirs(WEEKLY_OUTPUT_DIR, exist_ok=True)

    files_to_process = []
    if specific_week:
        filename = f"{specific_week}.csv"
        if filename in os.listdir(points_dir):
            files_to_process = [filename]
        else:
            print(f"Week {specific_week} not found in {points_dir}")
            return
    else:
        files_to_process = [f for f in sorted(os.listdir(points_dir)) if f.endswith('.csv')]

    for filename in files_to_process:
        week = filename.replace(".csv", "")
        input_path = os.path.join(points_dir, filename)
        output_path = os.path.join(WEEKLY_OUTPUT_DIR, f"{year}_{week}.csv")

        with open(input_path, encoding='utf-8') as infile:
            reader = csv.DictReader(infile)
            songs = list(reader)

        songs.sort(key=lambda x: float(x.get('Total Weighted Points') or 0), reverse=True)
        songs = songs[:WEEKLY_LIMIT]

        for song in songs:
            if 'Rise/Fall' in song:
                rank_change = song['Rise/Fall'].strip()
                if rank_change and not rank_change.startswith(('NEW', 'RE')):
                    try:
                        value = int(rank_change)
                        if value > 0:
                            song['Rise/Fall'] = f"'+{value}"
                        else:
                            song['Rise/Fall'] = f"'{value}"
                    except ValueError:
                        pass
            
            # song['Album Cover'] = get_album_cover(song['Album'], song['Artist'])

        fieldnames = reader.fieldnames + ['Album Cover']
        with open(output_path, 'w', newline='', encoding='utf-8') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(songs)

        print(f"Top {WEEKLY_LIMIT} chart for {week} saved to {output_path}")


if __name__ == "__main__":
    year = 2025
    specific_week = "02-21"  # Change to None to process all weeks
    process_weekly_charts(year, specific_week)