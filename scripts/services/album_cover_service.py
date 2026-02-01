import csv
import os
from points.album_cover import get_album_cover

class AlbumCoverService:
    """manages album cover urls with caching"""
    
    def __init__(self, cache_file="album_covers.csv"):
        self.cache_file = cache_file
        self.cache = {}
        self._load_cache()
    
    def _load_cache(self):
        """load album cover cache from csv"""
        if os.path.exists(self.cache_file):
            with open(self.cache_file, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                next(reader)  # Skip header
                for row in reader:
                    album, artist, cover_url = row
                    self.cache[(album, artist)] = cover_url
    
    def save_cache(self):
        """save album cover cache to csv"""
        with open(self.cache_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Album', 'Artist', 'Cover URL'])
            for (album, artist), cover_url in self.cache.items():
                writer.writerow([album, artist, cover_url])
    
    def get_cover_url(self, album, artist):
        """get album cover url, fetching if not cached"""
        key = (album, artist)
        
        if key not in self.cache:
            cover_url = get_album_cover(album, artist)
            self.cache[key] = cover_url
            return cover_url
        
        return self.cache[key]