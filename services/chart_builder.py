import csv
import os
from datetime import datetime
from collections import defaultdict
from models.song import Song
from models.chart_entry import ChartEntry
from models.weekly_play import WeeklyPlay

class ChartBuilder:
    """builds weekly charts from play data"""
    
    def __init__(self, points_calculator, chart_limit=100):
        self.calculator = points_calculator
        self.chart_limit = chart_limit
        self.all_songs_history = defaultdict(lambda: {
            "peak": chart_limit + 1,
            "woc": 0,
            "peak_streak": 0,
            "album": ""
        })
        self.ranked_weeks = []
        self.original_song_names = {}
        self.charted_cache = {}
    
    def load_charted_cache(self, cache_file):
        """load history of when songs first charted"""
        if os.path.exists(cache_file):
            with open(cache_file, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                next(reader)
                for row in reader:
                    song, artist, first_week = row
                    key = (song.lower(), artist)
                    self.charted_cache[key] = first_week
    
    def build_weekly_chart(self, weekly_plays, week_key):
        """build a chart from weekly play data"""
        # aggregate by song key
        aggregated = {}
        for play in weekly_plays.values():
            song = play.song
            key = song.key
            
            if key not in aggregated:
                aggregated[key] = {
                    'song': song,
                    'streams': 0,
                    'sales': 0,
                    'airplay': 0
                }
                self.original_song_names[key] = song.name
            
            aggregated[key]['streams'] += play.streams
            aggregated[key]['sales'] += play.sales
            aggregated[key]['airplay'] += play.airplay
        
        # calculate points
        scored_songs = {}
        raw_data = {}
        
        for key, data in aggregated.items():
            song = data['song']
            streams, sales, airplay = data['streams'], data['sales'], data['airplay']
            
            # get historical points
            prev_pts, two_weeks_pts = self._get_past_points(key)
            
            # calculate points
            raw_points = self.calculator.calculate_raw_points(streams, sales, airplay)
            weighted_points = self.calculator.calculate_weighted_points(
                raw_points, prev_pts, two_weeks_pts
            )
            
            scored_songs[key] = weighted_points
            raw_data[key] = {
                'streams': streams,
                'sales': sales,
                'airplay': airplay,
                'raw_points': raw_points,
                'prev_pts': prev_pts,
                'two_weeks_pts': two_weeks_pts,
                'weighted_points': weighted_points
            }
            
            # update album
            if not self.all_songs_history[key]["album"]:
                self.all_songs_history[key]["album"] = song.album
        
        # rank songs
        ranked = sorted(
            scored_songs.items(),
            key=lambda x: (
                x[1],  # weighted points
                raw_data[x[0]]['raw_points'],  # raw points as tiebreaker
                x[0][0],  # song name
                x[0][1]   # artist
            ),
            reverse=True
        )[:self.chart_limit]
        
        # build chart entries
        chart_entries = []
        prev_week_positions = self._get_previous_week_positions()
        
        for rank, (key, points) in enumerate(ranked, start=1):
            entry = self._create_chart_entry(
                key, rank, raw_data[key], prev_week_positions, week_key
            )
            chart_entries.append(entry)
        
        # store this week's rankings
        self.ranked_weeks.append((
            week_key,
            [(key, rank, points) for rank, (key, points) in enumerate(ranked, start=1)]
        ))
        
        return chart_entries
    
    def _create_chart_entry(self, key, rank, data, prev_positions, week_key):
        """create a ChartEntry with all metrics"""
        song_name = self.original_song_names.get(key, key[0])
        artist = key[1]
        album = self.all_songs_history[key]["album"]
        
        # create song object
        song = Song(song_name, artist, album)
        song.streams = data['streams']
        song.sales = data['sales']
        song.airplay = data['airplay']
        
        # create entry
        entry = ChartEntry(song, rank, data['weighted_points'], week_key)
        
        # update peak and weeks on chart
        is_new_peak, is_repeak = self._update_peak_and_woc(key, rank)
        entry.is_new_peak = is_new_peak
        entry.is_repeak = is_repeak
        entry.peak_position = self.all_songs_history[key]["peak"]
        entry.weeks_on_chart = self.all_songs_history[key]["woc"]
        entry.peak_streak = self.all_songs_history[key]["peak_streak"]
        
        # calculate component points
        components = self.calculator.calculate_component_points(
            data['streams'], data['sales'], data['airplay']
        )
        entry.streams_points = components['streams']
        entry.sales_points = components['sales']
        entry.airplay_points = components['airplay']
        
        # calculate units
        units = self.calculator.calculate_units(
            data['streams'], data['sales'], data['airplay'],
            song, album, artist
        )
        entry.streams_units = units['streams']
        entry.sales_units = units['sales']
        entry.airplay_units = units['airplay']
        entry.total_units = units['total']
        
        # calculate percentages
        percentages = self.calculator.calculate_percentages(
            data['streams'], data['sales'], data['airplay']
        )
        entry.streams_percent = percentages['streams']
        entry.sales_percent = percentages['sales']
        entry.airplay_percent = percentages['airplay']
        
        # historical points
        entry.current_week_points = data['raw_points']
        entry.previous_week_points = int(data['prev_pts'] * 0.3)
        entry.two_weeks_ago_points = int(data['two_weeks_pts'] * 0.2)
        
        # previous position
        entry.previous_position = prev_positions.get(key, "--")
        
        # percent change
        if data['prev_pts'] > 0:
            entry.percent_change = round(
                (data['weighted_points'] - data['prev_pts']) / data['prev_pts'], 2
            )
        else:
            entry.percent_change = "--"
        
        # update charted cache
        if key not in self.charted_cache or week_key < self.charted_cache[key]:
            self.charted_cache[key] = week_key
        
        return entry
    
    def _get_past_points(self, song_key):
        """get points from previous weeks for decay calculation"""
        if len(self.ranked_weeks) == 0:
            return 0, 0
        
        prev_pts = 0
        two_weeks_pts = 0
        
        # check last week
        if len(self.ranked_weeks) >= 1:
            for key, rank, points in self.ranked_weeks[-1][1]:
                if key == song_key:
                    prev_pts = points
                    break
        
        # check two weeks ago
        if len(self.ranked_weeks) >= 2:
            for key, rank, points in self.ranked_weeks[-2][1]:
                if key == song_key:
                    two_weeks_pts = points
                    break
        
        return prev_pts, two_weeks_pts
    
    def _get_previous_week_positions(self):
        """get position map from previous week"""
        if not self.ranked_weeks:
            return {}
        return {key: pos for key, pos, _ in self.ranked_weeks[-1][1]}
    
    def _update_peak_and_woc(self, song_key, current_rank):
        """update peak position and weeks on chart"""
        history = self.all_songs_history[song_key]
        history["woc"] += 1
        
        is_new_peak = False
        is_repeak = False
        
        if current_rank < history["peak"]:
            is_new_peak = True
            history["peak"] = current_rank
            history["peak_streak"] = 1
        elif current_rank == history["peak"]:
            is_repeak = True
            history["peak_streak"] += 1
        
        return is_new_peak, is_repeak