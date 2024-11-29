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
INCLUDED_ARTISTS = ["ALL"]  # Replace with specific artist names to filter
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
        weekly_data[week].append((song, artist, streams, sales, airplay))

all_songs = {}
song_history = defaultdict(lambda: [0, 0, 0])
ranked_weeks = []
weekly_points = defaultdict(float)
ever_charted_songs = set()

# Function to get the Friday of the week
def get_friday(date_str):
    """Takes a date string (YYYY-MM-DD) and returns the Friday of that week."""
    date = datetime.strptime(date_str, "%Y-%m-%d")
    days_to_friday = (4 - date.weekday()) % 7
    friday_date = date + timedelta(days=days_to_friday)
    return friday_date.strftime("%Y-%m-%d")

for week_index, week in enumerate(sorted(weekly_data.keys())):
    weighted_scores = {}

    for song, artist, streams, sales, airplay in weekly_data[week]:
        current_points = ceil((
            STREAMS_WEIGHT * streams +
            SALES_WEIGHT * sales +
            AIRPLAY_WEIGHT * airplay
        ) / 1000)
        
        previous_points = 0
        two_weeks_ago_points = 0

        if week_index > 0:
            previous_week_songs = {entry[0]: entry[2] for entry in ranked_weeks[week_index - 1][1]}
            if (song, artist) in previous_week_songs:
                previous_points = previous_week_songs[(song, artist)]

        if week_index > 1:
            two_weeks_ago_songs = {entry[0]: entry[2] for entry in ranked_weeks[week_index - 2][1]}
            if (song, artist) in two_weeks_ago_songs:
                two_weeks_ago_points = two_weeks_ago_songs[(song, artist)]

        weighted_points = ceil((
            RETENTION_WEIGHTS[0] * current_points +
            RETENTION_WEIGHTS[1] * previous_points +
            RETENTION_WEIGHTS[2] * two_weeks_ago_points
        ))

        weighted_scores[(song, artist)] = weighted_points
        
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

    top_songs = ranked_songs[:CHART_LIMIT]
    top_songs = [((song, artist), rank + 1, points) for rank, ((song, artist), points) in enumerate(top_songs)]

    ranked_weeks.append((week, top_songs))

with open(updates_file, 'w', encoding='utf-8') as updates:
    for week_idx, (week, ranked_songs) in enumerate(ranked_weeks):
        update_date = get_friday(week)
        updates.write(f"Billboard Hot 100 — {datetime.strptime(update_date, '%Y-%m-%d').strftime('%B %d, %Y')}\n\n")
        
        for rank, ((song, artist), position, points) in enumerate(ranked_songs, start=1):
            current_week_data = next(
                ((s, a, streams, sales, airplay) for s, a, streams, sales, airplay in weekly_data[week] if s == song and a == artist),
                (None, None, 0, 0, 0)
            )
            streams_points = STREAMS_WEIGHT * current_week_data[2]
            sales_points = SALES_WEIGHT * current_week_data[3]
            airplay_points = AIRPLAY_WEIGHT * current_week_data[4]

            current_total_points = ceil((
                streams_points + sales_points + airplay_points
            ) / 1000)

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

            total_points = ceil((
                RETENTION_WEIGHTS[0] * current_total_points +
                RETENTION_WEIGHTS[1] * previous_points +
                RETENTION_WEIGHTS[2] * two_weeks_ago_points
            ))
            
            album = next(
                (album for s, album, _, _, _ in weekly_data[week] if s == song),
                "Unknown"
            )
            
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
            
            if "ALL" in INCLUDED_ARTISTS or artist in INCLUDED_ARTISTS:
                updates.write(f"#{rank} ({status}): {song} — {total_points}\n")
        
        updates.write("\n" + ("-" * 40) + "\n\n")
        
def generate_yearly_csv():
    """Generates a CSV file summarizing the weekly data into yearly format with detailed points breakdown."""
    with open(yearly_csv_file, 'w', newline='', encoding='utf-8') as csvfile:
        csvwriter = csv.writer(csvfile)
        csvwriter.writerow([
            'Week', 'Position', 'Rise/Fall', 'Song', 'Artist', 'Album',
            'Total Points', 'Streams Points', 'Sales Points', 'Airplay Points',
            'Previous Week Points', 'Two Weeks Ago Points'
        ])
        
        for week_idx, (week, ranked_songs) in enumerate(ranked_weeks):
            for rank, ((song, artist), position, points) in enumerate(ranked_songs, start=1):
                # Fetch current week's data for the song
                current_week_data = next(
                    ((s, a, streams, sales, airplay) for s, a, streams, sales, airplay in weekly_data[week] if s == song and a == artist),
                    (None, None, 0, 0, 0)
                )
                streams_points = STREAMS_WEIGHT * current_week_data[2]
                sales_points = SALES_WEIGHT * current_week_data[3]
                airplay_points = AIRPLAY_WEIGHT * current_week_data[4]

                current_total_points = ceil((
                    streams_points + sales_points + airplay_points
                ) / 1000)

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

                total_points = ceil((
                    RETENTION_WEIGHTS[0] * current_total_points +
                    RETENTION_WEIGHTS[1] * previous_points +
                    RETENTION_WEIGHTS[2] * two_weeks_ago_points
                ))

                album = next(
                    (album for s, album, _, _, _ in weekly_data[week] if s == song),
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

                # Write row to CSV, including new columns for retention points
                csvwriter.writerow([
                    week, position, rise_fall, song, artist, album,
                    total_points, f"{ceil(streams_points / 1000)}", f"{ceil(sales_points / 1000)}", f"{ceil(airplay_points / 1000)}",
                    f"{ceil(previous_points * RETENTION_WEIGHTS[1])}", f"{ceil(two_weeks_ago_points * RETENTION_WEIGHTS[2])}"
                ])

generate_yearly_csv()        

print(f"Weekly updates with points and return statuses have been saved to {updates_file} and {yearly_csv_file}")