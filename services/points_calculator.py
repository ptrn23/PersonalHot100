from math import ceil

class PointsCalculator:
    """calculates chart points from play metrics"""
    
    def __init__(self, streams_weight=5000, sales_weight=3000, airplay_weight=2000):
        self.streams_weight = streams_weight
        self.sales_weight = sales_weight
        self.airplay_weight = airplay_weight
    
    def calculate_raw_points(self, streams, sales, airplay):
        """calculate base points from raw metrics"""
        stream_pts = ceil(streams * self.streams_weight / 1000)
        sale_pts = ceil(sales * self.sales_weight / 1000)
        air_pts = ceil(airplay * self.airplay_weight / 1000)
        return stream_pts + sale_pts + air_pts
    
    def calculate_weighted_points(self, current_points, previous_points, two_weeks_ago_points):
        """calculate total weighted points with decay factor"""
        return ceil(
            current_points + 
            ceil(previous_points * 0.3) + 
            ceil(two_weeks_ago_points * 0.2)
        )
    
    def calculate_component_points(self, streams, sales, airplay):
        """calculate individual component points"""
        return {
            'streams': ceil(streams * self.streams_weight / 1000),
            'sales': ceil(sales * self.sales_weight / 1000),
            'airplay': ceil(airplay * self.airplay_weight / 1000)
        }
    
    def calculate_percentages(self, streams, sales, airplay):
        """calculate percentage contribution of each component"""
        total_raw = streams * 4 + sales * 0.45 + airplay * 5
        if total_raw == 0:
            return {'streams': 0, 'sales': 0, 'airplay': 0}
        
        return {
            'streams': round(streams * 4 / total_raw, 2),
            'sales': round(sales * 0.45 / total_raw, 2),
            'airplay': round(airplay * 5 / total_raw, 2)
        }
    
    @staticmethod
    def calculate_units(streams, sales, airplay, song, album, artist):
        """calculate unit equivalents with deviation"""
        seed = PointsCalculator._stable_seed(song.name, album, artist)
        
        stream_units = PointsCalculator._apply_deviation(
            ceil(streams * 5250 * 275), seed + 1
        )
        sale_units = PointsCalculator._apply_deviation(
            ceil(sales * 252), seed + 2
        )
        air_units = PointsCalculator._apply_deviation(
            ceil(airplay * 2250 * 5020), seed + 3
        )
        total_units = PointsCalculator._apply_deviation(
            ceil((streams + sales + airplay) * 1750 * 2), seed + 4
        )
        
        return {
            'streams': stream_units,
            'sales': sale_units,
            'airplay': air_units,
            'total': total_units
        }
    
    @staticmethod
    def _stable_seed(song, album, artist):
        """generate deterministic seed for unit calculations"""
        combo = f"{song}|{album}|{artist}"
        return sum((i + 1) * ord(char) for i, char in enumerate(combo))
    
    @staticmethod
    def _apply_deviation(base_value, seed, scale=0.1, mod=100):
        """apply small random-looking deviation to units"""
        deviation = ((seed % mod) / mod - 0.5) * 2 * scale
        return int(base_value * (1 + deviation))