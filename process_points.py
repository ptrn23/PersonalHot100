import os
import csv
from collections import defaultdict
from datetime import datetime
from math import ceil

from points.calculations import calculate_points, calculate_weighted_points
from points.tracker import get_past_points, update_peak_and_woc, get_status

YEARS = [str(year) for year in range(2020, 2026)]
CHART_LIMIT = 100
CHARTED_CACHE_FILE = "points/ever_charted.csv"

charted_cache = {}

if os.path.exists(CHARTED_CACHE_FILE):
    with open(CHARTED_CACHE_FILE, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            song, artist, first_week = row
            key = (song.lower(), artist)
            charted_cache[key] = first_week

all_songs = defaultdict(lambda: {
    "peak": CHART_LIMIT + 1,
    "woc": 0,
    "album": ""
})

ranked_weeks = []
original_song_names = {}

def stable_seed(song: str, album: str, artist: str) -> int:
    combo = f"{song}|{album}|{artist}"
    return sum((i + 1) * ord(char) for i, char in enumerate(combo))
    
def apply_deviation(base_value: int, seed: int, scale: float = 0.1, mod: int = 100) -> int:
    deviation = ((seed % mod) / mod - 0.5) * 2 * scale
    return int(base_value * (1 + deviation))

for year in YEARS:
    PLAYS_DIR = f"plays/{year}"
    POINTS_DIR = f"points/{year}"
    os.makedirs(POINTS_DIR, exist_ok=True)

    for filename in sorted(os.listdir(PLAYS_DIR)):
        if not filename.endswith(".csv"):
            continue

        filepath = os.path.join(PLAYS_DIR, filename)
        week_str = filename.replace(".csv", "")
        week_date = datetime.strptime(f"{year}-{week_str}", "%Y-%m-%d")
        week_key = week_date.strftime("%Y-%m-%d")

        weekly_data = []
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader)
            for row in reader:
                week, song, album, artist, streams, sales, airplay = row
                weekly_data.append((song, album, artist, int(streams), int(sales), int(airplay)))

        aggregated_data = {}

        for song, album, artist, streams, sales, airplay in weekly_data:
            song_lower = song.lower()
            key = (song_lower, artist)
            
            if key not in aggregated_data:
                aggregated_data[key] = {
                    "album": album,
                    "streams": 0,
                    "sales": 0,
                    "airplay": 0
                }
                original_song_names[key] = song  # Save original casing here

            aggregated_data[key]["streams"] += streams
            aggregated_data[key]["sales"] += sales
            aggregated_data[key]["airplay"] += airplay

        weighted_scores = {}
        raw_point_map = {}

        for (song, artist), data in aggregated_data.items():
            album = data["album"]
            streams, sales, airplay = data["streams"], data["sales"], data["airplay"]

            raw_points = calculate_points(streams, sales, airplay)
            prev_pts, two_weeks_pts = get_past_points(len(ranked_weeks), song, artist, ranked_weeks)
            weighted = calculate_weighted_points(raw_points, prev_pts, two_weeks_pts)

            key = (song.lower(), artist)
            weighted_scores[key] = weighted
            raw_point_map[key] = (streams, sales, airplay, raw_points, prev_pts, two_weeks_pts)

            all_songs[key]["album"] = album
        
        sorted_songs = sorted(weighted_scores.items(), key=lambda x: x[1], reverse=True)

        ranked = sorted(weighted_scores.items(), key=lambda x: x[1], reverse=True)[:CHART_LIMIT]

        week_ranks = []
        prev_week_positions = {
            sa: pos for sa, pos, _ in ranked_weeks[-1][1]
        } if ranked_weeks else {}

        for rank, (key, points) in enumerate(ranked, start=1):
            song_lower, artist = key
            song = original_song_names.get(key, song_lower)
            album = all_songs[key]["album"]

            is_new_peak, is_repeak = update_peak_and_woc(all_songs[key], rank)

            streams, sales, airplay, total_points, prev_pts, two_weeks_pts = raw_point_map[key]
            stream_pts = ceil(streams * 5000 / 1000)
            sale_pts = ceil(sales * 3000 / 1000)
            air_pts = ceil(airplay * 2000 / 1000)
            week_total_points = ceil(total_points + ceil(prev_pts * 0.3) + ceil(two_weeks_pts * 0.2))

            seed = stable_seed(song, album, artist)
            
            stream_units = apply_deviation(ceil(streams * 5250 * 275), seed + 1)
            sale_units = apply_deviation(ceil(sales * 252), seed + 2)
            air_units = apply_deviation(ceil(airplay * 2250 * 5020), seed + 3)
            total_units = apply_deviation(ceil((streams + sales + airplay) * 1750 * 2), seed + 4)

            if prev_pts == 0:
                percent_change = "--"
            else:
                percent_change = round((week_total_points - ceil(prev_pts)) / ceil(prev_pts), 2)
             
            total_raw = streams * 4 + sales * 0.45 + airplay * 5
            stream_percent = round(streams * 4 / total_raw, 2)
            sale_percent = round(sales * 0.45 / total_raw, 2)
            air_percent = round(airplay * 5 / total_raw, 2)

            previous_rank = prev_week_positions.get(key) if prev_week_positions.get(key) else "--"
            status = get_status(rank, prev_week_positions.get(key), key, charted_cache, prev_week_positions, week_key)

            if key not in charted_cache or week_key < charted_cache[key]:
                charted_cache[key] = week_key

            week_ranks.append((
                week_key,
                rank, status, previous_rank, is_new_peak, is_repeak,
                week_total_points,
                percent_change,
                song, artist, album,
                streams, sales, airplay,
                stream_pts, sale_pts, air_pts,
                stream_units, sale_units, air_units,
                stream_percent, sale_percent, air_percent,
                total_units,
                total_points,
                ceil(prev_pts * 0.3), ceil(two_weeks_pts * 0.2),
                all_songs[key]["peak"], all_songs[key]["woc"], all_songs[key]["peak_streak"]
            ))

        ranked_weeks.append((week_key, [(key, rank, points) for rank, (key, points) in enumerate(ranked, start=1)]))

        out_file = os.path.join(POINTS_DIR, f"{week_str}.csv")
        with open(out_file, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                'Week',
                'Position', 'Rise/Fall', 'Previous Rank', 'New Peak?', 'Re-peak?',
                'Total Weighted Points',
                '%',
                'Song', 'Artist', 'Album',
                'Streams', 'Sales', 'Airplay',
                'Streams Points', 'Sales Points', 'Airplay Points',
                'Streams Units', 'Sales Units', 'Airplay Units',
                'Streams %', 'Sales %', 'Airplay %',
                'Total Units',
                'Current Week Points',
                'Previous Week Points', 'Two Weeks Ago Points',
                'Peak', 'WOC', 'Peak Streak'
            ])
            writer.writerows(week_ranks)

        print(f"Saved weekly points: {week_str}-{year}")

    with open(CHARTED_CACHE_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Song", "Artist", "First_Week"])
        for (song, artist), week in sorted(charted_cache.items(), key=lambda x: x[1]):
            writer.writerow([song, artist, week])

    print(f"Updated charted history cache: {CHARTED_CACHE_FILE}")