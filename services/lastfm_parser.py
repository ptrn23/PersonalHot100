import csv
from datetime import datetime, timedelta
from collections import defaultdict
from models.song import Song

class LastFmParser:
    """parses last.fm csv data and splits by year"""
    
    def __init__(self, time_offset_hours=8):
        self.time_offset = timedelta(hours=time_offset_hours)
    
    def parse_and_split(self, input_file, output_folder):
        """parse last.fm data and split into yearly files"""
        data_by_year = defaultdict(list)
        invalid_rows = []
        
        with open(input_file, 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            
            for row in reader:
                adjusted_dt = self._adjust_timestamp(row[3])
                if adjusted_dt:
                    row[3] = adjusted_dt.strftime("%d %b %Y %H:%M")
                    data_by_year[adjusted_dt.year].append(row)
                else:
                    invalid_rows.append(row)
        
        # write yearly files
        for year, rows in data_by_year.items():
            output_file = f'{output_folder}{year}.csv'
            with open(output_file, 'w', encoding='utf-8', newline='') as file:
                writer = csv.writer(file)
                writer.writerows(rows)
        
        return len(data_by_year), len(invalid_rows)
    
    def _adjust_timestamp(self, timestamp):
        """adjust timestamp with timezone offset"""
        try:
            dt = datetime.strptime(timestamp, "%d %b %Y %H:%M")
            return dt + self.time_offset
        except ValueError:
            return None