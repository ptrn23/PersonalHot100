import csv
from datetime import datetime, timedelta
from collections import defaultdict

input_file = 'C:/Users/pault/Documents/projects/PersonalHot100/ptrn23.csv'
output_folder = 'data/'

TIME_OFFSET = timedelta(hours=8)

def adjust_timestamp(timestamp):
    try:
        dt = datetime.strptime(timestamp, "%d %b %Y %H:%M")
        adjusted_dt = dt + TIME_OFFSET
        return adjusted_dt
    except ValueError:
        return None

data_by_year = defaultdict(list)
invalid_rows = []

with open(input_file, 'r', encoding='utf-8') as file:
    reader = csv.reader(file)
    
    for row in reader:
        adjusted_dt = adjust_timestamp(row[3])
        if adjusted_dt:
            row[3] = adjusted_dt.strftime("%d %b %Y %H:%M")
            data_by_year[adjusted_dt.year].append(row)
        else:
            invalid_rows.append(row)

for year, rows in data_by_year.items():
    output_file = f'{output_folder}{year}.csv'
    
    with open(output_file, 'w', encoding='utf-8', newline='') as file:
        writer = csv.writer(file)
        writer.writerows(rows)

print(f"Data has been split into separate files in the '{output_folder}' directory.")