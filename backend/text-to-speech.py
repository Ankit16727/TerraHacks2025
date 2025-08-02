import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

TEXT = "Hi, I'm evelyn, I'm a lesbian and I unironically love eclipse editor."

URL = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

headers = {
    "Content-Type": "application/json",
    "xi-api-key": API_KEY
}

payload = {
    "text": TEXT,
    "voice_settings": {
        "stability": 0.4,
        "similarity_boost": 0.5
    }
}

response = requests.post(URL, json=payload, headers=headers)
response.raise_for_status()

output_file = "elevenlabs.wav"
with open(output_file, "wb") as f:
    f.write(response.content)

print(f"Audio content written to {output_file}")
