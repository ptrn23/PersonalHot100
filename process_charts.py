import csv
from math import ceil
from datetime import datetime, timedelta
from collections import defaultdict
from key import API_KEY, API_SECRET

import requests
import pylast
import colorsys

from PIL import Image
from io import BytesIO
from collections import Counter

BASE_URL = 'http://ws.audioscrobbler.com/2.0/'

input_file = 'plays/2024_plays_by_week.csv'
output_file = 'charts/2024_charts.csv'
colors_file = 'colors/2024_colors.txt'

MAX_DEBUTS = 25
RETENTION_WEIGHTS = [1, 0.3, 0.2]
CHART_LIMIT = 100
FIRST_WEEK_DEBUT_LIMIT = 100

STREAMS_WEIGHT = 5000
SALES_WEIGHT = 3000
AIRPLAY_WEIGHT = 2000

INCLUDED_ARTISTS = ["Kelly Clarkson"]
INCLUDED_ALBUMS = ["ALL"]

# INCLUDED_ALBUMS = ["Fearless (Taylor's Version)", "Red (Taylor's Version)", "Speak Now (Taylor's Version)", "1989 (Taylor's Version)"]
# INCLUDED_ARTISTS = ["IVE", "LE SSERAFIM", "NewJeans", "ARTMS", "ITZY", "NMIXX", "aespa"]
# INCLUDED_ARTISTS = ["Loona", "LOOΠΔ 1/3", "LOOΠΔ / ODD EYE CIRCLE", "LOONA/yyxy"]
# INCLUDED_ARTISTS = ["Eraserheads", "Parokya ni Edgar", "December Avenue", "Rivermaya", "Kitchie Nadal", "Silent Sanctuary", "Gloc-9", "Callalily", "The Itchyworms", "Any Name's Okay", "BINI", "Maki"]
# INCLUDED_ARTISTS = ["Ariana Grande", "Olivia Rodrigo", "Beyoncé", "Katy Perry", "Dua Lipa", "Selena Gomez", "Sabrina Carpenter", "Billie Eilish"]
# INCLUDED_ARTISTS = ["Britney Spears", "Kelly Clarkson", "Vanessa Carlton", "Avril Lavigne", "Mariah Carey", "Fergie", "Whitney Houston", "Spice Girls", "Nelly Furtado", "Madonna"]

GENERATE_CHARTS = True
GENERATE_COLORS = True

weekly_data = defaultdict(list)

with open(input_file, 'r', encoding='utf-8') as file:
    reader = csv.reader(file)
    next(reader)
    
    for row in reader:
        week, song, album, artist, streams, sales, airplay = row
        streams = int(streams)
        sales = int(sales)
        airplay = int(airplay)
        weekly_data[week].append((song, album, artist, streams, sales, airplay))

all_songs = {}
ranked_weeks = []
weekly_points = defaultdict(float)
ever_charted_songs = set()

for week_index, week in enumerate(sorted(weekly_data.keys())):
    weighted_scores = {}
    
    for song, album, artist, streams, sales, airplay in weekly_data[week]:
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

def get_friday(date_str):
    """Takes a date string (YYYY-MM-DD) and returns the Friday of that week."""
    date = datetime.strptime(date_str, "%Y-%m-%d")
    days_to_friday = (4 - date.weekday()) % 7
    friday_date = date + timedelta(days=days_to_friday)
    return friday_date.strftime("%Y-%m-%d")

all_songs_ranked = {
    (song, artist)
    for _, ranked_songs in ranked_weeks
    for (song, artist), _, _ in ranked_songs
}

def get_album_cover(album_name, artist_name):
    params = {
        'method': 'album.getInfo',
        'api_key': API_KEY,
        'artist': artist_name,
        'album': album_name,
        'format': 'json'
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()

    if 'album' in data and 'image' in data['album']:
        images = data['album']['image']
        if images:
            return images[-1]['#text']
    return ""

flourish_data = {
    (song, artist): {"positions": [""] * len(ranked_weeks), "album": album}
    for week_data in weekly_data.values()
    for song, album, artist, _, _, _ in week_data
}

print(f"Chart data has been generated")

if GENERATE_CHARTS:
    weeks = [get_friday(week) for week, _ in ranked_weeks]

    for week_idx, (week, ranked_songs) in enumerate(ranked_weeks):
        for (song, artist), position, points in ranked_songs:
            flourish_data[(song, artist)]["positions"][week_idx] = position

    with open(output_file, 'w', encoding='utf-8', newline='') as file:
        writer = csv.writer(file)
        
        header = ["Song Name", "Artist Name", "Album Name", "Image Link"] + weeks
        writer.writerow(header)
        
        for (song, artist), data in flourish_data.items():
            album = data["album"]
            if ("ALL" in INCLUDED_ARTISTS or artist in INCLUDED_ARTISTS) and \
            ("ALL" in INCLUDED_ALBUMS or album in INCLUDED_ALBUMS):
                positions = data["positions"]
                writer.writerow([song, artist, album, get_album_cover(album, artist)] + positions)


    print(f"Flourish-compatible chart data with artist filtering has been saved to {output_file}")

network = pylast.LastFMNetwork(api_key=API_KEY, api_secret=API_SECRET)

def get_dominant_color(image_url, brightness_min = 75, brightness_max = 175, saturation_threshold = 0.15):
    """
    Fetch the most dominant bright hue of an image from a URL, avoiding white and dark colors.

    Args:
    - image_url: URL of the image to process.
    - brightness_threshold: Minimum brightness value for considering a color (0-255).
    - saturation_threshold: Minimum saturation value for considering a color (0-1).

    Returns:
    - Tuple (R, G, B) of the most dominant bright hue.
    """
    try:
        response = requests.get(image_url)
        image = Image.open(BytesIO(response.content))
        image = image.convert("RGB")
        pixels = list(image.getdata())

        pixel_counts = Counter(pixels)

        best_color = None
        best_score = -1

        for color, count in pixel_counts.items():
            r, g, b = color
            h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)

            brightness = l * 255
            if not (brightness_min < brightness < brightness_max):
                continue
            
            if s < saturation_threshold:
                continue
            
            score = count * s * (brightness / 255)
            if score > best_score:
                best_score = score
                best_color = color

        # Fallback to a default bright color if no suitable color is found
        return best_color if best_color else (255, 255, 255)
    
    except Exception as e:
        print(f'Error fetching bright and dominant hue: {str(e)}')
        return (255, 255, 255)

def rgb_to_hex(rgb):
    """Convert an RGB color to HEX format."""
    return f'#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}'

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