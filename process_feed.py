import csv
import os
from key import CHART_NAME

YEAR = "2025"
WEEK = "07-18"
CSV_PATH = f"points/{YEAR}/{WEEK}.csv"
FEED_PATH = "feed.txt"

MILESTONE_WEEKS = {20, 30, 40, 50, 60, 70, 80, 90, 100}
SPECIAL_MILESTONES = {52: "one year", 104: "two years"}

def ordinal(n):
    if 10 <= n % 100 <= 20:
        suffix = 'th'
    else:
        suffix = {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')
    return f"{n}{suffix}"

def try_parse_float(value):
    try:
        return float(value)
    except:
        return None

def try_parse_int(value):
    try:
        return int(value)
    except:
        return None

def process_debuts(row):
    return row["Rise/Fall"].strip().upper() == "NEW"

def process_reentry(row):
    rise_fall = row["Rise/Fall"].strip().upper()
    return rise_fall in {"RE", "RE-ENTRY", "REENTRY"}

def is_new_peak(row):
    return row["New Peak?"].strip().lower() == "true"

def format_debut(row):
    return f'“{row["Song"]}” by {row["Artist"]} debuts at #{row["Position"]} in {CHART_NAME} Hot 100.'

def format_reentry(row):
    if is_new_peak(row):
        return f'“{row["Song"]}” by {row["Artist"]} reaches a new peak in {CHART_NAME} Hot 100, reentering at #{row["Position"]}.'
    else:
        return f'“{row["Song"]}” by {row["Artist"]} reenters {CHART_NAME} Hot 100 at #{row["Position"]}.'
    
def format_biggest_percentage_gainer(row):
    percent = try_parse_float(row["%"])
    points = try_parse_float(row["Total Weighted Points"])
    if percent is None or points is None:
        return None
    return f'“{row["Song"]}” by {row["Artist"]} is the biggest percentage gainer in {CHART_NAME} Hot 100 this week, rising {int(percent * 100)}% to {int(points)} points.'

def format_biggest_position_gainer(row):
    spots_up = try_parse_int(row["Rise/Fall"])
    pos = try_parse_int(row["Position"])
    if spots_up is None or pos is None:
        return None
    return f'“{row["Song"]}” by {row["Artist"]} is the biggest position gainer in {CHART_NAME} Hot 100 this week, rising {spots_up} spot{"s" if spots_up != 1 else ""} to #{pos}.'

def format_biggest_percentage_faller(row):
    percent = try_parse_float(row["%"])
    points = try_parse_float(row["Total Weighted Points"])
    if percent is None or points is None:
        return None
    return f'“{row["Song"]}” by {row["Artist"]} is the biggest percentage faller in {CHART_NAME} Hot 100 this week, dropping {abs(int(percent * 100))}% to {int(points)} points.'

def format_biggest_position_faller(row):
    spots_down = try_parse_int(row["Rise/Fall"])
    pos = try_parse_int(row["Position"])
    if spots_down is None or pos is None:
        return None
    return f'“{row["Song"]}” by {row["Artist"]} drops {abs(spots_down)} spot{"s" if abs(spots_down) != 1 else ""} to #{pos} — the biggest drop this week in {CHART_NAME} Hot 100.'

def format_number_one_update(row):
    position = try_parse_int(row["Position"])
    prev_rank = try_parse_int(row["Previous Rank"])
    peak = try_parse_int(row["Peak"])
    peak_streak = try_parse_int(row["Peak Streak"])

    if position != 1 or peak != 1:
        return None

    song = row["Song"]
    artist = row["Artist"]

    if peak_streak == 1:
        return f'“{song}” by {artist} reaches #1 in the {CHART_NAME} Hot 100 for the first time.'
    elif prev_rank == 1:
        return f'“{song}” by {artist} spends a {ordinal(peak_streak)} week at #1 in the {CHART_NAME} Hot 100.'
    else:
        return f'“{song}” by {artist} returns to #1 in the {CHART_NAME} Hot 100 for a {ordinal(peak_streak)} nonconsecutive week at the top.'

def format_milestone_weeks(row):
    woc = try_parse_int(row["WOC"])
    if woc is None:
        return None

    song = row["Song"]
    artist = row["Artist"]

    if woc in SPECIAL_MILESTONES:
        return f'“{song}” by {artist} has now completed {SPECIAL_MILESTONES[woc]} ({woc} weeks of charting) in {CHART_NAME} Hot 100.'
    elif woc in MILESTONE_WEEKS:
        return f'“{song}” by {artist} spends its {ordinal(woc)} week in {CHART_NAME} Hot 100 this week.'
    
    return None

def format_climber_new_peak(row):
    spots_up = int(row["Rise/Fall"])
    return f'“{row["Song"]}” by {row["Artist"]} reaches a new peak in {CHART_NAME} Hot 100, rising {spots_up} spot{"s" if spots_up != 1 else ""} to #{row["Position"]}.'

def format_top_10_or_5_climber(row):
    pos = try_parse_int(row["Position"])
    prev = try_parse_int(row["Previous Rank"])

    if pos is None or prev is None:
        return None

    song = row["Song"]
    artist = row["Artist"]

    if pos <= 5 and prev > 5:
        spots_up = int(row["Rise/Fall"])
        return f'“{song}” by {artist} climbs inside the top 5 of {CHART_NAME} Hot 100, rising {spots_up} spot{"s" if spots_up != 1 else ""} to #{row["Position"]}.'
    elif pos <= 10 and prev > 10:
        spots_up = int(row["Rise/Fall"])
        return f'“{song}” by {artist} climbs inside the top 10 of {CHART_NAME} Hot 100, rising {spots_up} spot{"s" if spots_up != 1 else ""} to #{row["Position"]}.'

    return None

def is_regular_climber_new_peak(row):
    rise_fall = row["Rise/Fall"].strip().upper()
    if rise_fall in {"NEW", "RE", "REENTRY", "RE-ENTRY"}:
        return False
    if not is_new_peak(row):
        return False
    try:
        return int(rise_fall) > 0
    except ValueError:
        return False

def write_feed(lines, out_file):
    with open(out_file, "w", encoding="utf-8") as f:
        for line in lines:
            f.write(line + "\n")

def main():
    if not os.path.exists(CSV_PATH):
        print(f"CSV file not found: {CSV_PATH}")
        return

    feed_lines = []
    with open(CSV_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        rows = list(reader)
        
        for row in rows:
            if process_debuts(row):
                feed_lines.append(format_debut(row))
            elif format_number_one_update(row):
                feed_lines.append(format_number_one_update(row))
            elif process_reentry(row):
                feed_lines.append(format_reentry(row))
            elif format_top_10_or_5_climber(row):
                feed_lines.append(format_top_10_or_5_climber(row))
            elif is_regular_climber_new_peak(row):
                feed_lines.append(format_climber_new_peak(row))
            
            line = format_milestone_weeks(row)
            if line:
                feed_lines.append(line)

        percentage_gainer_row = max(rows, key=lambda r: try_parse_float(r["%"]) or 0)
        percentage_line = format_biggest_percentage_gainer(percentage_gainer_row)
        if percentage_line:
            feed_lines.append(percentage_line)

        position_gainer_row = max(rows, key=lambda r: try_parse_int(r["Rise/Fall"]) or 0)
        position_line = format_biggest_position_gainer(position_gainer_row)
        if position_line:
            feed_lines.append(position_line)
            
        biggest_faller_by_percent = min(rows, key=lambda r: try_parse_float(r["%"]) or float('inf'))
        biggest_faller_by_position = min(rows, key=lambda r: try_parse_int(r["Rise/Fall"]) or 0)
        
        line = format_biggest_percentage_faller(biggest_faller_by_percent)
        if line:
            feed_lines.append(line)

        line = format_biggest_position_faller(biggest_faller_by_position)
        if line:
            feed_lines.append(line)


    write_feed(feed_lines, FEED_PATH)
    print(f"Feed written to {FEED_PATH} with {len(feed_lines)} update(s).")

if __name__ == "__main__":
    main()