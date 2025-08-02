import os
import requests
from dotenv import load_dotenv

load_dotenv()

def get_elevenlabs_audio(text, output_path="elevenlabs.wav"):
    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "text": text,
        "voice_settings": {
            "stability": 0.4,
            "similarity_boost": 0.75
        }
    }

    response = requests.post(url, headers=headers, json=payload)
    with open(output_path, "wb") as f:
        f.write(response.content)
