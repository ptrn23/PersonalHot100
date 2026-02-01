from key import API_KEY, API_SECRET
BASE_URL = 'http://ws.audioscrobbler.com/2.0/'

import requests
import pylast
import colorsys

from PIL import Image
from io import BytesIO
from collections import Counter

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

def get_dominant_color(image_url, brightness_min = 100, brightness_max = 175, saturation_threshold = 0.15):
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