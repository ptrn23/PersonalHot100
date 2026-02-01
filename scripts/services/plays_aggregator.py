import csv
import os
from datetime import datetime, timedelta
from collections import defaultdict
from models.song import Song
from models.weekly_play import WeeklyPlay

class PlaysAggregator:
    """aggregates last.fm plays into weekly song statistics"""
    
    def __init__(self):
        self.weekly_plays = defaultdict(dict)  # {week_start: {song.key: WeeklyPlay}}
    
    def process_years(self, years, data_folder='data/'):
        """process multiple years of play data"""
        for year in years:
            input_file = f'{data_folder}{year}.csv'
            if os.path.exists(input_file):
                self._process_year_file(input_file, year)
    
    def _process_year_file(self, filepath, year):
        """process a single year's play data"""
        print(f"Processing {filepath}...")
        
        with open(filepath, 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            
            previous_song_key = None
            previous_week = None
            ongoing_streak = defaultdict(int)
            
            for row in reader:
                artist, album, song_name, timestamp = row
                date = datetime.strptime(timestamp, "%d %b %Y %H:%M")
                week_start = self._get_week_friday(date)
                
                # create or get song
                song = Song(song_name, artist, album)
                
                # get or create weekly play entry
                if song.key not in self.weekly_plays[week_start]:
                    self.weekly_plays[week_start][song.key] = WeeklyPlay(song, week_start)
                
                weekly_play = self.weekly_plays[week_start][song.key]
                
                # track streams (every play counts)
                weekly_play.streams += 1
                
                # track sales (unique song plays per week)
                if previous_week != week_start or previous_song_key != song.key:
                    weekly_play.sales += 1
                    # reset streak for previous song
                    if previous_song_key:
                        ongoing_streak[previous_song_key] = 0
                
                # track airplay (consecutive play streak)
                ongoing_streak[song.key] += 1
                weekly_play.airplay = max(weekly_play.airplay, ongoing_streak[song.key])
                
                previous_song_key = song.key
                previous_week = week_start
    
    def save_weekly_files(self, output_root='plays/'):
        """save aggregated weekly play data to csv files"""
        for week_start, plays_dict in sorted(self.weekly_plays.items()):
            year = week_start.year
            file_date = week_start.strftime("%m-%d")
            
            output_dir = os.path.join(output_root, str(year))
            os.makedirs(output_dir, exist_ok=True)
            output_file = os.path.join(output_dir, f"{file_date}.csv")
            
            with open(output_file, 'w', encoding='utf-8', newline='') as file:
                writer = csv.writer(file)
                writer.writerow(["Week", "Song Name", "Album Name", "Artist Name", 
                               "Streams", "Sales", "Airplay"])
                
                for weekly_play in plays_dict.values():
                    writer.writerow([
                        weekly_play.week_key,
                        weekly_play.song.name,
                        weekly_play.song.album,
                        weekly_play.song.artist,
                        weekly_play.streams,
                        weekly_play.sales,
                        weekly_play.airplay
                    ])
        
        print(f"Weekly files saved to '{output_root}' folder.")
    
    @staticmethod
    def _get_week_friday(date):
        """calculate the friday 6am that starts this chart week"""
        weekday = date.weekday()
        days_since_friday = (weekday - 4) % 7
        friday_6am = date - timedelta(days=days_since_friday)
        friday_6am = friday_6am.replace(hour=6, minute=0, second=0, microsecond=0)
        
        if date < friday_6am:
            friday_6am -= timedelta(days=7)
        
        return friday_6am