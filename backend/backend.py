from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime, timedelta
import secrets
import mysql.connector
from mysql.connector import pooling
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

# .env file se environment variables load karo
load_dotenv()

# --- UPDATED DATABASE CONFIGURATION FOR TIDB CLOUD ---
try:
    # SSL arguments for the secure connection
    ssl_args = {
        'ssl_ca': "\ca.pem",    # Path to your ca.pem file
        'ssl_verify_identity': True
    }

    db_pool = pooling.MySQLConnectionPool(
        pool_name="mypool",
        pool_size=5,
        host=os.environ.get("DB_HOST"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        database=os.environ.get("DB_NAME"),
        port=os.environ.get("DB_PORT"),
        # Add the SSL arguments to the connection
        **ssl_args
    )
    print("Database connection pool created successfully for TiDB Cloud.")
except mysql.connector.Error as err:
    print(f"Error creating connection pool: {err}")
    print("Please ensure your Render environment variables are configured correctly.")
    exit()


app = Flask(__name__)
CORS(app)


# --- HELPERS ---
def get_conn():
    """Gets a connection from the pool."""
    return db_pool.get_connection()


# --- SENDGRID EMAIL ---
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")

def send_reset_email(to_email, reset_link):
    """Send password reset email using SendGrid."""
    message = Mail(
        from_email='muhammed.shaikh@onmyowntechnology.com',
        to_emails=to_email,
        subject='OMOTEC Password Reset',
        html_content=f"""
        <p>Hello,</p>
        <p>We received a request to reset your password.</p>
        <p>Click the link below to set a new password (valid for 30 minutes):<br>
        <a href="{reset_link}">{reset_link}</a></p>
        <p>If you did not request this, ignore this email.</p>
        <p>- OMOTEC Team</p>
        """
    )
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"SendGrid email sent. Status: {response.status_code}")
    except Exception as e:
        print("SendGrid error:", e)
        raise e


# --- AUTHENTICATION & PASSWORD RESET APIS ---
@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.json or {}
    email = (data.get("email") or "").strip()
    if not email:
        return jsonify({"success": False, "message": "Email required"}), 400

    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    try:
        cur.execute("SELECT id FROM users WHERE email=%s", (email,))
        user = cur.fetchone()
        if not user:
            # Safe response to prevent email enumeration
            return jsonify({"success": True, "message": "If the email exists, a reset link will be sent."})

        token = secrets.token_urlsafe(24)
        expires = (datetime.utcnow() + timedelta(minutes=30))

        cur.execute(
            "INSERT INTO reset_tokens (email, token, expires_at) VALUES (%s, %s, %s)",
            (email, token, expires)
        )
        conn.commit()

        # IMPORTANT: Fix the reset link - it had a typo '%s'
        reset_link = f"https://school-operation-app.vercel.app/reset-password?token={token}"

        try:
            send_reset_email(email, reset_link)
            return jsonify({"success": True, "message": "Password reset link sent to your email."})
        except Exception as e:
            return jsonify({"success": False, "message": f"Failed to send email: {str(e)}"}), 500

    finally:
        cur.close()
        conn.close()

@app.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.json or {}
    token = data.get("token")
    new_password = data.get("password")

    if not token or not new_password:
        return jsonify({"success": False, "message": "Token and new password required"}), 400

    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT email, expires_at FROM reset_tokens WHERE token=%s", (token,))
        row = cur.fetchone()

        if not row:
            return jsonify({"success": False, "message": "Invalid or expired token"}), 400

        email = row['email']
        expires_at = row['expires_at'] # This is already a datetime object from the DB

        if datetime.utcnow() > expires_at:
            return jsonify({"success": False, "message": "Token expired"}), 400

        hashed_password = generate_password_hash(new_password)

        cur.execute("UPDATE users SET password=%s WHERE email=%s", (hashed_password, email))
        cur.execute("DELETE FROM reset_tokens WHERE token=%s", (token,))
        conn.commit()

        return jsonify({"success": True, "message": "Password reset successful"})
    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({"success": False, "message": f"Database error: {err}"}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email.endswith("@onmyowntechnology.com"):
        return jsonify({"success": False, "message": "Invalid domain"}), 401

    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT password, role FROM users WHERE email=%s", (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if user and check_password_hash(user['password'], password):
        return jsonify({"success": True, "role": user['role'], "email": email})
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

# --- USER MANAGEMENT (ADMIN) ---
@app.route("/admin/users", methods=["GET"])
def get_users():
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, name, email, role FROM users ORDER BY id") # Removed password from GET
    users = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(users)

@app.route("/admin/users", methods=["POST"])
def add_user():
    data = request.json or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "user")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password required"}), 400

    hashed_password = generate_password_hash(password)
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
            (name, email, hashed_password, role)
        )
        conn.commit()
        user_id = cur.lastrowid
        return jsonify({"success": True, "message": "User added", "id": user_id})
    except mysql.connector.IntegrityError:
        return jsonify({"success": False, "message": "User with this email already exists"}), 400
    finally:
        cur.close()
        conn.close()

