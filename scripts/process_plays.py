from services.plays_aggregator import PlaysAggregator

def main():
    years = [str(year) for year in range(2020, 2027)]
    
    aggregator = PlaysAggregator()
    aggregator.process_years(years, data_folder='/home/ptrn23/personal-hot-100/scripts/data/')
    aggregator.save_weekly_files(output_root='/home/ptrn23/personal-hot-100/scripts/plays/')

if __name__ == "__main__":
    main()