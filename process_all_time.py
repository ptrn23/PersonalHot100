import os
import csv
from collections import defaultdict
from points.album_cover import get_album_cover

YEARS = [str(year) for year in range(2020, 2026)]
CHART_LIMIT = 100
CHARTED_CACHE_FILE = "points/ever_charted.csv"
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

all_time_data = defaultdict(lambda: {
    "streams": 0,
    "sales": 0,
    "airplay": 0,
    "total_points": 0,
    "streams_points": 0,
    "sales_points": 0,
    "airplay_points": 0,
    "streams_units": 0,
    "sales_units": 0,
    "airplay_units": 0,
    "streams_percent_sum": 0.0,
    "sales_percent_sum": 0.0,
    "airplay_percent_sum": 0.0,
    "total_units": 0,
    "current_week_points": 0,
    "previous_week_points": 0,
    "two_weeks_ago_points": 0,
    "peak": CHART_LIMIT + 1,
    "woc": 0,
    "peak_streak": 0,
    "album": "",
    "weeks_count": 0,
})

original_song_names = {}

for year in YEARS:
    POINTS_DIR = f"points/{year}"

    if not os.path.exists(POINTS_DIR):
        continue

    for filename in sorted(os.listdir(POINTS_DIR)):
        if not filename.endswith(".csv"):
            continue

        filepath = os.path.join(POINTS_DIR, filename)

        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Extract fields
                song = row['Song']
                artist = row['Artist']
                album = row['Album']
                
                total_points = int(row['Total Weighted Points'])

                streams = int(row['Streams'])
                sales = int(row['Sales'])
                airplay = int(row['Airplay'])

                streams_points = int(row['Streams Points'])
                sales_points = int(row['Sales Points'])
                airplay_points = int(row['Airplay Points'])

                streams_units = int(row['Streams Units'])
                sales_units = int(row['Sales Units'])
                airplay_units = int(row['Airplay Units'])

                streams_percent = float(row['Streams %'])
                sales_percent = float(row['Sales %'])
                airplay_percent = float(row['Airplay %'])

                total_units = int(row['Total Units'])

                current_week_points = int(row['Current Week Points'])
                previous_week_points = int(row['Previous Week Points'])
                two_weeks_ago_points = int(row['Two Weeks Ago Points'])

                peak = int(row['Peak']) if row['Peak'] else CHART_LIMIT + 1
                woc = int(row['WOC']) if row['WOC'] else 0
                peak_streak = int(row['Peak Streak']) if row['Peak Streak'] else 0

                key = (song.lower(), artist)

                if key not in original_song_names:
                    original_song_names[key] = song

                # Initialize album if empty
                if not all_time_data[key]["album"]:
                    all_time_data[key]["album"] = album

                # Aggregate all numeric values cumulatively
                data = all_time_data[key]
                data["streams"] += streams
                data["sales"] += sales
                data["airplay"] += airplay
                
                data["total_points"] += total_points

                data["streams_points"] += streams_points
                data["sales_points"] += sales_points
                data["airplay_points"] += airplay_points

                data["streams_units"] += streams_units
                data["sales_units"] += sales_units
                data["airplay_units"] += airplay_units

                data["streams_percent_sum"] += streams_percent
                data["sales_percent_sum"] += sales_percent
                data["airplay_percent_sum"] += airplay_percent

                data["total_units"] += total_units

                data["current_week_points"] += current_week_points
                data["previous_week_points"] += previous_week_points
                data["two_weeks_ago_points"] += two_weeks_ago_points

                data["peak"] = peak
                data["woc"] = woc
                data["peak_streak"] = peak_streak

                data["weeks_count"] += 1

# Now sort songs by total weighted points (sum of current_week_points)
sorted_songs = sorted(all_time_data.items(), key=lambda x: x[1]["total_points"], reverse=True)[:200]

# Write all_time.csv
os.makedirs("points", exist_ok=True)
out_file = "points/all_time.csv"
with open(out_file, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow([
        'Position', 'Song', 'Artist', 'Album', 'Total Weighted Points',
        'Streams', 'Sales', 'Airplay',
        'Streams Points', 'Sales Points', 'Airplay Points',
        'Streams Units', 'Sales Units', 'Airplay Units',
        'Avg Streams %', 'Avg Sales %', 'Avg Airplay %',
        'Total Units',
        'Total Current Week Points', 'Sum Previous Week Points', 'Sum Two Weeks Ago Points',
        'Peak', 'Weeks On Chart', 'Peak Streak', 'Album Cover'
    ])
    
    album_cover_cache = load_album_cover_cache()

    for rank, (key, data) in enumerate(sorted_songs, start=1):
        song_lower, artist = key
        song = original_song_names.get(key, song_lower)

        # Calculate average %s over weeks
        weeks_count = data["weeks_count"]
        avg_streams_percent = round(data["streams_percent_sum"] / weeks_count, 4) if weeks_count else 0
        avg_sales_percent = round(data["sales_percent_sum"] / weeks_count, 4) if weeks_count else 0
        avg_airplay_percent = round(data["airplay_percent_sum"] / weeks_count, 4) if weeks_count else 0
        
        album = data["album"]
        key = (album, artist)

        if key in album_cover_cache:
            album_cover = album_cover_cache[key]
        else:
            cover_url = get_album_cover(album, artist)
            album_cover_cache[key] = cover_url
            album_cover = cover_url

        writer.writerow([
            rank,
            song,
            artist,
            data["album"],
            data["total_points"],
            data["streams"],
            data["sales"],
            data["airplay"],
            data["streams_points"],
            data["sales_points"],
            data["airplay_points"],
            data["streams_units"],
            data["sales_units"],
            data["airplay_units"],
            avg_streams_percent,
            avg_sales_percent,
            avg_airplay_percent,
            data["total_units"],
            data["current_week_points"],
            data["previous_week_points"],
            data["two_weeks_ago_points"],
            data["peak"],
            data["woc"],
            data["peak_streak"],
            album_cover,
        ])
    
    save_album_cover_cache(album_cover_cache)

print(f"Saved all-time cumulative data from points CSV: {out_file}")