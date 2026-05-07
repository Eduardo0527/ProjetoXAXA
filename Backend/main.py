import os
import shutil
from dotenv import load_dotenv

from fastapi import FastAPI, Request, File, UploadFile, Form, status, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware

from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

import mysql.connector
from mysql.connector import pooling

import gemini

app = FastAPI()


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
    print("haha")
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post('/upload-audio')
async def upload_audio(request: Request, file: UploadFile = File(...)):
    username = request.session.get("username")
    if not username:
        return JSONResponse({'error': 'User not logged in!'}, status_code=400)
    
    if not file.filename:
        return JSONResponse({"error": "No selected file"}, status_code=400)  
    
    actual_mimetype = file.content_type
    safe_filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    classification = await gemini.process_audio(file_path, actual_mimetype)
    
    con = db_pool.get_connection()
    cursor = con.cursor()
    
    try:
        query_for_user = "SELECT p_id FROM users WHERE p_username = %s;"
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

    alert_payload = {
        "type": "ALERT",
        "data": {
            "hz": 0, # mockado mas acho que vamo tirar(acho q não vamos medir frequência?)
            "db": 85, # mockado
            "room": "Desconhecido", # mockado
            "severity": "high" if "chorando" in classification.lower() or "quebrando" in classification.lower() else "low", #também mockado por enquanto, acho que a gente vai classificar por decibeis
            "classification": classification
        }
    }
    
    await manager.broadcast(alert_payload)
        
    return JSONResponse({"message": f"O áudio é: {classification}"}, status_code=200)

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


@app.get('/logout', response_class=HTMLResponse)
def logout(request: Request):
    request.session.clear()
    return templates.TemplateResponse(request=request, name="logout.html")

@app.get('/login', response_class=HTMLResponse, name="login")
def login_get(request: Request):
    return templates.TemplateResponse(request=request, name="login.html")

@app.post('/login')
def login_post(request: Request, username: str = Form(...), password: str = Form(...)):
    con = db_pool.get_connection()
    cursor = con.cursor()
    
    try:
        query = "SELECT p_password FROM users WHERE p_username = %s;"
        cursor.execute(query, (username,))
        row = cursor.fetchone()
        
        if row and check_password_hash(row[0], password):
            print("Login successful")
            request.session['username'] = username
            return RedirectResponse(url=f"/success/{username}", status_code=status.HTTP_303_SEE_OTHER)
        else:
            print("Please check the username and the password!") 
            return templates.TemplateResponse(request=request, name='login.html', context={"error": "Invalid credentials"})
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