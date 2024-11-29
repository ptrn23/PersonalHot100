import csv
from math import ceil
from datetime import datetime, timedelta
from collections import defaultdict

input_file = 'plays/2024_plays_by_week.csv'
updates_file = 'updates/2024.txt'
yearly_csv_file = 'updates/2024.csv'

MAX_DEBUTS = 25
RETENTION_WEIGHTS = [1, 0.3, 0.2]
CHART_LIMIT = 100
FIRST_WEEK_DEBUT_LIMIT = 100

STREAMS_WEIGHT = 5000
SALES_WEIGHT = 3000
AIRPLAY_WEIGHT = 2000

# List of artists to include in the output; "ALL" includes every artist
INCLUDED_ARTISTS = ["Green Day"]  # Replace with specific artist names to filter
INCLUDED_ALBUMS = ["American Idiot"]
INCLUDED_TRACKS = ["ALL"]

weekly_data = defaultdict(list)

with open(input_file, 'r', encoding='utf-8') as file:
    reader = csv.reader(file)
    next(reader)
    
    for row in reader:
        week, song, album, artist, streams, sales, airplay = row
        streams = int(streams)
        sales = int(sales)
        airplay = int(airplay)
        peak = CHART_LIMIT + 1
        woc = 0
        weekly_data[week].append((song, album, artist, streams, sales, airplay, peak, woc))

all_songs = defaultdict(lambda: {"total_points": 0, "peak": CHART_LIMIT + 1, "woc": 0})
ranked_weeks = []
weekly_points = defaultdict(float)
ever_charted_songs = set()

def get_friday(date_str):
    """Takes a date string (YYYY-MM-DD) and returns the Friday of that week."""
    date = datetime.strptime(date_str, "%Y-%m-%d")
    days_to_friday = (4 - date.weekday()) % 7
    friday_date = date + timedelta(days=days_to_friday)
    return friday_date.strftime("%Y-%m-%d")

def calculate_points(streams, sales, airplay):
    return ceil((STREAMS_WEIGHT * streams + SALES_WEIGHT * sales + AIRPLAY_WEIGHT * airplay) / 1000)

def calculate_weighted_points(current_points, previous_points, two_weeks_ago_points):
    return ceil(
        RETENTION_WEIGHTS[0] * current_points +
        RETENTION_WEIGHTS[1] * previous_points +
        RETENTION_WEIGHTS[2] * two_weeks_ago_points
    )

def get_past_points(week_idx, song, artist, ranked_weeks):
    previous_points = 0
    two_weeks_ago_points = 0

    if week_idx > 0:
        prev_week_songs = {entry[0]: entry[2] for entry in ranked_weeks[week_idx - 1][1]}
        if (song, artist) in prev_week_songs:
            previous_points = prev_week_songs[(song, artist)]

    if week_idx > 1:
        two_weeks_ago_songs = {entry[0]: entry[2] for entry in ranked_weeks[week_idx - 2][1]}
        if (song, artist) in two_weeks_ago_songs:
            two_weeks_ago_points = two_weeks_ago_songs[(song, artist)]

    return previous_points, two_weeks_ago_points

for week_index, week in enumerate(sorted(weekly_data.keys())):
    weighted_scores = {}

    for song, album, artist, streams, sales, airplay, peak, woc in weekly_data[week]:
        current_points = calculate_points(streams, sales, airplay)
        previous_points, two_weeks_ago_points = get_past_points(week_index, song, artist, ranked_weeks)

        weighted_points = calculate_weighted_points(current_points, previous_points, two_weeks_ago_points)
        weighted_scores[(song, artist)] = weighted_points
        all_songs[(song, artist)]["total_points"] += weighted_points

    sorted_songs = sorted(weighted_scores.items(), key=lambda x: x[1], reverse=True)

    debuts = [(song_artist, points) for song_artist, points in sorted_songs if song_artist not in ever_charted_songs]
    returning = [(song_artist, points) for song_artist, points in sorted_songs if song_artist in ever_charted_songs]

    if week_index == 0:
        limited_debuts = debuts[:FIRST_WEEK_DEBUT_LIMIT]
    else:
        limited_debuts = debuts[:MAX_DEBUTS]

    ever_charted_songs.update({(song, artist) for (song, artist), _ in limited_debuts})

    ranked_songs = limited_debuts + returning
    ranked_songs.sort(key=lambda x: x[1], reverse=True)
    
    for rank, ((song, artist), points) in enumerate(ranked_songs[:CHART_LIMIT]):
        current_peak = all_songs[(song, artist)]["peak"]
        if current_peak > rank + 1:
            all_songs[(song, artist)]["peak"] = rank + 1
        
        all_songs[(song, artist)]["woc"] += 1

    top_songs = [((song, artist), rank + 1, points) for rank, ((song, artist), points) in enumerate(ranked_songs)]

    ranked_weeks.append((week, top_songs))

