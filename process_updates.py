import os
import csv
from datetime import datetime, timedelta

YEAR = "2025"
POINTS_DIR = f'points/{YEAR}'
UPDATES_FILE = f'updates/{YEAR}.txt'
CHART_LIMIT = 100

def get_friday(date_str):
    date = datetime.strptime(date_str, "%Y-%m-%d")
    days_to_friday = (4 - date.weekday()) % 7
    friday_date = date + timedelta(days=days_to_friday)
    return friday_date.strftime("%Y-%m-%d")

ranked_weeks = []

for filename in sorted(os.listdir(POINTS_DIR)):
    if filename.endswith('.csv'):
        week = filename.replace('.csv', '')
        filepath = os.path.join(POINTS_DIR, filename)
        weekly_chart = []

        with open(filepath, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                position = int(row['Position'])
                is_new_peak = row['New Peak?']
                song = row['Song']
                artist = row['Artist']
                total_points = row['Total Weighted Points']
                rise_fall = row['Rise/Fall']
                weekly_chart.append({
                    'position': position,
                    'is_new_peak': is_new_peak,
                    'song': song,
                    'artist': artist,
                    'points': total_points,
                    'status': rise_fall
                })

        ranked_weeks.append((week, weekly_chart))

with open(UPDATES_FILE, 'w', encoding='utf-8') as updates:
    for week, chart in ranked_weeks:
        update_date = get_friday(f'{YEAR}-{week}')
        updates.write(f"Billboard Hot 100 — {datetime.strptime(update_date, '%Y-%m-%d').strftime('%B %d, %Y')}\n\n")
        for entry in chart[:CHART_LIMIT]:
            if entry['is_new_peak'] == "True":
                updates.write(f"#{entry['position']} ({entry['status']}): {entry['song']} — {entry['points']} *new peak*\n")
            else:
                updates.write(f"#{entry['position']} ({entry['status']}): {entry['song']} — {entry['points']}\n")
        updates.write("\n" + ("-" * 40) + "\n\n")

print(f"Weekly updates have been saved to {UPDATES_FILE}")