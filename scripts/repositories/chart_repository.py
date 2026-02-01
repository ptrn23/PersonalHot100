import csv
import os

class ChartRepository:
    """handles reading and writing chart data"""
    
    @staticmethod
    def load_weekly_chart(filepath):
        """load chart data from csv as list of dicts"""
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)
    
    @staticmethod
    def save_weekly_chart(chart_entries, output_file):
        """save chart entries to csv"""
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                'Week', 'Position', 'Rise/Fall', 'Previous Rank', 'New Peak?', 'Re-peak?',
                'Total Weighted Points', '%',
                'Song', 'Artist', 'Album',
                'Streams', 'Sales', 'Airplay',
                'Streams Points', 'Sales Points', 'Airplay Points',
                'Streams Units', 'Sales Units', 'Airplay Units',
                'Streams %', 'Sales %', 'Airplay %',
                'Total Units',
                'Current Week Points', 'Previous Week Points', 'Two Weeks Ago Points',
                'Peak', 'WOC', 'Peak Streak'
            ])
            
            for entry in chart_entries:
                writer.writerow([
                    entry.week,
                    entry.position,
                    entry.status,
                    entry.previous_position,
                    entry.is_new_peak,
                    entry.is_repeak,
                    entry.points,
                    entry.percent_change,
                    entry.song.name,
                    entry.song.artist,
                    entry.song.album,
                    entry.song.streams,
                    entry.song.sales,
                    entry.song.airplay,
                    entry.streams_points,
                    entry.sales_points,
                    entry.airplay_points,
                    entry.streams_units,
                    entry.sales_units,
                    entry.airplay_units,
                    entry.streams_percent,
                    entry.sales_percent,
                    entry.airplay_percent,
                    entry.total_units,
                    entry.current_week_points,
                    entry.previous_week_points,
                    entry.two_weeks_ago_points,
                    entry.peak_position,
                    entry.weeks_on_chart,
                    entry.peak_streak
                ])
    
    @staticmethod
    def save_formatted_chart(chart_data, output_file, fieldnames=None):
        """save formatted chart data (list of dicts) to csv"""
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        if not chart_data:
            return
        
        if fieldnames is None:
            fieldnames = list(chart_data[0].keys())
        
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(chart_data)
    
    @staticmethod
    def save_charted_cache(charted_cache, output_file):
        """save history of first chart appearances"""
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Song', 'Artist', 'First_Week'])
            for (song, artist), week in sorted(charted_cache.items(), key=lambda x: x[1]):
                writer.writerow([song, artist, week])