@app.route("/admin/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "user")

    if not email or not password: # Password required to update
        return jsonify({"success": False, "message": "Email and password required"}), 400

    hashed_password = generate_password_hash(password)
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            "UPDATE users SET name=%s, email=%s, password=%s, role=%s WHERE id=%s",
            (name, email, hashed_password, role, user_id)
        )
        conn.commit()
        return jsonify({"success": True, "message": "User updated"})
    finally:
        cur.close()
        conn.close()

@app.route("/admin/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM users WHERE id=%s", (user_id,))
        conn.commit()
        return jsonify({"success": True, "message": "User deleted"})
    finally:
        cur.close()
        conn.close()

# --- FORM SUBMISSIONS (ADMIN) ---
@app.route("/admin/form-submissions", methods=["GET"])
def get_form_submissions():
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT id, school_name, location, grade, term, workbook, count, remark, submitted_by, submitted_at, delivered
        FROM entries
        ORDER BY submitted_at DESC
    """)
    submissions = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(submissions)

@app.route("/admin/form-submissions/<int:submission_id>", methods=["DELETE"])
def delete_submission(submission_id):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM entries WHERE id=%s", (submission_id,))
        conn.commit()
        return jsonify({"success": True, "message": f"Submission {submission_id} deleted"})
    finally:
        cur.close()
        conn.close()

@app.route("/admin/mark-delivered", methods=["PUT"])
def mark_delivered():
    data = request.json
    ids = data.get("ids", [])
    delivered = data.get("delivered", "Yes")

    if not ids:
        return jsonify({"success": False, "message": "No IDs provided"}), 400

    conn = get_conn()
    cur = conn.cursor()
    try:
        placeholders = ",".join(["%s"] * len(ids))
        query = f"UPDATE entries SET delivered = %s WHERE id IN ({placeholders})"
        params = [delivered] + ids
        cur.execute(query, params)
        conn.commit()
        return jsonify({"success": True, "updated": cur.rowcount})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# --- SCHOOL DATA (ADMIN) ---
@app.route("/admin/entries", methods=["GET"])
def get_entries():
    # ... (code is correct, just needs connection pool integration)
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    # The rest of the original logic is fine
    cur.execute("SELECT id, school_name, location, reporting_branch, num_students FROM school_data ORDER BY school_name")
    entries = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(entries)

@app.route("/admin/entries", methods=["POST"])
def add_entry():
    # ... (code is correct, just needs connection pool integration)
    data = request.json or {}
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO school_data (school_name, location, reporting_branch, num_students)
            VALUES (%s, %s, %s, %s)
        """, (data.get("school_name"), data.get("location"), data.get("reporting_branch"), data.get("num_students")))
        conn.commit()
        return jsonify({"success": True, "id": cur.lastrowid})
    finally:
        cur.close()
        conn.close()

