import os
import socket

from flask import Flask, request, redirect, url_for, render_template, jsonify, session, abort

from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

import mysql.connector
from mysql.connector import pooling

import gemini

app = Flask(__name__)
app.secret_key = "SaQjZK0DpT3AV8ZfIpTdRHMUJd8P1fkHx2Umm3E-8CUD7iAuW-Q3pGrVX4nDTCIva5Mdw1dvkASzvilbQcskyQ"
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


dbconfig = {
    "host": "localhost",
    "user": "root",
    "password": "SIGMALIGMA67@", 
    "database": "PROJETOMCMP"
}

db_pool = pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=5,
    pool_reset_session=True,
    **dbconfig
)

@app.route('/upload-audio', methods=['POST'])
async def upload_audio():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    if not session.get("username"):
        return jsonify({'error': 'User not logged in!'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400  
    
    if file:
        actual_mimetype = file.mimetype
        
        safe_filename = secure_filename(file.filename)
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], safe_filename)
        file.save(file_path)
        
        classification = await gemini.process_audio(file_path, actual_mimetype)
        
        con = db_pool.get_connection()
        cursor = con.cursor()
        
        try:
            query_for_user = "SELECT p_id FROM users WHERE p_username = %s;"
            username = session['username']
            cursor.execute(query_for_user, (username,))
            row = cursor.fetchone()
            
            if row: 
                user_id = row[0]
                query = "INSERT INTO sounds (sound_description, p_id) VALUES (%s, %s);"
                cursor.execute(query, (classification, user_id))
                con.commit()     
        finally:
            cursor.close()
            con.close()
            
        return jsonify({"message": f"O áudio é: {classification}"}), 200
    
@app.route("/view-sounds")
def sounds_page():
    if not session.get("username"):
        return render_template("login_required.html")
    
    con = db_pool.get_connection()
    cursor = con.cursor()
    
    try:
        username = session['username']
        query = "SELECT p_id FROM users where p_username = %s;"
        cursor.execute(query, (username,))
        row = cursor.fetchone()
        
        rows = []
        if row:
            user_id = row[0]
            query = "SELECT sound_description FROM sounds WHERE p_id = %s;"
            cursor.execute(query, (user_id,))
            rows = cursor.fetchall()
            
    finally:
        cursor.close()
        con.close()
        
    return render_template("last_sounds.html", rows=rows)
    
@app.route('/upload-front')
def load_ui():
    return render_template('upload.html')

@app.route('/logout')
def logout():
    session['username'] = None
    return render_template("logout.html")

@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        con = db_pool.get_connection()
        cursor = con.cursor()
        try:
            query = "SELECT p_password FROM users WHERE p_username = %s;"
            cursor.execute(query, (username,))
            row = cursor.fetchone()
            
            if row and check_password_hash(row[0], password):
                print("Login successful")
                session['username'] = username
                return redirect(url_for('success', name=username))
            else:
                print("Please check the username and the password!")      
        finally: 
            cursor.close()
            con.close()
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        con = db_pool.get_connection()
        cursor = con.cursor()
        
        try:
            query = "SELECT * FROM users WHERE p_username = %s"
            cursor.execute(query, (username,))
            row = cursor.fetchall()
            
            if row:
                print("Username already exists!")
            else:
                query = "INSERT INTO users (p_username, p_password) VALUES (%s, %s);"
                hashed_pw = generate_password_hash(password)
                cursor.execute(query, (username, hashed_pw))
                con.commit()
                
                print(f"User: {username} successfully created!")
                session["username"] = username
                return redirect(url_for('success', name=username))
                
        finally:
            cursor.close()
            con.close()
            
    return render_template("register.html")

@app.route('/success/<name>')
def success(name):
    return f'Hello, {name}, you have successfully logged in.'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)