import os

from services.album_cover_service import AlbumCoverService
from formatters.spreadsheet_formatter import SpreadsheetFormatter
from repositories.chart_repository import ChartRepository

def process_weekly_charts(year, chart_limit=100, specific_week=None, output_dir="weekly_charts"):
    points_dir = f"points/{year}"
    
    if not os.path.exists(points_dir):
        print(f"Points directory not found: {points_dir}")
        return
    
    os.makedirs(output_dir, exist_ok=True)
    
    # determine which files to process
    files_to_process = _get_files_to_process(points_dir, specific_week)
    if not files_to_process:
        return
    
    # initialize services
    cover_service = AlbumCoverService()
    formatter = SpreadsheetFormatter()
    
    # process each week
    for filename in files_to_process:
        week = filename.replace(".csv", "")
        input_path = os.path.join(points_dir, filename)
        output_path = os.path.join(output_dir, f"{year}_{week}.csv")
        
        # load chart data
        chart_data = ChartRepository.load_weekly_chart(input_path)
        
        # limit to top N
        chart_data = chart_data[:chart_limit]
        
        # format for spreadsheet
        for entry in chart_data:
            if 'Rise/Fall' in entry:
                entry['Rise/Fall'] = formatter.format_rise_fall(entry['Rise/Fall'])
        
        # add album covers
        formatter.add_album_covers(chart_data, cover_service)
        
        # save formatted chart
        original_fieldnames = list(chart_data[0].keys()) if chart_data else []
        # move Album Cover to end if it exists
        if 'Album Cover' in original_fieldnames:
            original_fieldnames.remove('Album Cover')
            fieldnames = original_fieldnames + ['Album Cover']
        else:
            fieldnames = original_fieldnames
        
        ChartRepository.save_formatted_chart(chart_data, output_path, fieldnames)
        
        print(f"Top {chart_limit} chart for {week} saved to {output_path}")
    
    # save album cover cache
    cover_service.save_cache()
    print(f"Album cover cache updated")

def _get_files_to_process(points_dir, specific_week):
    """determine which csv files to process"""
    all_files = [f for f in sorted(os.listdir(points_dir)) if f.endswith('.csv')]
    
    if specific_week:
        filename = f"{specific_week}.csv"
        if filename in all_files:
            return [filename]
        else:
            print(f"Week {specific_week} not found in {points_dir}")
            return []
    
    return all_files

def main():
    year = 2025
    specific_week = "12-26"  # change to None to process all weeks
    
    process_weekly_charts(
        year=year,
        chart_limit=100,
        specific_week=specific_week,
        output_dir="weekly_charts"
    )

if __name__ == "__main__":
    main()