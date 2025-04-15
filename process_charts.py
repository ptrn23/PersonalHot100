import csv
import os
from datetime import datetime
from collections import defaultdict
from key import API_KEY, API_SECRET
from points.album_cover import get_album_cover, get_dominant_color, rgb_to_hex

YEAR = 2022
POINTS_DIR = f'points/{YEAR}'
OUTPUT_FILE = f'charts/{YEAR}.csv'
COLORS_FILE = f'colors/{YEAR}_colors.txt'
COVER_CACHE_FILE = 'album_covers.csv'

INCLUDED_ARTISTS = ["Taylor Swift"]
INCLUDED_ALBUMS = ["ALL"]

GENERATE_COLORS = True

cover_cache = {}
if os.path.exists(COVER_CACHE_FILE):
    with open(COVER_CACHE_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = (row['Album'], row['Artist'])
            cover_cache[key] = row['Cover URL']

def format_week(week_str):
    dt = datetime.strptime(f"{YEAR}-{week_str}", "%Y-%m-%d")
    return dt.strftime("%y-%m-%d")

weekly_data = defaultdict(list)
weeks = []

for week_file in sorted(os.listdir(POINTS_DIR)):
    if not week_file.endswith(".csv"):
        continue

    week_str = week_file.replace(".csv", "")
    formatted_week = format_week(week_str)
    weeks.append(formatted_week)

    week_path = os.path.join(POINTS_DIR, week_file)
    with open(week_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            weekly_data[formatted_week].append((
                row['Song'],
                row['Artist'],
                row['Album'],
                int(row['Position'])
            ))

flourish_data = defaultdict(lambda: {"positions": [""] * len(weeks), "album": ""})

for week_idx, week in enumerate(weeks):
    for song, artist, album, position in weekly_data[week]:
        key = (song, artist)
        flourish_data[key]["positions"][week_idx] = position
        if flourish_data[key]["album"] == "":
            flourish_data[key]["album"] = album

with open(OUTPUT_FILE, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["Song Name", "Artist Name", "Album Name", "Image Link"] + weeks)

    for (song, artist), data in flourish_data.items():
        album = data["album"]
        if ("ALL" in INCLUDED_ARTISTS or artist in INCLUDED_ARTISTS) and \
           ("ALL" in INCLUDED_ALBUMS or album in INCLUDED_ALBUMS):

            cover_key = (album, artist)
            if cover_key in cover_cache:
                image_url = cover_cache[cover_key]
            else:
                image_url = get_album_cover(album, artist)
                cover_cache[cover_key] = image_url

            writer.writerow([song, artist, album, image_url] + data["positions"])

print(f"Chart data saved to {OUTPUT_FILE}")

with open(COVER_CACHE_FILE, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["Album", "Artist", "Image Link"])
    for (album, artist), url in cover_cache.items():
        writer.writerow([album, artist, url])

if GENERATE_COLORS:
    album_color_cache = {}

    with open(COLORS_FILE, 'w', encoding='utf-8') as f:
        for (song, artist), data in flourish_data.items():
            album = data["album"]

            if ("ALL" in INCLUDED_ARTISTS or artist in INCLUDED_ARTISTS) and \
               ("ALL" in INCLUDED_ALBUMS or album in INCLUDED_ALBUMS):

                if album in album_color_cache:
                    hex_color = album_color_cache[album]
                else:
                    cover_url = cover_cache.get((album, artist))
                    if cover_url:
                        dominant_rgb = get_dominant_color(cover_url)
                        hex_color = rgb_to_hex(dominant_rgb)
                        album_color_cache[album] = hex_color
                    else:
                        hex_color = "#ffffff"

                f.write(f"{song}: {hex_color}\n")

    print(f"Colors file saved to {COLORS_FILE}")