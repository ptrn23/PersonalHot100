import os
import csv
from points.album_cover import get_album_cover

WEEKLY_OUTPUT_DIR = "weekly_charts"
WEEKLY_LIMIT = 100
ALBUM_COVERS_FILE = "album_covers.csv"

def load_album_cover_cache():
    album_cover_cache = {}
    if os.path.exists(ALBUM_COVERS_FILE):
        with open(ALBUM_COVERS_FILE, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader)
            for row in reader:
                album, artist, cover_url = row
                album_cover_cache[(album, artist)] = cover_url
    return album_cover_cache

def save_album_cover_cache(album_cover_cache):
    with open(ALBUM_COVERS_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(['Album', 'Artist', 'Cover URL'])
        for (album, artist), cover_url in album_cover_cache.items():
            writer.writerow([album, artist, cover_url])

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

    album_cover_cache = load_album_cover_cache()

    for filename in files_to_process:
        week = filename.replace(".csv", "")
        input_path = os.path.join(points_dir, filename)
        output_path = os.path.join(WEEKLY_OUTPUT_DIR, f"{year}_{week}.csv")

        with open(input_path, encoding='utf-8') as infile:
            reader = csv.DictReader(infile)
            songs = list(reader)

        songs = songs[:WEEKLY_LIMIT]

        for song in songs:
            if 'Rise/Fall' in song:
                rank_change = song['Rise/Fall'].strip()
                if rank_change and rank_change.startswith(('=')):
                    song['Rise/Fall'] = f"'="
                if rank_change and not rank_change.startswith(('NEW', 'RE')):
                    try:
                        value = int(rank_change)
                        if value > 0:
                            song['Rise/Fall'] = f"'+{value}"
                        else:
                            song['Rise/Fall'] = f"'{value}"
                    except ValueError:
                        pass
            
            album = song['Album']
            artist = song['Artist']
            key = (album, artist)

            if key in album_cover_cache:
                song['Album Cover'] = album_cover_cache[key]
            else:
                cover_url = get_album_cover(album, artist)
                album_cover_cache[key] = cover_url
                song['Album Cover'] = cover_url

        fieldnames = reader.fieldnames + ['Album Cover']
        with open(output_path, 'w', newline='', encoding='utf-8') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(songs)

        print(f"Top {WEEKLY_LIMIT} chart for {week} saved to {output_path}")

    save_album_cover_cache(album_cover_cache)

if __name__ == "__main__":
    year = 2023
    specific_week = "10-27"  # Change to None to process all weeks
    process_weekly_charts(year, specific_week)