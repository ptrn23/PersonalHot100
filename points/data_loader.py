import csv
from collections import defaultdict

def load_weekly_play_data(file_path):
    weekly_data = defaultdict(list)
    with open(file_path, 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        next(reader)
        for row in reader:
            week, song, album, artist, streams, sales, airplay = row
            weekly_data[week].append((
                song, album, artist,
                int(streams), int(sales), int(airplay)
            ))
    return weekly_data