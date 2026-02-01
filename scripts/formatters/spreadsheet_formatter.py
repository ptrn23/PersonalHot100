class SpreadsheetFormatter:
    """formats chart data for spreadsheet applications (Google Sheets, Excel)"""
    
    @staticmethod
    def format_rise_fall(value):
        """format rise / fall column for spreadsheet compatibility"""
        if not value:
            return value
        
        value_str = str(value).strip()
        
        # equal sign needs apostrophe to prevent formula interpretation
        if value_str.startswith('='):
            return f"'="
        
        # NEW and RE entries stay as-is
        if value_str.startswith(('NEW', 'RE')):
            return value_str
        
        # numeric values need + prefix and apostrophe
        try:
            numeric_value = int(value_str)
            if numeric_value > 0:
                return f"'+{numeric_value}"
            else:
                return f"'{numeric_value}"
        except ValueError:
            return value_str
    
    @staticmethod
    def add_album_covers(chart_data, album_cover_service):
        """add album cover urls to chart data"""
        for entry in chart_data:
            album = entry.get('Album', '')
            artist = entry.get('Artist', '')
            entry['Album Cover'] = album_cover_service.get_cover_url(album, artist)
        
        return chart_data