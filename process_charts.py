import csv
from datetime import datetime, timedelta
from collections import defaultdict

import requests
from key import API_KEY, API_SECRET

import pylast
from PIL import Image
from io import BytesIO
from collections import Counter
from colorsys import rgb_to_hls

BASE_URL = 'http://ws.audioscrobbler.com/2.0/'

input_file = 'plays/2024_plays_by_week.csv'
output_file = 'charts/2024_charts.csv'
colors_file = 'colors/2024_colors.txt'

MAX_DEBUTS = 25
RETENTION_WEIGHTS = [0.5, 0.3, 0.2]
CHART_LIMIT = 100
FIRST_WEEK_DEBUT_LIMIT = 100

STREAMS_WEIGHT = 0.5
SALES_WEIGHT = 0.3
AIRPLAY_WEIGHT = 0.2

INCLUDED_ARTISTS = ["Taylor Swift"]
INCLUDED_ALBUMS = ["THE TORTURED POETS DEPARTMENT: THE ANTHOLOGY"]
# INCLUDED_ALBUMS = ["Fearless (Taylor's Version)", "Red (Taylor's Version)", "Speak Now (Taylor's Version)", "1989 (Taylor's Version)"]
# INCLUDED_ARTISTS = ["Loona", "LOOΠΔ 1/3", "LOOΠΔ / ODD EYE CIRCLE", "LOONA/yyxy"]
# INCLUDED_ARTISTS = ["Eraserheads", "Parokya ni Edgar", "December Avenue", "Rivermaya", "Kitchie Nadal", "Silent Sanctuary", "Gloc-9", "Callalily", "The Itchyworms", "Any Name's Okay", "BINI", "Maki"]

GENERATE_COLORS = False

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
song_history = defaultdict(lambda: [0, 0])
ranked_weeks = []

for week_index, week in enumerate(sorted(weekly_data.keys())):
    weighted_scores = {}
    for song, album, artist, streams, sales, airplay in weekly_data[week]:
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
    
    for song, album, artist, streams, sales, airplay in weekly_data[week]:
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

    # Extract the largest image URL
    if 'album' in data and 'image' in data['album']:
        images = data['album']['image']
        if images:
            return images[-1]['#text']  # Largest image is usually the last one
    return ""  # Fallback if no image is found

flourish_data = {
    (song, artist): {"positions": [""] * len(ranked_weeks), "album": album}
    for week_data in weekly_data.values()
    for song, album, artist, _, _, _ in week_data
}

print(f"Chart data has been generated")

weeks = [get_friday(week) for week, _ in ranked_weeks]

for week_idx, (week, ranked_songs) in enumerate(ranked_weeks):
    for (song, artist), position in ranked_songs:
        flourish_data[(song, artist)]["positions"][week_idx] = position

with open(output_file, 'w', encoding='utf-8', newline='') as file:
    writer = csv.writer(file)
    
    header = ["Song Name", "Artist Name", "Album Name", "Image Link"] + weeks
    writer.writerow(header)
    
    for (song, artist), data in flourish_data.items():
        album = data["album"]  # Get the associated album name
        if ("ALL" in INCLUDED_ARTISTS or artist in INCLUDED_ARTISTS) and \
        ("ALL" in INCLUDED_ALBUMS or album in INCLUDED_ALBUMS):
            positions = data["positions"]
            writer.writerow([song, artist, album, get_album_cover(album, artist)] + positions)


print(f"Flourish-compatible chart data with artist filtering has been saved to {output_file}")

network = pylast.LastFMNetwork(api_key=API_KEY, api_secret=API_SECRET)

def get_dominant_color(image_url, brightness_threshold=100):
    """
    Fetch the most dominant and bright color of an image from a URL.

    Args:
    - image_url: URL of the image to process.
    - brightness_threshold: Minimum brightness value for considering a color.

    Returns:
    - Tuple (R, G, B) of the most dominant bright color.
    """
    try:
        # Fetch and load the image
        response = requests.get(image_url)
        image = Image.open(BytesIO(response.content))
        image = image.convert("RGB")  # Ensure image is in RGB mode
        pixels = list(image.getdata())  # Get all pixels as (R, G, B) tuples

        # Count pixel occurrences
        pixel_counts = Counter(pixels)

        # Calculate weighted scores for colors
        best_color = None
        best_score = -1
        for color, count in pixel_counts.items():
            r, g, b = color
            brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b

            # Ignore colors below the brightness threshold
            if brightness < brightness_threshold:
                continue

            # Calculate a score combining brightness and frequency
            score = count * (brightness / 255)
            if score > best_score:
                best_score = score
                best_color = color

        # Fallback in case no colors pass the threshold
        return best_color if best_color else (255, 255, 255)
    except Exception as e:
        print(f'Error fetching bright and dominant color: {str(e)}')
        return (255, 255, 255)  # Default to white on error

def rgb_to_hex(rgb):
    """Convert an RGB color to HEX format."""
    return f'#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}'

if (GENERATE_COLORS):
    with open(colors_file, 'w', encoding='utf-8', newline='') as file:
        for (song, artist), data in flourish_data.items():  # Iterate correctly with 'data' as part of the loop
            album = data["album"]  # Get the associated album name
            if ("ALL" in INCLUDED_ARTISTS or artist in INCLUDED_ARTISTS) and \
            ("ALL" in INCLUDED_ALBUMS or album in INCLUDED_ALBUMS):
                # print(f"Processing {song} by {artist}...")
                album_cover_url = get_album_cover(album, artist)  # Pass the correct arguments for album cover
                if album_cover_url:
                    dominant_color = get_dominant_color(album_cover_url)
                    hex_color = rgb_to_hex(dominant_color)
                    file.write(f"{song}: {hex_color}\n")
                else:
                    file.write(f"{song}: #ffffff\n")

    print(f"Colors file saved at {colors_file}")