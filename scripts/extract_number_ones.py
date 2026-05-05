import os
import csv

def main():
    # Base directories based on your project structure
    points_dir = "/home/ptrn23/personal-hot-100/scripts/points"
    output_file = "/home/ptrn23/personal-hot-100/scripts/number_ones.txt"
    
    number_ones = {}
    chronological_order = []

    if not os.path.exists(points_dir):
        print(f"Error: Could not find directory {points_dir}")
        return
    
    years = sorted([d for d in os.listdir(points_dir) if os.path.isdir(os.path.join(points_dir, d))])
    
    for year in years:
        year_path = os.path.join(points_dir, year)
        weekly_files = sorted([f for f in os.listdir(year_path) if f.endswith('.csv')])
        
        for file in weekly_files:
            filepath = os.path.join(year_path, file)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    if row.get('Position') == '1' or row.get('Rank') == '1':
                        song = row.get('Song')
                        artist = row.get('Artist')
                        week = row.get('Week', file.replace('.csv', ''))
                        
                        key = (song, artist)
                        
                        if key not in number_ones:
                            number_ones[key] = {
                                'song': song,
                                'artist': artist,
                                'first_week': week,
                                'total_weeks': 1,
                                'chrono_index': len(chronological_order)
                            }
                            chronological_order.append(key)
                        else:
                            number_ones[key]['total_weeks'] += 1
                            
                        break

    chrono_list = [number_ones[key] for key in chronological_order]
    
    most_weeks_list = sorted(
        number_ones.values(),
        key=lambda x: (-x['total_weeks'], x['chrono_index'])
    )

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("PERSONAL HOT 100 - NUMBER ONE HITS 🏆\n")
        f.write("="*50 + "\n\n")
        
        f.write("PART 1: CHRONOLOGICAL ORDER (When they first hit #1)\n")
        f.write("-" * 50 + "\n")
        for i, data in enumerate(chrono_list, start=1):
            weeks_text = "week" if data['total_weeks'] == 1 else "weeks"
            f.write(f"{i}. \"{data['song']}\" by {data['artist']}\n")
            f.write(f"   └ First #1: {data['first_week']} ({data['total_weeks']} {weeks_text} total)\n\n")
            
        f.write("\n")
        f.write("PART 2: RANKED BY WEEKS AT #1\n")
        f.write("-" * 50 + "\n")
        for i, data in enumerate(most_weeks_list, start=1):
            weeks_text = "week" if data['total_weeks'] == 1 else "weeks"
            f.write(f"{i}. \"{data['song']}\" by {data['artist']} - {data['total_weeks']} {weeks_text}\n")
            f.write(f"   └ First hit #1: {data['first_week']}\n\n")
            
    print(f"Successfully processed {len(years)} years of data.")
    print(f"Found {len(number_ones)} unique #1 songs.")
    print(f"Saved list to: {output_file}")

if __name__ == "__main__":
    main()