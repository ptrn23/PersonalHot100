import csv

with open('C:/Users/pault/Documents/projects/PersonalHot100/ptrn23.csv', 'r') as file:
    reader = csv.reader(file)
    next(reader)
    
    for row in reader:
        print(row)