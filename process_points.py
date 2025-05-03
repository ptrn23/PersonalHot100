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
        next(reader)  # Skip header
        for row in reader:
            song, artist, first_week = row
            charted_cache[(song, artist)] = first_week

all_songs = defaultdict(lambda: {
    "peak": CHART_LIMIT + 1,
    "woc": 0,
    "album": ""
})

ranked_weeks = []

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

        weighted_scores = {}
        raw_point_map = {}

        for song, album, artist, streams, sales, airplay in weekly_data:
            raw_points = calculate_points(streams, sales, airplay)
            prev_pts, two_weeks_pts = get_past_points(len(ranked_weeks), song, artist, ranked_weeks)
            weighted = calculate_weighted_points(raw_points, prev_pts, two_weeks_pts)

            key = (song, artist)
            weighted_scores[key] = weighted
            raw_point_map[key] = (streams, sales, airplay, raw_points, prev_pts, two_weeks_pts)

            all_songs[key]["album"] = album

        sorted_songs = sorted(weighted_scores.items(), key=lambda x: x[1], reverse=True)

        debuts = [(sa, pts) for sa, pts in sorted_songs if sa not in charted_cache]
        returning = [(sa, pts) for sa, pts in sorted_songs if sa in charted_cache]

        limited_debuts = debuts[:100] if len(ranked_weeks) == 0 else debuts[:25]
        ranked = limited_debuts + returning
        ranked.sort(key=lambda x: x[1], reverse=True)
        ranked = ranked[:CHART_LIMIT]

        week_ranks = []
        prev_week_positions = {
            sa: pos for sa, pos, _ in ranked_weeks[-1][1]
        } if ranked_weeks else {}

        for rank, (key, points) in enumerate(ranked, start=1):
            song, artist = key
            album = all_songs[key]["album"]

            is_new_peak, is_repeak = update_peak_and_woc(all_songs[key], rank)

            streams, sales, airplay, total_points, prev_pts, two_weeks_pts = raw_point_map[key]
            stream_pts = ceil(streams * 5000 / 1000)
            sale_pts = ceil(sales * 3000 / 1000)
            air_pts = ceil(airplay * 2000 / 1000)
            week_total_points = ceil(total_points + ceil(prev_pts * 0.3) + ceil(two_weeks_pts * 0.2))

            stream_units = ceil(streams * 5000 * 10)
            sale_units = ceil(sales * 3000)
            air_units = ceil(airplay * 2000 * 50)
            total_units = stream_units + sale_units + air_units

            if prev_pts == 0:
                percent_change = "--"
            else:
                percent_change = round((week_total_points - ceil(prev_pts)) / ceil(prev_pts), 2)

            stream_percent = round(stream_units / total_units, 2)
            sale_percent = round(sale_units / total_units, 2)
            air_percent = round(air_units / total_units, 2)

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