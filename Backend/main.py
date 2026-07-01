import os
import shutil
from dotenv import load_dotenv

from fastapi import FastAPI, Request, File, UploadFile, Form, status, WebSocket, WebSocketDisconnect, Header
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import secrets
import hashlib

import time  
from collections import deque

from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

import mysql.connector
from mysql.connector import pooling


BUFFER_MAXLEN = 100
live_buffers = {}

app = FastAPI()

load_dotenv()


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY")
)

templates = Jinja2Templates(directory="templates")

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
db_pass = os.getenv("DATABASE_PASSWORD")

dbconfig = {
    "host": "localhost",
    "user": "root",
    "password": db_pass, 
    "database": "PROJETOMCMP"
}

db_pool = pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=5,
    pool_reset_session=True,
    **dbconfig
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error sending message to a client: {e}")
                
manager = ConnectionManager()

@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        

@app.websocket("/ws/sensor")
async def sensor_input(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            
            hashed = hashlib.sha256(data["key"].encode()).hexdigest()
            con = db_pool.get_connection()
            cursor = con.cursor()
            try:
                cursor.execute("SELECT device_id FROM devices WHERE api_key = %s;", (hashed,))
                row = cursor.fetchone()
            finally:
                cursor.close()
                con.close()

            if not row:
                await websocket.close(code=1008)  
                return

            db   = data["db"]
            room = data["room"]
            severity = "HIGH" if db > 80.0 else "LOW"

            timestamp = int(time.time() * 1000)
            if room not in live_buffers:
                live_buffers[room] = deque(maxlen=BUFFER_MAXLEN)
            live_buffers[room].append({"db": db, "t": timestamp})

            await manager.broadcast({
                "type": "READING",
                "data": {"db": db, "room": room, "t": timestamp, "severity": severity}
            })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Sensor WS error: {e}")
        await websocket.close()


@app.post('/upload-audio')
async def upload_sensor_data(
    request: Request,
    db: float = Form(...),
    room: str = Form(...),
    is_alert: bool = Form(False),  
    x_api_key: str = Header(None)
):
    if not x_api_key:
        return JSONResponse({'error': 'Missing API Key'}, status_code=401)

    severity = "HIGH" if db > 80.0 else "LOW"
    classification = "Normal" 
    
    con    = db_pool.get_connection()
    cursor = con.cursor()
    try:
        hashed_key = hashlib.sha256(x_api_key.encode()).hexdigest()
        cursor.execute("SELECT device_id FROM devices WHERE api_key = %s;", (hashed_key,))
        row = cursor.fetchone()
        if not row:
            return JSONResponse({'error': 'Invalid API Key'}, status_code=401)
        if is_alert:
            classification = f"Ruído de {db:.1f}dB registrado: {room}"
            cursor.execute(
                "INSERT INTO sounds (sound_description, device_id) VALUES (%s, %s);",
                (classification, row[0])
            )
            con.commit()
    finally:
        cursor.close()
        con.close()

    timestamp = int(time.time() * 1000)
    if room not in live_buffers:
        live_buffers[room] = deque(maxlen=BUFFER_MAXLEN)
    live_buffers[room].append({"db": db, "t": timestamp})

    await manager.broadcast({
        "type":  "ALERT" if is_alert else "READING",
        "data":  {
            "db": db, 
            "room": room, 
            "t": timestamp, 
            "severity": severity,
            "classification": classification 
        }
    })

    return JSONResponse({"message": "OK"}, status_code=200)


@app.get("/view-sounds", response_class=HTMLResponse)
def sounds_page(request: Request):
    username = request.session.get("username")
    if not username:
        return templates.TemplateResponse(request=request, name="login_required.html")
    
    con = db_pool.get_connection()
    cursor = con.cursor()
    rows = []
    
    try:
        query = "SELECT p_id FROM users where p_username = %s;"
        cursor.execute(query, (username,))
        row = cursor.fetchone()
        
        if row:
            user_id = row[0]
            query = "SELECT sound_description FROM sounds WHERE p_id = %s;"
            cursor.execute(query, (user_id,))
            rows = cursor.fetchall()
            
    finally:
        cursor.close()
        con.close()
        
    return templates.TemplateResponse(request=request, name="last_sounds.html", context={"rows": rows})
    
    
@app.get('/upload-front', response_class=HTMLResponse)
def load_ui(request: Request):
    return templates.TemplateResponse(request=request, name='upload.html')

@app.post('/add-device')
def add_device(request: Request, device_name: str = Form(...)):
    username = request.session.get("username")
    if not username:
        return JSONResponse({'error': 'You must be logged in to add a device'}, status_code=401)
    
    con = db_pool.get_connection()
    cursor = con.cursor()
    
    try:
        query_user = "SELECT p_id FROM users WHERE p_username = %s;"
        cursor.execute(query_user, (username,))
        user_row = cursor.fetchone()
        
        if not user_row:
            return JSONResponse({'error': 'User not found'}, status_code=404)
        
        user_id = user_row[0]
        
        raw_api_key = f"esp32_{secrets.token_urlsafe(32)}"
        
        hashed_key = hashlib.sha256(raw_api_key.encode()).hexdigest()
        
        query_insert = "INSERT INTO devices (p_id, device_name, api_key) VALUES (%s, %s, %s);"
        cursor.execute(query_insert, (user_id, device_name, hashed_key))
        con.commit()
        
        return JSONResponse({
            "message": "Device added successfully!",
            "device_name": device_name,
            "api_key": raw_api_key
        }, status_code=201)
        
    except Exception as e:
        return JSONResponse({'error': f"Failed to add device: {str(e)}"}, status_code=500)
        
    finally:
        cursor.close()
        con.close()

@app.get("/create-device",response_class=HTMLResponse)
def load_ui(request: Request):
    return templates.TemplateResponse(request=request, name='create_device.html')
    


@app.get('/logout', response_class=HTMLResponse)
def logout(request: Request):
    request.session.clear()
    return templates.TemplateResponse(request=request, name="logout.html")

@app.get('/login', response_class=HTMLResponse, name="login")
def login_get(request: Request):
    return templates.TemplateResponse(request=request, name="login.html")


@app.get('/me')
def get_current_user(request: Request):
    username = request.session.get("username")
    if not username:
        return JSONResponse({'error': 'Not authenticated'}, status_code=401)
    return JSONResponse({"username": username}, status_code=200)

@app.post('/api/login')
def api_login_post(request: Request, username: str = Form(...), password: str = Form(...)):
    con = db_pool.get_connection()
    cursor = con.cursor()
    try:
        query = "SELECT p_id, p_password FROM users WHERE p_username = %s;"
        cursor.execute(query, (username,))
        row = cursor.fetchone()
        
        if row and check_password_hash(row[1], password):
            request.session['username'] = username
            
            user_data = {
                "id": row[0], 
                "username": username
            }
            
            return JSONResponse({"message": "Login successful", "user": user_data}, status_code=200)
        else:
            return JSONResponse({"error": "Invalid credentials"}, status_code=401)
    finally: 
        cursor.close()
        con.close()


@app.get('/register', response_class=HTMLResponse, name="register")
def register_get(request: Request):
    return templates.TemplateResponse(request=request, name="register.html")

@app.post('/register')
def register_post(request: Request, username: str = Form(...), password: str = Form(...)):
    con = db_pool.get_connection()
    cursor = con.cursor()
    
    try:
        query = "SELECT * FROM users WHERE p_username = %s"
        cursor.execute(query, (username,))
        row = cursor.fetchall()
        
        if row:
            print("Username already exists!")
            return templates.TemplateResponse(request=request, name="register.html", context={"error": "Username already exists"})
        else:
            query = "INSERT INTO users (p_username, p_password) VALUES (%s, %s);"
            hashed_pw = generate_password_hash(password)
            cursor.execute(query, (username, hashed_pw))
            con.commit()
            
            print(f"User: {username} successfully created!")
            request.session["username"] = username
            return RedirectResponse(url=f"/success/{username}", status_code=status.HTTP_303_SEE_OTHER)
            
    finally:
        cursor.close()
        con.close()


@app.get('/success/{name}', response_class=HTMLResponse)
def success(name: str):
    return f'Hello, {name}, you have successfully logged in.'


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5000)