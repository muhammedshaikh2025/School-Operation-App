from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
from datetime import datetime, timedelta

# ------------------ Database Config ------------------ #
DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://schoolops_user:slKvAmqQ03vQUMqVRcKwDULfERfK7h7D@dpg-d31qmtjipnbc73ojcfag-a/schoolops"
)

app = Flask(__name__)
CORS(app)

# ------------------ Helpers ------------------ #
def get_conn():
    return psycopg2.connect(DB_URL)

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    # Users table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT
    )
    """)
    # Default users (admin + one user)
    cur.execute("INSERT INTO users (email, password, role) VALUES (%s, %s, %s) ON CONFLICT (email) DO NOTHING",
                ("admin@onmyowntechnology.com", "admin123", "admin"))
    cur.execute("INSERT INTO users (email, password, role) VALUES (%s, %s, %s) ON CONFLICT (email) DO NOTHING",
                ("user1@onmyowntechnology.com", "user123", "user"))

    # Entries table (user submissions)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        school_name TEXT,
        location TEXT,
        grade INTEGER,
        term INTEGER,
        workbook TEXT,
        count INTEGER,
        remark TEXT,
        submitted_by TEXT,
        submitted_at TEXT
    )
    """)

    # School data table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS school_data (
        id SERIAL PRIMARY KEY,
        school_name TEXT,
        location TEXT,
        grade INTEGER,
        term1 TEXT,
        term2 TEXT,
        term3 TEXT,
        reporting_branch TEXT
    )
    """)

    conn.commit()
    conn.close()

# ------------------ Auth APIs ------------------ #
@app.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email.endswith("@onmyowntechnology.com"):
        return jsonify({"success": False, "message": "Invalid domain"}), 401

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT password, role FROM users WHERE email=%s", (email,))
    row = cur.fetchone()
    conn.close()

    if row and row[0] == password:
        return jsonify({"success": True, "role": row[1], "email": email})
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

# ------------------ User Management (Admin only) ------------------ #
@app.route("/admin/users", methods=["GET"])
def get_users():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, email, role FROM users ORDER BY id")
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "email": r[1], "role": r[2]} for r in rows])

@app.route("/admin/users", methods=["POST"])
def add_user():
    data = request.json or {}
    email, password, role = data.get("email"), data.get("password"), data.get("role", "user")
    if not email or not password:
        return jsonify({"success": False, "message": "Email and password required"}), 400

    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO users (email, password, role) VALUES (%s, %s, %s)", (email, password, role))
        conn.commit()
    except psycopg2.Error:
        return jsonify({"success": False, "message": "User already exists"}), 400
    finally:
        conn.close()

    return jsonify({"success": True, "message": "User added"})

@app.route("/admin/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE id=%s", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "User deleted"})

# ------------------ User Submissions (Admin view) ------------------ #
@app.route("/admin/form-submissions", methods=["GET"])
def get_form_submissions():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, school_name, location, grade, term, workbook, count, remark, submitted_by, submitted_at
        FROM entries
        ORDER BY submitted_at DESC
    """)
    rows = cur.fetchall()
    conn.close()

    submissions = [
        {
            "id": r[0],
            "school_name": r[1],
            "location": r[2],
            "grade": r[3],
            "term": r[4],
            "workbook": r[5],
            "count": r[6],
            "remark": r[7],
            "submitted_by": r[8],
            "submitted_at": r[9]
        }
        for r in rows
    ]
    return jsonify(submissions)

@app.route("/admin/form-submissions/<int:submission_id>", methods=["DELETE"])
def delete_submission(submission_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM entries WHERE id=%s", (submission_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Submission {submission_id} deleted"})

# ------------------ Admin School Data ------------------ #
@app.route("/admin/entries", methods=["GET"])
def get_entries():
    school = request.args.get("school", "")
    location = request.args.get("location", "")
    grade = request.args.get("grade", "")

    query = "SELECT id, school_name, location, grade, term1, term2, term3, reporting_branch FROM school_data WHERE 1=1"
    params = []
    if school:
        query += " AND school_name=%s"
        params.append(school)
    if location:
        query += " AND location=%s"
        params.append(location)
    if grade:
        query += " AND grade=%s"
        params.append(int(grade))
    query += " ORDER BY school_name, grade"

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(query, tuple(params))
    rows = cur.fetchall()
    conn.close()

    return jsonify([
        {
            "id": r[0],
            "school_name": r[1],
            "location": r[2],
            "grade": r[3],
            "term1": r[4],
            "term2": r[5],
            "term3": r[6],
            "reporting_branch": r[7]
        }
        for r in rows
    ])

