class ChartEntry:
    def __init__(self, song, position, points, week):
        self.song = song
        self.position = position
        self.points = points
        self.week = week
        self.previous_position = None
        self.peak_position = None
        self.weeks_on_chart = 0
        
        # detailed metrics
        self.streams_points = 0
        self.sales_points = 0
        self.airplay_points = 0
        
        self.streams_units = 0
        self.sales_units = 0
        self.airplay_units = 0
        
        self.total_units = 0
        
        # percentages
        self.streams_percent = 0.0
        self.sales_percent = 0.0
        self.airplay_percent = 0.0
        
        # historical tracking
        self.current_week_points = 0
        self.previous_week_points = 0
        self.two_weeks_ago_points = 0
        self.peak_streak = 0
        self.is_new_peak = False
        self.is_repeak = False
        self.percent_change = None
    
    @property
    def status(self):
        """calculate rise / fall status"""
        if self.weeks_on_chart == 1:
            return "NEW"
        if self.previous_position == "--":
            return "RE"
        
        change = self.previous_position - self.position
        if change == 0:
            return "="
        return change  # positive = rising, negative = falling