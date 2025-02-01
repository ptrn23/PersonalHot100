import csv
from datetime import datetime, timedelta
from collections import defaultdict

input_file = 'data/2025.csv'
output_file = 'plays/2025_plays_by_week.csv'

def get_week_friday(date):
    # Week starts on Friday 00:00 AM
    days_to_friday = (4 - date.weekday()) % 7
    if days_to_friday < 0:
        days_to_friday += 7
    friday = date + timedelta(days=days_to_friday - 7) if date.weekday() >= 5 else date + timedelta(days=days_to_friday)
    return friday.replace(hour=0, minute=0, second=0, microsecond=0)

# Weekly data structure
weekly_data = defaultdict(lambda: defaultdict(lambda: {
    "streams": 0,
    "airplay": 0,
    "sales": 0,
    "current_streak": 0,
    "last_play_time": None,
    "session_active": False
}))

artist_mapping = {}

with open(input_file, 'r', encoding='utf-8') as file:
    reader = csv.reader(file)
    next(reader)
    
    previous_song = None
    previous_album = None
    previous_artist = None
    previous_week = None
    ongoing_streak = defaultdict(int)
    
    for row in reader:
        artist, album, song, timestamp = row
        date = datetime.strptime(timestamp, "%d %b %Y %H:%M")
        week_friday = get_week_friday(date)
        
        artist_mapping[(song, album, artist)] = artist
        
        song_data = weekly_data[week_friday][(song, album, artist)]
        
        song_data["streams"] += 1
        
        if previous_week != week_friday or previous_song != song or previous_album != album or previous_artist != artist:
            song_data["sales"] += 1
            
            ongoing_streak[(previous_song, previous_album, previous_artist)] = 0
        
        ongoing_streak[(song, album, artist)] += 1
        song_data["airplay"] = max(song_data["airplay"], ongoing_streak[(song, album, artist)])
        
        previous_song = song
        previous_album = album
        previous_artist = artist
        previous_week = week_friday

with open(output_file, 'w', encoding='utf-8', newline='') as file:
    writer = csv.writer(file)
    
    writer.writerow(["Week", "Song Name", "Album Name", "Artist Name", "Streams", "Sales", "Airplay"])
    
    for week, songs in sorted(weekly_data.items()):
        for (song, album, artist), data in songs.items():
            # Write the row
            writer.writerow([week.strftime("%Y-%m-%d"), song, album, artist, data["streams"], data["sales"], data["airplay"]])

print(f"Weekly data with updated metrics and artist names has been saved to {output_file}")
