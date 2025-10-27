import pandas as pd

# ---- 1. Load the CSV ----
# If the file has encoding issues, try encoding='utf-8-sig' or 'latin1'
bad_lines = []
with open("model/books_fixed.csv", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, start=1):
        # Count the number of quote marks in the line
        if line.count('"') % 2 != 0:  # odd number of quotes = broken line
            bad_lines.append(i)

print(f"❌ Found {len(bad_lines)} malformed lines: {bad_lines}")
df = pd.read_csv(
    "model/books_fixed.csv",
    encoding="utf-8",
    dtype=str,
    on_bad_lines="skip",   # Skip any remaining broken rows
    engine="python",       # Python engine is more forgiving
    quotechar='"',
    sep=",",
 
)

print("✅ Loaded:", len(df), "rows")
print(df.head())

# ---- 2. Replace NaN with empty strings ----
df = df.fillna("")

# ---- 3. Keep only the relevant columns ----
# We'll keep these four + optional extra metadata columns if you want
columns_to_keep = ["Title", "Author", "Subjects", "Description"]
df = df[[col for col in columns_to_keep if col in df.columns]]

# ---- 4. Build a single text field for embeddings ----
def combine_text(row):
    # Join only non-empty parts, separated by " | "
    parts = [row["Title"], row["Author"], row["Subjects"], row["Description"]]
    parts = [p.strip() for p in parts if p.strip()]  # remove blanks
    return " | ".join(parts)

df["text_for_embedding"] = df.apply(combine_text, axis=1)

# ---- 5. Drop rows that have no useful text ----
df = df[df["text_for_embedding"].str.strip() != ""]

# ---- 6. Reset index and preview ----
df = df.reset_index(drop=True)
print(df.head(10))

# ---- 7. Optionally, save cleaned version ----
df.to_csv("books_cleaned.csv", index=False, encoding="utf-8-sig")

print(f"✅ Processed {len(df)} records and saved to 'books_cleaned.csv'")
