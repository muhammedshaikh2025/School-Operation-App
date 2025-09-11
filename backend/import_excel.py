# import_excel.py
# Usage:
#   pip install pandas openpyxl
#   python import_excel.py
import pandas as pd
import sqlite3
import os
import time

# --- CONFIG: update this path if your Excel is elsewhere ---
file_path = "SchoolWise Book Status (2).xlsx"
db_path = "workbook.db"

# 1) Read Excel
df = pd.read_excel(file_path, sheet_name=0)

# 2) Basic checks & cleaning
expected_cols = ['School Name', 'Location', 'Books Reporting Branch']
for c in expected_cols:
    if c not in df.columns:
        raise RuntimeError(f"Expected column '{c}' not found. Found: {df.columns.tolist()}")

df_clean = df.dropna(subset=['School Name', 'Location']).copy()
df_clean['School Name'] = df_clean['School Name'].astype(str).str.strip()
df_clean['Location'] = df_clean['Location'].astype(str).str.strip()
df_clean['Books Reporting Branch'] = df_clean.get('Books Reporting Branch', "").astype(str).str.strip().fillna("")

# 3) Backup existing DB if exists
if os.path.exists(db_path):
    bak = db_path + f".bak_{int(time.time())}"
    os.rename(db_path, bak)
    print(f"Existing DB backed up to: {bak}")

# 4) Create DB & table
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("""
CREATE TABLE IF NOT EXISTS school_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_name TEXT NOT NULL,
    location TEXT,
    grade INTEGER,
    term1 TEXT,
    term2 TEXT,
    term3 TEXT,
    reporting_branch TEXT,
    num_students TEXT,
    UNIQUE(school_name, location, grade)
)
""")
conn.commit()

# 5) Insert: for each school+location insert grade 1..10 (term columns empty)
inserted = 0
pairs_seen = set()
for _, row in df_clean.iterrows():
    school = row['School Name']
    location = row['Location']
    reporting = row.get('Books Reporting Branch', "") or ""
    num_students = row.get('No of Students', None)

    pairs_seen.add((school, location))
    for g in range(1, 11):
        cur.execute("""
            INSERT OR IGNORE INTO school_data
            (school_name, location, grade, term1, term2, term3, reporting_branch, num_students)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (school, location, g, "", "", "", reporting, str(num_students) if num_students is not None else None))
        if cur.rowcount > 0:
            inserted += cur.rowcount

conn.commit()

# 6) Summary
cur.execute("SELECT COUNT(*) FROM school_data")
total_rows = cur.fetchone()[0]
print(f"Unique school+location pairs in Excel: {len(pairs_seen)}")
print(f"Total rows in school_data (should be pairs * 10): {total_rows}")
print(f"Database created at: {os.path.abspath(db_path)}")

conn.close()