with open(updates_file, 'w', encoding='utf-8') as updates:
    for week_idx, (week, ranked_songs) in enumerate(ranked_weeks):
        update_date = get_friday(week)
        updates.write(f"Billboard Hot 100 — {datetime.strptime(update_date, '%Y-%m-%d').strftime('%B %d, %Y')}\n\n")
        
        for rank, ((song, artist), position, points) in enumerate(ranked_songs, start=1):
            current_week_data = next(
                ((s, album, artist, streams, sales, airplay, peak, woc) for s, album, artist, streams, sales, airplay, peak, woc in weekly_data[week] if s == song and artist == artist),
                (None, None, 0, 0, 0)
            )
            streams, sales, airplay = current_week_data[3:6]
            current_points = calculate_points(streams, sales, airplay)
            previous_points, two_weeks_ago_points = get_past_points(week_idx, song, artist, ranked_weeks)
            total_points = calculate_weighted_points(current_points, previous_points, two_weeks_ago_points)
            
            if week_idx == 0:
                status = "NEW"
            else:
                prev_week_positions = {
                    (s, a): pos for (s, a), pos, points in ranked_weeks[week_idx - 1][1]
                }
                if (song, artist) not in prev_week_positions:
                    if (song, artist) not in ever_charted_songs:
                        status = "NEW"
                    else:
                        status = "RE"
                elif prev_week_positions[(song, artist)] > position:
                    status = f"+{prev_week_positions[(song, artist)] - position}"
                elif prev_week_positions[(song, artist)] < position:
                    status = f"-{position - prev_week_positions[(song, artist)]}"
                else:
                    status = "="
            
            if ("ALL" in INCLUDED_ARTISTS or artist in INCLUDED_ARTISTS) and ("ALL" in INCLUDED_ALBUMS or current_week_data[1] in INCLUDED_ALBUMS):
                updates.write(f"#{rank} ({status}): {song} — {total_points}\n")
        
        updates.write("\n" + ("-" * 40) + "\n\n")
        
with open(yearly_csv_file, 'w', newline='', encoding='utf-8') as csvfile:
    csvwriter = csv.writer(csvfile)
    csvwriter.writerow([
        'Week', 'Position', 'Rise/Fall', 'Song', 'Artist', 'Album',
        'Total Points', 'Streams Points', 'Sales Points', 'Airplay Points',
        'Previous Week Points', 'Two Weeks Ago Points',
        "Peak", "WOC"
    ])
    
    for week_idx, (week, ranked_songs) in enumerate(ranked_weeks):
        for rank, ((song, artist), position, points) in enumerate(ranked_songs, start=1):
            current_week_data = next(
                ((s, album, artist, streams, sales, airplay, peak, woc) for s, album, artist, streams, sales, airplay, peak, woc in weekly_data[week] if s == song and artist == artist),
                (None, None, 0, 0, 0)
            )
            streams, sales, airplay = current_week_data[3:6]
            current_points = calculate_points(streams, sales, airplay)
            previous_points, two_weeks_ago_points = get_past_points(week_idx, song, artist, ranked_weeks)
            total_points = calculate_weighted_points(current_points, previous_points, two_weeks_ago_points)

            album = next(
                (album for s, album, _, _, _, _, _, _ in weekly_data[week] if s == song),
                "Unknown"
            )

            if week_idx == 0:
                rise_fall = "NEW"
            else:
                prev_week_positions = {
                    (s, a): pos for (s, a), pos, points in ranked_weeks[week_idx - 1][1]
                }
                if (song, artist) not in prev_week_positions:
                    if (song, artist) not in ever_charted_songs:
                        rise_fall = "NEW"
                    else:
                        rise_fall = "RE"
                elif prev_week_positions[(song, artist)] > position:
                    rise_fall = f"+{prev_week_positions[(song, artist)] - position}"
                elif prev_week_positions[(song, artist)] < position:
                    rise_fall = f"-{position - prev_week_positions[(song, artist)]}"
                else:
                    rise_fall = "="

            csvwriter.writerow([
                week, position, rise_fall, song, artist, album,
                total_points, f"{ceil(STREAMS_WEIGHT * current_week_data[3] / 1000)}", f"{ceil(SALES_WEIGHT * current_week_data[4] / 1000)}", f"{ceil(AIRPLAY_WEIGHT * current_week_data[5] / 1000)}",
                f"{ceil(previous_points * RETENTION_WEIGHTS[1])}", f"{ceil(two_weeks_ago_points * RETENTION_WEIGHTS[2])}", peak, woc
            ])     

print(f"Weekly updates with points and return statuses have been saved to {updates_file} and {yearly_csv_file}")

def generate_year_end_csv(year, all_songs):
    # Prepare the data to be written to the CSV
    year_end_data = []
    for (song, artist), data in all_songs.items():
        year_end_data.append({
            'Song': song,
            'Artist': artist,
            'Total Points': data['total_points'],
            'Peak': data['peak'],
            'Weeks on Chart': data['woc']
        })

    # Sort by Total Points in descending order
    year_end_data.sort(key=lambda x: x['Total Points'], reverse=True)

    # Writing to the <year>_year_end.csv file
    year_end_csv_file = f"year_end/{year}_year_end.csv"
    with open(year_end_csv_file, 'w', newline='', encoding='utf-8') as csvfile:
        csvwriter = csv.DictWriter(csvfile, fieldnames=['Song', 'Artist', 'Total Points', 'Peak', 'Weeks on Chart'])
        csvwriter.writeheader()  # Write the header
        csvwriter.writerows(year_end_data)  # Write the sorted data

    print(f"Year-end CSV for {year} has been saved to {year_end_csv_file}")

# Assuming `all_songs` already contains the necessary data and you have the year (e.g., 2024)
year = 2024
generate_year_end_csv(year, all_songs)