import csv
import os
from datetime import datetime, timedelta
from collections import defaultdict

input_file = 'data/2025.csv'
output_root = 'plays'

def get_week_friday(date):
    # Set base week start to Friday 6AM
    # Friday = weekday() == 4
    weekday = date.weekday()
    days_since_friday = (weekday - 4) % 7
    friday_6am = date - timedelta(days=days_since_friday)
    friday_6am = friday_6am.replace(hour=6, minute=0, second=0, microsecond=0)

    if date < friday_6am:
        friday_6am -= timedelta(days=7)

    return friday_6am

weekly_data = defaultdict(lambda: defaultdict(lambda: {
    "streams": 0,
    "airplay": 0,
    "sales": 0,
    "current_streak": 0
}))

artist_mapping = {}

with open(input_file, 'r', encoding='utf-8') as file:
    reader = csv.reader(file)
    
    previous_song = previous_album = previous_artist = previous_week = None
    ongoing_streak = defaultdict(int)

    for row in reader:
        artist, album, song, timestamp = row
        date = datetime.strptime(timestamp, "%d %b %Y %H:%M")
        week_friday = get_week_friday(date)

        artist_mapping[(song, album, artist)] = artist
        song_key = (song, album, artist)
        song_data = weekly_data[week_friday][song_key]
        song_data["streams"] += 1

        if previous_week != week_friday or previous_song != song or previous_album != album or previous_artist != artist:
            song_data["sales"] += 1
            ongoing_streak[(previous_song, previous_album, previous_artist)] = 0

        ongoing_streak[song_key] += 1
        song_data["airplay"] = max(song_data["airplay"], ongoing_streak[song_key])

        previous_song = song
        previous_album = album
        previous_artist = artist
        previous_week = week_friday

for week_start, songs in sorted(weekly_data.items()):
    year = week_start.year

    file_date = (week_start + timedelta(days=0)).strftime("%m-%d")
    output_dir = os.path.join(output_root, str(year))
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, f"{file_date}.csv")

    with open(output_file, 'w', encoding='utf-8', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["Week", "Song Name", "Album Name", "Artist Name", "Streams", "Sales", "Airplay"])

        for (song, album, artist), data in songs.items():
            writer.writerow([
                week_start.strftime("%Y-%m-%d"),
                song, album, artist,
                data["streams"], data["sales"], data["airplay"]
            ])

print("Weekly files saved to the 'plays/' folder.")