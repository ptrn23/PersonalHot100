from datetime import datetime

class WeeklyPlay:
    """represents aggregated play data for a song in a specific week"""
    def __init__(self, song, week_start):
        self.song = song
        self.week_start = week_start
        self.streams = 0
        self.sales = 0
        self.airplay = 0
    
    @property
    def week_key(self):
        return self.week_start.strftime("%Y-%m-%d")