@app.route("/admin/update/<int:row_id>", methods=["PUT"])
def update_entry(row_id):
    data = request.json or {}
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT id FROM school_data WHERE id=%s", (row_id,))
    if not cur.fetchone():
        conn.close()
        return jsonify({"success": False, "message": f"Row {row_id} not found"}), 404

    cur.execute("""
        UPDATE school_data
        SET school_name=%s, location=%s, grade=%s, term1=%s, term2=%s, term3=%s, reporting_branch=%s
        WHERE id=%s
    """, (
        data.get("school_name"), data.get("location"), data.get("grade"),
        data.get("term1"), data.get("term2"), data.get("term3"),
        data.get("reporting_branch"), row_id
    ))

    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Row {row_id} updated"})

# ------------------ Workbook APIs ------------------ #
@app.route("/admin/update_workbook", methods=["POST"])
def update_workbook():
    data = request.json or {}
    school, location, grade, term, workbook = (
        data.get("school"), data.get("location"),
        data.get("grade"), data.get("term"), data.get("workbook")
    )

    if term not in ("1", "2", "3"):
        return jsonify({"success": False, "message": "Invalid term"}), 400

    col = f"term{term}"
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"UPDATE school_data SET {col}=%s WHERE school_name=%s AND location=%s AND grade=%s",
                (workbook, school, location, int(grade)))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": f"Updated {col} workbook"})

# ------------------ User Form APIs ------------------ #
@app.route("/schools", methods=["GET"])
def get_schools():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT school_name FROM school_data ORDER BY school_name")
    schools = [r[0] for r in cur.fetchall()]
    conn.close()
    return jsonify(schools)

@app.route("/locations", methods=["GET"])
def get_locations():
    school = request.args.get("school", "")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT location FROM school_data WHERE school_name=%s ORDER BY location", (school,))
    locations = [r[0] for r in cur.fetchall()]
    conn.close()
    return jsonify(locations)

@app.route("/reporting_branch", methods=["GET"])
def get_reporting_branch():
    school = request.args.get("school", "")
    location = request.args.get("location", "")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT reporting_branch FROM school_data WHERE school_name=%s AND location=%s LIMIT 1",
                (school, location))
    r = cur.fetchone()
    conn.close()
    return jsonify({"reporting_branch": r[0] if r else ""})

@app.route("/workbook", methods=["GET"])
def get_workbook():
    school = request.args.get("school", "")
    location = request.args.get("location", "")
    grade = request.args.get("grade", "")
    term = request.args.get("term", "")

    if term not in ("1", "2", "3"):
        return jsonify({"workbook": "", "message": "Invalid term (use 1,2,3)"}), 400

    col = f"term{term}"
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"SELECT {col} FROM school_data WHERE school_name=%s AND location=%s AND grade=%s LIMIT 1",
                (school, location, int(grade)))
    r = cur.fetchone()
    conn.close()
    return jsonify({"workbook": r[0] if r and r[0] else ""})

@app.route("/submit", methods=["POST"])
def submit():
    data = request.json or {}
    school = data.get("school")
    location = data.get("location")
    grade = data.get("grade")
    term = data.get("term")
    workbook = data.get("workbook")
    count = data.get("count")
    remark = data.get("remark")
    submitted_by = data.get("submitted_by")

    # ✅ Current IST time
    submitted_at = (datetime.utcnow() + timedelta(hours=5, minutes=30)).isoformat()

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
      INSERT INTO entries (school_name, location, grade, term, workbook, count, remark, submitted_by, submitted_at)
      VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (school, location, grade, term, workbook, count, remark, submitted_by, submitted_at))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Submitted"})

@app.route("/entries", methods=["GET"])
def entries():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT school_name, location, grade, term, workbook, count, remark, submitted_by, submitted_at FROM entries ORDER BY submitted_at DESC")
    rows = cur.fetchall()
    conn.close()
    return jsonify([
        {"school": r[0], "location": r[1], "grade": r[2], "term": r[3],
         "workbook": r[4], "count": r[5], "remark": r[6],
         "submitted_by": r[7], "submitted_at": r[8]} for r in rows
    ])

# ------------------ Main ------------------ #
if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)
