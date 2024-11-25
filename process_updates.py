import csv
from datetime import datetime, timedelta
from collections import defaultdict

input_file = 'plays/2024_plays_by_week.csv'
updates_file = 'updates/2024.txt'

MAX_DEBUTS = 10
RETENTION_WEIGHTS = [0.5, 0.3, 0.2]
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
        week, song, artist, streams, sales, airplay = row
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
        if (song, artist) not in song_history:
            song_history[(song, artist)] = [0, 0, 0]
        
        current_points = (
            STREAMS_WEIGHT * streams +
            SALES_WEIGHT * sales +
            AIRPLAY_WEIGHT * airplay
        )
        
        previous_points = song_history[(song, artist)][0]
        two_weeks_ago_points = song_history[(song, artist)][1]
        
        weighted_points = (
            RETENTION_WEIGHTS[0] * current_points +
            RETENTION_WEIGHTS[1] * previous_points +
            RETENTION_WEIGHTS[2] * two_weeks_ago_points
        )
        
        weighted_scores[(song, artist)] = weighted_points
        song_history[(song, artist)] = [current_points, song_history[(song, artist)][0], song_history[(song, artist)][1]]

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
    top_songs = [((song, artist), rank + 1) for rank, ((song, artist), _) in enumerate(top_songs)]
    
    ranked_weeks.append((week, top_songs))

with open(updates_file, 'w', encoding='utf-8') as updates:
    for week_idx, (week, ranked_songs) in enumerate(ranked_weeks):
        update_date = get_friday(week)
        updates.write(f"Billboard Hot 100 — {datetime.strptime(update_date, '%Y-%m-%d').strftime('%B %d, %Y')}\n\n")
        
        for rank, ((song, artist), position) in enumerate(ranked_songs, start=1):
            points_this_week = weighted_scores.get((song, artist), 0)
            
            if week_idx == 0:
                status = "NEW"
            else:
                prev_week_positions = {
                    (s, a): pos for (s, a), pos in ranked_weeks[week_idx - 1][1]
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
                updates.write(f"#{rank} ({status}): {song} — {artist}\n")
        
        updates.write("\n" + ("-" * 40) + "\n\n")

print(f"Weekly updates with points and return statuses have been saved to {updates_file}")