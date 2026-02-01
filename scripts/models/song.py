class Song:
    def __init__(self, name, artist, album):
        self.name = name
        self.artist = artist
        self.album = album
        self.streams = 0
        self.sales = 0
        self.airplay = 0
    
    @property
    def key(self):
        """unique identifier for song matching"""
        return (self.name.lower(), self.artist)
    
    def __hash__(self):
        return hash(self.key)
    
    def __eq__(self, other):
        if isinstance(other, Song):
            return self.key == other.key
        return False
    
    def __repr__(self):
        return f"Song('{self.name}' by {self.artist})"