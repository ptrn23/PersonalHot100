from services.lastfm_parser import LastFmParser

def main():
    input_file = '/home/ptrn23/personal-hot-100/scripts/ptrn23.csv'
    output_folder = '/home/ptrn23/personal-hot-100/scripts/data/'
    
    parser = LastFmParser(time_offset_hours=8)
    num_years, num_invalid = parser.parse_and_split(input_file, output_folder)
    
    print(f"Data split into {num_years} year file(s) in '{output_folder}' directory.")
    if num_invalid > 0:
        print(f"Warning: {num_invalid} rows had invalid timestamps.")

if __name__ == "__main__":
    main()