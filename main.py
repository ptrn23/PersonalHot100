import csv

with open('C:/Users/pault/Documents/projects/PersonalHot100/ptrn23.csv', 'r', encoding='utf-8') as file:
    reader = csv.reader(file)
    next(reader)
    
    for row in reader:
        print(row)