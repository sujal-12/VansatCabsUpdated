import csv
import json

data = []

with open('dataset/Indian_cities.csv', mode='r', encoding='utf-8-sig') as csv_file:
    reader = csv.DictReader(csv_file)
    reader.fieldnames = [field.strip().lower() for field in reader.fieldnames]

    for row in reader:
        # Clean up the keys in the row as well
        cleaned_row = {k.strip().lower(): v.strip() for k, v in row.items()}
        data.append({
            "City": cleaned_row['city'],
            "State": cleaned_row['state'],
            "Latitude": cleaned_row['latitude'],
            "Longitude": cleaned_row['longitude']
        })

with open('output.json', mode='w', encoding='utf-8') as json_file:
    json.dump(data, json_file, indent=2)

print("✅ Conversion completed.")
