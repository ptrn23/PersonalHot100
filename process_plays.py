from services.plays_aggregator import PlaysAggregator

def main():
    years = [str(year) for year in range(2020, 2026)]
    
    aggregator = PlaysAggregator()
    aggregator.process_years(years, data_folder='data/')
    aggregator.save_weekly_files(output_root='plays/')

if __name__ == "__main__":
    main()