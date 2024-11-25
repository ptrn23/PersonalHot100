import csv
from datetime import datetime
from collections import defaultdict

input_file = 'C:/Users/pault/Documents/projects/PersonalHot100/ptrn23.csv'
output_folder = 'data/'

def get_year_from_timestamp(timestamp):
    try:
        return datetime.strptime(timestamp, "%d %b %Y %H:%M").year
    except ValueError:
        return None
    
data_by_year = defaultdict(list)
invalid_rows = []

with open(input_file, 'r', encoding='utf-8') as file:
    reader = csv.reader(file)
    header = next(reader)
    
    for row in reader:
        year = get_year_from_timestamp(row[3])
        data_by_year[year].append(row)

for year, rows in data_by_year.items():
    output_file = f'{output_folder}{year}.csv'
    
    with open(output_file, 'w', encoding='utf-8', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(header)
        writer.writerows(rows)

print(f"Data has been split into separate files in the '{output_folder}' directory.")