import os
from google import genai
import time
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_KEY")


model_name = 'gemini-2.5-flash'

async def process_audio(audio_path, actual_mimetype):
    try:
        client = genai.Client(api_key=API_KEY)
            
        print(f"Reading 5-second audio file: {audio_path} (MIME: {actual_mimetype})")
        
        with open(audio_path, 'rb') as f:
            audio_bytes = f.read()

        audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=actual_mimetype)
        prompt = "Classifique o som, apenas diga o que ele é"

        start_time = time.time()
        
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt, audio_part]
        )
        end_time = time.time()
        print(f"Response received in {round(end_time - start_time, 2)} seconds!")
        
        return response.text 
    except FileNotFoundError:
        print(f"Error: Audio file not found at {audio_path}")
    except Exception as e:
        print(f"An error occurred: {e}")