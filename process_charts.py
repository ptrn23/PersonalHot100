import csv
import os
from datetime import datetime
from collections import defaultdict
from key import API_KEY, API_SECRET
from points.album_cover import get_album_cover, get_dominant_color, rgb_to_hex

YEAR = 2025
POINTS_DIR = f'points/{YEAR}'
OUTPUT_FILE = f'charts/{YEAR}.csv'
COLORS_FILE = f'colors/{YEAR}_colors.txt'
ALBUM_COVERS_FILE = "album_covers.csv"

INCLUDED_ARTISTS = ["Sabrina Carpenter"]
INCLUDED_ALBUMS = ["ALL"]

GENERATE_COLORS = True

def load_album_cover_cache():
    album_cover_cache = {}
    if os.path.exists(ALBUM_COVERS_FILE):
        with open(ALBUM_COVERS_FILE, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader)
            for row in reader:
                album, artist, cover_url = row
                album_cover_cache[(album, artist)] = cover_url
    return album_cover_cache

def save_album_cover_cache(album_cover_cache):
    with open(ALBUM_COVERS_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(['Album', 'Artist', 'Cover URL'])
        for (album, artist), cover_url in album_cover_cache.items():
            writer.writerow([album, artist, cover_url])

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
    
    album_cover_cache = load_album_cover_cache()

    for (song, artist), data in flourish_data.items():
        album = data["album"]
        if ("ALL" in INCLUDED_ARTISTS or artist in INCLUDED_ARTISTS) and \
           ("ALL" in INCLUDED_ALBUMS or album in INCLUDED_ALBUMS):

            key = (album, artist)
            
            if key in album_cover_cache:
                cover_url = album_cover_cache[key]
            else:
                cover_url = get_album_cover(album, artist)
                album_cover_cache[key] = cover_url

            writer.writerow([song, artist, album, cover_url] + data["positions"])

print(f"Chart data saved to {OUTPUT_FILE}")

save_album_cover_cache(album_cover_cache)

if GENERATE_COLORS:
    album_color_cache = {}
    album_cover_cache = load_album_cover_cache()

    with open(COLORS_FILE, 'w', encoding='utf-8') as f:
        for (song, artist), data in flourish_data.items():
            album = data["album"]

            if ("ALL" in INCLUDED_ARTISTS or artist in INCLUDED_ARTISTS) and \
               ("ALL" in INCLUDED_ALBUMS or album in INCLUDED_ALBUMS):

                if album in album_color_cache:
                    hex_color = album_color_cache[album]
                else:
                    cover_url = album_cover_cache.get((album, artist))
                    if cover_url:
                        dominant_rgb = get_dominant_color(cover_url)
                        hex_color = rgb_to_hex(dominant_rgb)
                        album_color_cache[album] = hex_color
                    else:
                        hex_color = "#ffffff"

                f.write(f"{song}: {hex_color}\n")

    print(f"Colors file saved to {COLORS_FILE}")