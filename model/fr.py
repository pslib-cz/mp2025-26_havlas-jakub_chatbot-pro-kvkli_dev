import re

input_file = "model/books.csv"
output_file = "model/books_fixed.csv"

fixed_lines = []
bad_lines = 0

with open(input_file, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, start=1):
        # Count quotes
        quote_count = line.count('"')

        # If odd number of quotes -> try fixing
        if quote_count % 2 != 0:
            bad_lines += 1

            # Case 1: unescaped inner quotes like: word "quote" word
            # → replace with doubled quotes ""quote""
            line = re.sub(r'(?<!")"(?!")', '""', line)

            # Case 2: still odd after substitution -> add missing end quote
            if line.count('"') % 2 != 0:
                line = line.rstrip("\n") + '"\n'

        fixed_lines.append(line)

# Save cleaned version
with open(output_file, "w", encoding="utf-8") as out:
    out.writelines(fixed_lines)

print(f"✅ Cleaned file written to {output_file}")
print(f"   {bad_lines} potentially malformed lines fixed.")