@app.route("/admin/update/<int:row_id>", methods=["PUT"])
def update_entry(row_id):
    # ... (code is correct, just needs connection pool integration)
    data = request.json or {}
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE school_data
            SET school_name=%s, location=%s, reporting_branch=%s, num_students=%s
            WHERE id=%s
        """, (data.get("school_name"), data.get("location"), data.get("reporting_branch"), data.get("num_students"), row_id))
        conn.commit()
        return jsonify({"success": True, "message": f"Row {row_id} updated"})
    finally:
        cur.close()
        conn.close()

@app.route("/admin/delete/<int:entry_id>", methods=["DELETE"])
def delete_entry(entry_id):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM school_data WHERE id = %s", (entry_id,))
        conn.commit()
        if cur.rowcount > 0:
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "message": "School not found"})
    finally:
        cur.close()
        conn.close()


# --- WORKBOOKS (ADMIN) ---
@app.route("/admin/workbooks", methods=["GET"])
def get_workbooks():
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, grade, workbook_name, quantity FROM workbook_status")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(rows)

@app.route("/admin/workbooks", methods=["POST"])
def add_workbook():
    data = request.json
    grade = data.get("grade")
    workbook_name = data.get("workbook_name")
    quantity = data.get("quantity")

    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO workbook_status (grade, workbook_name, quantity) VALUES (%s, %s, %s)",
            (grade, workbook_name, quantity)
        )
        conn.commit()
        return jsonify({"success": True, "id": cur.lastrowid})
    finally:
        cur.close()
        conn.close()

@app.route("/admin/workbooks/<int:w_id>", methods=["PUT"])
def update_workbook(w_id):
    data = request.json
    qty = data.get("quantity")
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE workbook_status SET quantity = %s WHERE id = %s", (qty, w_id)
        )
        conn.commit()
        return jsonify({"success": True, "id": w_id, "quantity": qty})
    finally:
        cur.close()
        conn.close()

@app.route("/admin/workbooks/<int:w_id>", methods=["DELETE"])
def delete_workbook(w_id):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM workbook_status WHERE id = %s", (w_id,))
        conn.commit()
        return jsonify({"success": True, "id": w_id, "message": "Workbook deleted"})
    finally:
        cur.close()
        conn.close()


# --- USER-FACING FORM APIS ---
@app.route("/schools", methods=["GET"])
def get_schools():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT school_name FROM school_data ORDER BY school_name")
    schools = [r[0] for r in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(schools)

@app.route("/locations", methods=["GET"])
def get_locations():
    school = request.args.get("school", "")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT location FROM school_data WHERE school_name=%s ORDER BY location", (school,))
    locations = [r[0] for r in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(locations)

@app.route("/grades", methods=["GET"])
def get_grades():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT grade FROM workbook_status ORDER BY grade")
    grades = [r[0] for r in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(grades)

@app.route("/workbook_name", methods=["GET"])
def workbooks_by_grade():
    grade = request.args.get("grade")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT DISTINCT workbook_name FROM workbook_status WHERE grade=%s ORDER BY workbook_name",
        (grade,)
    )
    workbooks = [r[0] for r in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(workbooks)

@app.route("/submit", methods=["POST"])
def submit_form():
    data = request.json or {}
    submitted_at = datetime.utcnow() + timedelta(hours=5, minutes=30)

    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO entries
            (school_name, location, grade, term, workbook, count, remark, submitted_by, submitted_at, delivered)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'No')
        """, (data.get("school"), data.get("location"), data.get("grade"), data.get("term"), data.get("workbook"), data.get("count"), data.get("remark"), data.get("submitted_by"), submitted_at.isoformat()))
        conn.commit()
        new_id = cur.lastrowid
        return jsonify({"success": True, "id": new_id, "message": "Form submitted successfully"})
    finally:
        cur.close()
        conn.close()

@app.route("/user-info", methods=["GET"])
def user_info():
    email = request.args.get("email")
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT name, email FROM users WHERE email=%s", (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if user:
        return jsonify({"success": True, "name": user['name'], "email": user['email']})
    else:
        return jsonify({"success": False, "message": "User not found"}), 404

# --- DATABASE INITIALIZATION ---
def init_db():
    print("Initializing database...")
    conn = get_conn()
    cur = conn.cursor()
    # Create tables if they don't exist
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255),
            email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL
        )
    """)
    # ... Add other CREATE TABLE statements here for school_data, entries, etc.
    conn.commit()
    cur.close()
    conn.close()
    print("Database initialization check complete.")

# --- MAIN ---
if __name__ == "__main__":
    # init_db() # Run this once manually if needed, not on every server start
    app.run(debug=True, host="127.0.0.1", port=5001)