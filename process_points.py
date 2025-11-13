import os
import csv
from datetime import datetime

from services.points_calculator import PointsCalculator
from services.chart_builder import ChartBuilder
from repositories.chart_repository import ChartRepository
from models.weekly_play import WeeklyPlay
from models.song import Song

def main():
    years = [str(year) for year in range(2020, 2026)]
    chart_limit = 100
    charted_cache_file = "points/ever_charted.csv"
    
    # initialize services
    calculator = PointsCalculator()
    builder = ChartBuilder(calculator, chart_limit)
    builder.load_charted_cache(charted_cache_file)
    
    # process each year
    for year in years:
        plays_dir = f"plays/{year}"
        points_dir = f"points/{year}"
        os.makedirs(points_dir, exist_ok=True)
        
        if not os.path.exists(plays_dir):
            continue
        
        # process each week
        for filename in sorted(os.listdir(plays_dir)):
            if not filename.endswith(".csv"):
                continue
            
            filepath = os.path.join(plays_dir, filename)
            week_str = filename.replace(".csv", "")
            week_date = datetime.strptime(f"{year}-{week_str}", "%Y-%m-%d")
            week_key = week_date.strftime("%Y-%m-%d")
            
            # load weekly plays
            weekly_plays = load_weekly_plays(filepath, week_key)
            
            # build chart
            chart_entries = builder.build_weekly_chart(weekly_plays, week_key)
            
            # save chart
            output_file = os.path.join(points_dir, f"{week_str}.csv")
            ChartRepository.save_weekly_chart(chart_entries, output_file)
            
            print(f"Saved weekly points: {week_str}-{year}")
    
    # save charted cache
    ChartRepository.save_charted_cache(builder.charted_cache, charted_cache_file)
    print(f"Updated charted history cache: {charted_cache_file}")

def load_weekly_plays(filepath, week_key):
    """load weekly play data from CSV"""
    weekly_plays = {}
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # skip header
        
        for row in reader:
            week, song_name, album_name, artist_name, streams, sales, airplay = row
            
            song = Song(song_name, artist_name, album_name)
            week_start = datetime.strptime(week, "%Y-%m-%d")
            
            play = WeeklyPlay(song, week_start)
            play.streams = int(streams)
            play.sales = int(sales)
            play.airplay = int(airplay)
            
            weekly_plays[song.key] = play
    
    return weekly_plays

if __name__ == "__main__":
    main()