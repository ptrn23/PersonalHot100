import csv
from datetime import datetime, timedelta
from collections import defaultdict

input_file = 'plays/2024_plays_by_week.csv'
output_file = 'charts/2024_charts.csv'

MAX_DEBUTS = 10
RETENTION_WEIGHTS = [0.5, 0.3, 0.2]
CHART_LIMIT = 100
FIRST_WEEK_DEBUT_LIMIT = 100

STREAMS_WEIGHT = 0.5
SALES_WEIGHT = 0.3
AIRPLAY_WEIGHT = 0.2

# List of artists to include in the output; "ALL" includes every artist
INCLUDED_ARTISTS = ["LE SSERAFIM"]  # Replace with specific artist names to filter
# INCLUDED_ARTISTS = ["Loona", "LOOΠΔ 1/3", "LOOΠΔ / ODD EYE CIRCLE", "LOONA/yyxy"]

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
song_history = defaultdict(lambda: [0, 0])
ranked_weeks = []

for week_index, week in enumerate(sorted(weekly_data.keys())):
    weighted_scores = {}
    for song, artist, streams, sales, airplay in weekly_data[week]:
        current_points = (
            STREAMS_WEIGHT * streams +
            SALES_WEIGHT * sales +
            AIRPLAY_WEIGHT * airplay
        )
        previous_points = song_history[song][0]
        two_weeks_ago_points = song_history[song][1]
        
        weighted_points = (
            RETENTION_WEIGHTS[0] * current_points +
            RETENTION_WEIGHTS[1] * previous_points +
            RETENTION_WEIGHTS[2] * two_weeks_ago_points
        )
        weighted_scores[(song, artist)] = weighted_points

    sorted_songs = sorted(weighted_scores.items(), key=lambda x: x[1], reverse=True)
    
    debuts = [(song_artist, points) for song_artist, points in sorted_songs if song_artist[0] not in all_songs]
    returning = [(song_artist, points) for song_artist, points in sorted_songs if song_artist[0] in all_songs]
    
    if week_index == 0:
        limited_debuts = debuts[:FIRST_WEEK_DEBUT_LIMIT]
    else:
        limited_debuts = debuts[:MAX_DEBUTS]
    
    all_songs.update({song: artist for (song, artist), _ in limited_debuts})
    
    ranked_songs = limited_debuts + returning
    ranked_songs.sort(key=lambda x: x[1], reverse=True)
    
    top_songs = ranked_songs[:CHART_LIMIT]
    overflow_songs = ranked_songs[CHART_LIMIT:]
    top_songs = [((song, artist), rank + 1) for rank, ((song, artist), _) in enumerate(top_songs)]
    
    ranked_weeks.append((week, top_songs))
    
    for song, artist, streams, sales, airplay in weekly_data[week]:
        current_points = (
            STREAMS_WEIGHT * streams +
            SALES_WEIGHT * sales +
            AIRPLAY_WEIGHT * airplay
        )
        song_history[song] = [current_points, song_history[song][0]]

def get_friday(date_str):
    """Takes a date string (YYYY-MM-DD) and returns the Friday of that week."""
    date = datetime.strptime(date_str, "%Y-%m-%d")
    days_to_friday = (4 - date.weekday()) % 7
    friday_date = date + timedelta(days=days_to_friday)
    return friday_date.strftime("%Y-%m-%d")

all_songs_ranked = {
    (song, artist)
    for _, ranked_songs in ranked_weeks
    for (song, artist), _ in ranked_songs
}

flourish_data = {(song, artist): [""] * len(ranked_weeks) for (song, artist) in all_songs_ranked}
weeks = [get_friday(week) for week, _ in ranked_weeks]

for week_idx, (week, ranked_songs) in enumerate(ranked_weeks):
    for (song, artist), position in ranked_songs:
        flourish_data[(song, artist)][week_idx] = position

with open(output_file, 'w', encoding='utf-8', newline='') as file:
    writer = csv.writer(file)
    
    # Write header: "Song Name", "Artist Name", "Image Link", "YYYY-MM-DD", "YYYY-MM-DD", ...
    header = ["Song Name", "Artist Name", "Image Link"] + weeks
    writer.writerow(header)
    
    for (song, artist), positions in flourish_data.items():
        if "ALL" in INCLUDED_ARTISTS or artist in INCLUDED_ARTISTS:
            writer.writerow([song, artist, ""] + positions)

print(f"Flourish-compatible chart data with artist filtering has been saved to {output_file}")