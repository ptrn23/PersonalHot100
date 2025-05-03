import os
import csv
from collections import defaultdict
from points.album_cover import get_album_cover

YEARLY_OUTPUT_DIR = "year_end"
ALBUM_COVERS_FILE = "album_covers.csv"
WEEKLY_POINTS_DIR = "points"
YEAR = "2025"
CHART_LIMIT = 100

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

def process_year_end_chart(year):
    album_cover_cache = load_album_cover_cache()
    song_stats = defaultdict(lambda: {
        "total_points": 0,
        "total_streams": 0,
        "total_sales": 0,
        "total_airplay": 0,
        "total_units": 0,
        "most_recent_points": 0,
        "album": "",
        "peak": CHART_LIMIT + 1,
        "peak_streak": 0,
        "woc": 0
    })

    weekly_dir = os.path.join(WEEKLY_POINTS_DIR, year)
    all_files = sorted(f for f in os.listdir(weekly_dir) if f.endswith('.csv'))

    for filename in all_files:
        with open(os.path.join(weekly_dir, filename), encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                song = row["Song"]
                artist = row["Artist"]
                album = row["Album"]
                key = (song, artist)

                points = int(row.get("Total Weighted Points", 0))
                streams = int(row.get("Streams Units", 0))
                sales = int(row.get("Sales Units", 0))
                airplay = int(row.get("Airplay Units", 0))
                units = int(row.get("Total Units", 0))
                position = int(row.get("Position", CHART_LIMIT + 1))
                peak = int(row.get("Peak", 0))
                peak_streak = int(row.get("Peak Streak", 0))

                stats = song_stats[key]
                stats["album"] = album
                stats["total_points"] += points
                stats["total_streams"] += streams
                stats["total_sales"] += sales
                stats["total_airplay"] += airplay
                stats["total_units"] += units
                stats["most_recent_points"] = points
                stats["peak"] = peak
                stats["peak_streak"] = peak_streak
                stats["woc"] += 1

    ranked_songs = sorted(song_stats.items(), key=lambda x: x[1]["total_points"], reverse=True)[:CHART_LIMIT]

    output_path = os.path.join(YEARLY_OUTPUT_DIR, f"{year}_year_end.csv")
    os.makedirs(YEARLY_OUTPUT_DIR, exist_ok=True)

    with open(output_path, "w", newline='', encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Rank", "Song", "Artist", "Album", "Album Cover",
            "Total Points", "Most Recent Week Points",
            "Total Streams", "Total Sales", "Total Airplay", "Total Units",
            "Peak", "Peak Streak", "Weeks on Chart"
        ])
        for rank, ((song, artist), stats) in enumerate(ranked_songs, start=1):
            album = stats["album"]
            cover_url = album_cover_cache.get((album, artist))
            if not cover_url:
                cover_url = get_album_cover(album, artist)
                album_cover_cache[(album, artist)] = cover_url

            writer.writerow([
                rank, song, artist, album, cover_url,
                stats["total_points"], stats["most_recent_points"],
                stats["total_streams"], stats["total_sales"], stats["total_airplay"], stats["total_units"],
                stats["peak"], stats["peak_streak"], stats["woc"]
            ])

    save_album_cover_cache(album_cover_cache)
    print(f"Year-end chart saved to {output_path}")

if __name__ == "__main__":
    process_year_end_chart(YEAR)