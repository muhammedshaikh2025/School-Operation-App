from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta
import secrets
import smtplib
from email.message import EmailMessage

DB_PATH = "workbook.db"  # ✅ Must match DB created during import

app = Flask(__name__)
CORS(app)

# ---------- SMTP CONFIG ----------
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "muhammed.shaikh@onmyowntechnology.com"      # replace
SMTP_PASS = "ggpynunrodejufxl"         # replace (Google App Password)

# ---------- SEND EMAIL HELPER ----------
def send_reset_email(to_email, reset_link):
    msg = EmailMessage()
    msg["Subject"] = "OMOTEC Password Reset"
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg.set_content(f"""
Hello,

We received a request to reset your password.

Click the link below to set a new password (valid for 30 minutes):
{reset_link}

If you did not request this, you can ignore this email.

- OMOTEC Team
""")
    smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
    smtp.starttls()
    smtp.login(SMTP_USER, SMTP_PASS)
    smtp.send_message(msg)
    smtp.quit()

# ---------- ROUTES ----------
@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.json or {}
    email = (data.get("email") or "").strip()
    if not email:
        return jsonify({"success": False, "message": "Email required"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email=?", (email,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"success": True, "message": "If the email exists, reset link will be sent."})  # safe response

    # Generate token
    token = secrets.token_urlsafe(24)
    expires = (datetime.utcnow() + timedelta(minutes=30)).isoformat()

    cur.execute("INSERT INTO reset_tokens (email, token, expires_at) VALUES (?, ?, ?)",
                (email, token, expires))
    conn.commit()
    conn.close()

    reset_link = f" https://school-operation-app.vercel.app//reset-password?token={token}"  # change to production URL
    try:
        send_reset_email(email, reset_link)
        return jsonify({"success": True, "message": "Password reset link sent to your email."})
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to send email: {str(e)}"}), 500

@app.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.json or {}
    token = data.get("token")
    new_password = data.get("password")

    if not token or not new_password:
        return jsonify({"success": False, "message": "Token and new password required"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT email, expires_at FROM reset_tokens WHERE token=?", (token,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "message": "Invalid or expired token"}), 400

    email, expires_at = row
    if datetime.utcnow() > datetime.fromisoformat(expires_at):
        conn.close()
        return jsonify({"success": False, "message": "Token expired"}), 400

    # Update password
    cur.execute("UPDATE users SET password=? WHERE email=?", (new_password, email))
    cur.execute("DELETE FROM reset_tokens WHERE token=?", (token,))  # delete used token
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Password reset successful"})


# ------------------ Helpers ------------------ #
def get_conn():
    return sqlite3.connect(DB_PATH)

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    # Users table
    
    cur.execute("INSERT OR IGNORE INTO users (name,email, password, role) VALUES (?,?, ?, ?)",
                ("OMOTEC","admin1@onmyowntechnology.com", "admin123", "admin"))
    cur.execute("INSERT OR IGNORE INTO users (name,email, password, role) VALUES (?,?, ?, ?)",
                ("OMOTEC","admin2@onmyowntechnology.com", "admin123", "admin"))

    

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
    cur.execute("SELECT password, role FROM users WHERE email=?", (email,))
    row = cur.fetchone()
    conn.close()

    if row and row[0] == password:
        return jsonify({"success": True, "role": row[1], "email": email})
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

# ------------------ User Management ------------------ #
@app.route("/admin/users", methods=["GET"])
def get_users():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, password, role FROM users ORDER BY id")
    rows = cur.fetchall()
    conn.close()
    return jsonify([
        {"id": r[0], "name": r[1], "email": r[2], "password": r[3], "role": r[4]} 
        for r in rows
    ])

@app.route("/admin/users", methods=["POST"])
def add_user():
    data = request.json or {}
    name,email, password, role = data.get("name"),data.get("email"), data.get("password"), data.get("role", "user")
    if not email or not password:
        return jsonify({"success": False, "message": "Email and password required"}), 400

    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO users (name,email, password, role) VALUES (?,?, ?, ?)", (name,email, password, role))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "User already exists"}), 400
    finally:
        conn.close()

    return jsonify({"success": True, "message": "User added","id": cur.lastrowid})

@app.route("/admin/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE id=?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "User deleted"})


@app.route("/admin/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "user")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password required"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        UPDATE users SET name=?, email=?, password=?, role=? WHERE id=?
    """, (name, email, password, role, user_id))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "User updated"})


# ------------------ User Submissions ------------------ #
@app.route("/admin/form-submissions", methods=["GET"])
def get_form_submissions():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, school_name, location, grade, term, workbook, count, remark, submitted_by, submitted_at, delivered
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
            "submitted_at": r[9],
            "delivered": r[10]
        }
        for r in rows
    ]
    return jsonify(submissions)

@app.route("/admin/form-submissions/<int:submission_id>", methods=["DELETE"])
def delete_submission(submission_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM entries WHERE id=?", (submission_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Submission {submission_id} deleted"})


@app.route("/admin/mark-delivered", methods=["PUT"])
def mark_delivered():
    data = request.json
    ids = data.get("ids", [])
    delivered = data.get("delivered", "Yes")  # 'Yes' or 'No'

    if not ids:
        return jsonify({"success": False, "message": "No IDs provided"})

    conn = get_conn()
    cur = conn.cursor()
    try:
        placeholders = ",".join(["?"] * len(ids))
        cur.execute(
            f"UPDATE entries SET delivered = ? WHERE id IN ({placeholders})",
            [delivered] + ids
        )
        conn.commit()
        return jsonify({"success": True, "updated": cur.rowcount})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    finally:
        conn.close()





# ------------------ Admin School Data ------------------ #
# GET entries
@app.route("/admin/entries", methods=["GET"])
def get_entries():
    school = request.args.get("school", "")
    location = request.args.get("location", "")

    query = "SELECT id, school_name, location, reporting_branch, num_students FROM school_data WHERE 1=1"
    params = []
    if school:
        query += " AND school_name=?"
        params.append(school)
    if location:
        query += " AND location=?"
        params.append(location)
    query += " ORDER BY school_name"

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
            "reporting_branch": r[3],
            "num_students": r[4]
        }
        for r in rows
    ])

# PUT update
@app.route("/admin/update/<int:row_id>", methods=["PUT"])
def update_entry(row_id):
    data = request.json or {}
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT id FROM school_data WHERE id=?", (row_id,))
    if not cur.fetchone():
        conn.close()
        return jsonify({"success": False, "message": f"Row {row_id} not found"}), 404

    cur.execute("""
        UPDATE school_data
        SET school_name=?, location=?, reporting_branch=?, num_students=?
        WHERE id=?
    """, (
        data.get("school_name"),
        data.get("location"),
        data.get("reporting_branch"),
        data.get("num_students"),
        row_id
    ))

    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Row {row_id} updated"})

# POST new entry (Add School)
@app.route("/admin/entries", methods=["POST"])
def add_entry():
    data = request.json or {}
    school_name = data.get("school_name")
    location = data.get("location")
    reporting_branch = data.get("reporting_branch", "")
    num_students = data.get("num_students", 0)

    if not school_name or not location:
        return jsonify({"success": False, "message": "School name and location required"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO school_data (school_name, location, reporting_branch, num_students)
        VALUES (?, ?, ?, ?)
    """, (school_name, location, reporting_branch, num_students))
    new_id = cur.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"success": True, "id": new_id, "message": "School added successfully"})

# ------------------ Delete School Entry ------------------ #
@app.route("/admin/delete/<int:entry_id>", methods=["DELETE"])
def delete_entry(entry_id):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM school_data WHERE id = ?", (entry_id,))
        conn.commit()
        if cur.rowcount > 0:
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "message": "School not found"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    finally:
        conn.close()




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
    cur.execute("SELECT DISTINCT location FROM school_data WHERE school_name=? ORDER BY location", (school,))
    locations = [r[0] for r in cur.fetchall()]
    conn.close()
    return jsonify(locations)

@app.route("/reporting_branch", methods=["GET"])
def get_reporting_branch():
    school = request.args.get("school", "")
    location = request.args.get("location", "")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT reporting_branch FROM school_data WHERE school_name=? AND location=? LIMIT 1",
                (school, location))
    r = cur.fetchone()
    conn.close()
    return jsonify({"reporting_branch": r[0] if r else ""})


# GET distinct grades from workbook_status
@app.route("/grades", methods=["GET"])
def get_grades():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT grade FROM workbook_status ORDER BY grade")
    rows = cur.fetchall()
    conn.close()
    grades = [r[0] for r in rows]
    return jsonify(grades)


# GET workbooks by grade
@app.route("/workbook_name", methods=["GET"])
def workbooks_by_grade():
    grade = request.args.get("grade")
    if not grade:
        return jsonify({"workbooks": []})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT DISTINCT workbook_name FROM workbook_status WHERE grade=? ORDER BY workbook_name",
        (grade,)
    )
    rows = cur.fetchall()
    conn.close()

    workbooks = [r[0] for r in rows]
    return jsonify({"workbooks": workbooks})


# POST new form submission
from datetime import datetime, timedelta

@app.route("/submit", methods=["POST"])
def submit_form():
    data = request.json or {}
    school = data.get("school")
    location = data.get("location")
    grade = data.get("grade")
    term = data.get("term")
    workbook = data.get("workbook")
    count = data.get("count")
    remark = data.get("remark")
    submitted_by = data.get("submitted_by")

    if not all([school, location, grade, term, workbook, count, remark, submitted_by]):
        return jsonify({"success": False, "message": "All fields are required"}), 400

    # ✅ Current IST time
    submitted_at = datetime.utcnow() + timedelta(hours=5, minutes=30)

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO entries
        (school_name, location, grade, term, workbook, count, remark, submitted_by, submitted_at, delivered)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'No')
    """, (school, location, grade, term, workbook, count, remark, submitted_by, submitted_at.isoformat()))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()

    return jsonify({"success": True, "id": new_id, "message": "Form submitted successfully"})


@app.route("/user-info", methods=["GET"])
def user_info():
    email = request.args.get("email")
    if not email:
        return jsonify({"success": False, "message": "Email required"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT name, email FROM users WHERE email=?", (email,))
    row = cur.fetchone()
    conn.close()

    if row:
        return jsonify({"success": True, "name": row[0], "email": row[1]})
    else:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    
# ------------------ Workbooks Routes ------------------
@app.route("/admin/workbooks", methods=["GET"])
def get_workbooks():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, grade, workbook_name, quantity FROM workbook_status")
    rows = cur.fetchall()
    conn.close()

    data = [
        {
            "id": r[0],
            "grade": r[1],
            "workbook_name": r[2],
            "quantity": r[3],
        }
        for r in rows
    ]
    return jsonify(data)


@app.route("/admin/workbooks/<int:w_id>", methods=["PUT"])
def update_workbook(w_id):
    data = request.json
    qty = data.get("quantity")

    if qty is None:
        return jsonify({"success": False, "message": "Quantity required"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "UPDATE workbook_status SET quantity = ? WHERE id = ?", (qty, w_id)
    )
    conn.commit()
    updated = cur.rowcount
    conn.close()

    if updated == 0:
        return jsonify({"success": False, "message": "Workbook not found"}), 404

    return jsonify({"success": True, "id": w_id, "quantity": qty})


@app.route("/admin/workbooks", methods=["POST"])
def add_workbook():
    data = request.json
    grade = data.get("grade")
    workbook_name = data.get("workbook_name")
    quantity = data.get("quantity")

    if not grade or not workbook_name or quantity is None:
        return jsonify({"success": False, "message": "Grade, workbook name and quantity required"}), 400

    try:
        grade_int = int(grade)
        qty_int = int(quantity)
        if qty_int < 0:
            return jsonify({"success": False, "message": "Quantity cannot be negative"}), 400
    except ValueError:
        return jsonify({"success": False, "message": "Invalid grade or quantity"}), 400

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO workbook_status (grade, workbook_name, quantity) VALUES (?, ?, ?)",
        (grade_int, workbook_name.strip(), qty_int)
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()

    return jsonify({"success": True, "id": new_id})


# 🔴 NEW: Delete Workbook Route
@app.route("/admin/workbooks/<int:w_id>", methods=["DELETE"])
def delete_workbook(w_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM workbook_status WHERE id = ?", (w_id,))
    conn.commit()
    deleted = cur.rowcount
    conn.close()

    if deleted == 0:
        return jsonify({"success": False, "message": "Workbook not found"}), 404

    return jsonify({"success": True, "id": w_id, "message": "Workbook deleted"})

# ------------------ Main ------------------ #
if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        raise RuntimeError(f"Database not found: {DB_PATH}. Run the import script first.")
    init_db()
    app.run(debug=True, host="127.0.0.1", port=5001)
