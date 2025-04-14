import csv
import os
import requests
from collections import defaultdict
from key import API_KEY, API_SECRET
from points.album_cover import get_album_cover, get_dominant_color, rgb_to_hex

BASE_URL = 'http://ws.audioscrobbler.com/2.0/'

points_dir = 'points/2025'
output_file = 'charts/2025.csv'
colors_file = 'colors/2025_colors.txt'

INCLUDED_ARTISTS = ["Matchbox Twenty"]
INCLUDED_ALBUMS = ["ALL"]

GENERATE_COLORS = True

weekly_data = defaultdict(list)
weeks = []

for week_file in sorted(os.listdir(points_dir)):
    if not week_file.endswith(".csv"):
        continue

    week_path = os.path.join(points_dir, week_file)
    week_str = week_file.replace(".csv", "")

    with open(week_path, 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        next(reader)

        week_data = []
        for row in reader:
            week, position, rise_fall, prev_rank, total_points, song, artist, album, *rest = row
            week_data.append((song, artist, album, int(position)))
        
        weekly_data[week_str] = week_data
        weeks.append(week_str)

flourish_data = defaultdict(lambda: {"positions": [""] * len(weeks), "album": ""})

for week_idx, (week_str, week_data) in enumerate(weekly_data.items()):
    for song, artist, album, position in week_data:
        flourish_data[(song, artist)]["positions"][week_idx] = position
        if flourish_data[(song, artist)]["album"] == "":
            flourish_data[(song, artist)]["album"] = album

with open(output_file, 'w', encoding='utf-8', newline='') as file:
    writer = csv.writer(file)
    
    header = ["Song Name", "Artist Name", "Album Name", "Image Link"] + weeks
    writer.writerow(header)

    for (song, artist), data in flourish_data.items():
        album = data["album"]
        if ("ALL" in INCLUDED_ARTISTS or artist in INCLUDED_ARTISTS) and \
        ("ALL" in INCLUDED_ALBUMS or album in INCLUDED_ALBUMS):
            positions = data["positions"]
            image_url = get_album_cover(album, artist)
            writer.writerow([song, artist, album, image_url] + positions)

print(f"Chart data has been saved to {output_file}")

if GENERATE_COLORS:
    album_color_cache = {}

    with open(colors_file, 'w', encoding='utf-8', newline='') as file:
        for (song, artist), data in flourish_data.items():
            album = data["album"]
            
            if ("ALL" in INCLUDED_ARTISTS or artist in INCLUDED_ARTISTS) and \
            ("ALL" in INCLUDED_ALBUMS or album in INCLUDED_ALBUMS):
                if album in album_color_cache:
                    hex_color = album_color_cache[album]
                else:
                    album_cover_url = get_album_cover(album, artist)
                    if album_cover_url:
                        dominant_color = get_dominant_color(album_cover_url)
                        hex_color = rgb_to_hex(dominant_color)
                        album_color_cache[album] = hex_color
                    else:
                        hex_color = "#ffffff"
                
                file.write(f"{song}: {hex_color}\n")

    print(f"Colors file saved at {colors_file}")