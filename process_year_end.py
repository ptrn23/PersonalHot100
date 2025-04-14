import os
import csv
from collections import defaultdict
from points.utils import calculate_points
from points.album_cover import get_album_cover

YEAR_END_LIMIT = 100

def generate_year_end_csv(year, all_songs):
    year_end_data = []
    for (song, artist), data in all_songs.items():
        year_end_data.append({
            'Song': song,
            'Artist': artist,
            'Album Cover': data['album'],
            'Total Points': data['total_points'],
            'Peak': data['peak'],
            'Weeks on Chart': data['woc'],
            'Total Units': data['total_units'],
            'Total Airplay': data['total_airplay'] * 10,
            'Gain': data['gain']
        })

    year_end_data.sort(key=lambda x: x['Total Points'], reverse=True)
    year_end_data = year_end_data[:YEAR_END_LIMIT]

    for data in year_end_data:
        data['Album Cover'] = get_album_cover(data['Album Cover'], data['Artist'])

    os.makedirs('year_end', exist_ok=True)
    year_end_csv_file = f"year_end/{year}_year_end.csv"
    with open(year_end_csv_file, 'w', newline='', encoding='utf-8') as csvfile:
        csvwriter = csv.DictWriter(csvfile, fieldnames=[
            'Song', 'Artist', 'Album Cover', 'Total Points',
            'Peak', 'Weeks on Chart', 'Total Units', 'Total Airplay', 'Gain'
        ])
        csvwriter.writeheader()
        csvwriter.writerows(year_end_data)

    print(f"Year-end CSV for {year} has been saved to {year_end_csv_file}")


def load_all_songs_from_points(year):
    folder = f"points/{year}"
    all_songs = defaultdict(lambda: {
        'album': '',
        'total_points': 0,
        'peak': 999,
        'woc': 0,
        'total_units': 0,
        'total_airplay': 0,
        'gain': 0,
    })

    for filename in sorted(os.listdir(folder)):
        if filename.endswith('.csv'):
            with open(os.path.join(folder, filename), encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    song = row['Song'].strip()
                    artist = row['Artist'].strip()
                    key = (song, artist)

                    points = float(row['Total Weighted Points']) if row['Total Weighted Points'] else 0
                    streams = float(row['Streams']) if row['Streams'] else 0
                    sales = float(row['Sales']) if row['Sales'] else 0
                    airplay = float(row['Airplay']) if row['Airplay'] else 0

                    all_songs[key]['album'] = row['Album'].strip()
                    all_songs[key]['total_points'] += points
                    all_songs[key]['total_units'] += calculate_points(streams, sales, airplay)
                    all_songs[key]['total_airplay'] += airplay
                    all_songs[key]['gain'] = points
                    all_songs[key]['peak'] = min(all_songs[key]['peak'], int(row['Position']))
                    all_songs[key]['woc'] += 1

    return all_songs


if __name__ == "__main__":
    year = 2025
    all_songs = load_all_songs_from_points(year)
    generate_year_end_csv(year, all_songs)