import os
import csv

from services.album_cover_service import AlbumCoverService
from formatters.spreadsheet_formatter import SpreadsheetFormatter
from repositories.chart_repository import ChartRepository

def extract_number_ones(year, output_dir="weekly_charts"):
    """Extract all #1 entries from weekly charts for a given year"""
    points_dir = f"points/{year}"
    
    if not os.path.exists(points_dir):
        print(f"Points directory not found: {points_dir}")
        return
    
    os.makedirs(output_dir, exist_ok=True)
    
    # get all weekly chart files
    all_files = [f for f in sorted(os.listdir(points_dir)) if f.endswith('.csv')]
    
    if not all_files:
        print(f"No chart files found in {points_dir}")
        return
    
    # initialize services
    cover_service = AlbumCoverService()
    formatter = SpreadsheetFormatter()
    
    # collect all #1 entries
    number_ones = []
    
    for filename in all_files:
        week = filename.replace(".csv", "")
        input_path = os.path.join(points_dir, filename)
        
        # load chart data
        chart_data = ChartRepository.load_weekly_chart(input_path)
        
        if chart_data:
            # get the #1 entry (first entry after sorting)
            number_one = chart_data[0].copy()
            # add week information
            number_one['Week'] = week
            number_ones.append(number_one)
    
    if not number_ones:
        print(f"No #1 entries found for {year}")
        return
    
    # format rise/fall for all entries
    for entry in number_ones:
        if 'Rise/Fall' in entry:
            entry['Rise/Fall'] = formatter.format_rise_fall(entry['Rise/Fall'])
    
    # add album covers
    formatter.add_album_covers(number_ones, cover_service)
    
    # prepare fieldnames with Week first
    original_fieldnames = list(number_ones[0].keys()) if number_ones else []
    
    # reorder: Week first, Album Cover last
    if 'Week' in original_fieldnames:
        original_fieldnames.remove('Week')
    if 'Album Cover' in original_fieldnames:
        original_fieldnames.remove('Album Cover')
        fieldnames = ['Week'] + original_fieldnames + ['Album Cover']
    else:
        fieldnames = ['Week'] + original_fieldnames
    
    # save to file
    output_path = os.path.join(output_dir, f"{year}_ones.csv")
    ChartRepository.save_formatted_chart(number_ones, output_path, fieldnames)
    
    print(f"Extracted {len(number_ones)} #1 entries for {year}")
    print(f"Saved to {output_path}")
    
    # save album cover cache
    cover_service.save_cache()
    print(f"Album cover cache updated")

def main():
    year = 2025
    extract_number_ones(year=year, output_dir="weekly_charts")

if __name__ == "__main__":
    main()