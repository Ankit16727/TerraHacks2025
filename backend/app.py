from flask import Flask, request, jsonify, send_file
import io
import requests
from flask_cors import CORS
import os
from dotenv import load_dotenv
import whisper
import librosa
import numpy as np
import requests
from transformers import pipeline
import google.generativeai as genai
from playsound import playsound
from database import save_analysis, get_user_history
from emotion_utils import extract_audio_features, adjust_emotion_based_on_voice

load_dotenv()
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Load Whisper model
whisper_model = whisper.load_model("tiny")

# Load Hugging Face emotion classifier
emotion_model = pipeline("text-classification", model="nateraw/bert-base-uncased-emotion")

# Gemini API setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

def get_elevenlabs_audio(text):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": API_KEY
    }

    data = {
        "text": text,
        "voice_settings": {
            "stability": 0.4,
            "similarity_boost": 0.5
        }
    }

    response = requests.post(url, json=data, headers=headers)
    response.raise_for_status()
    return response.content

@app.route("/speak", methods=["POST", "OPTIONS"])
def speak():
    # Handle preflight request
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Methods", "POST")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return response

    # Handle actual request
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400
        
    try:
        audio_data = get_elevenlabs_audio(data["text"])
        response = send_file(
            io.BytesIO(audio_data),
            mimetype="audio/mpeg",
            as_attachment=True,
            download_name="response.mp3"
        )
        # Add CORS headers to the response
        response.headers.add("Access-Control-Allow-Origin", request.origin or "*")
        return response
    except Exception as e:
        print(f"Text-to-speech error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/analyze", methods=["POST"])
def analyze():
    if 'audio' not in request.files:
        return jsonify({"error": "Audio file missing"}), 400

    audio_file = request.files['audio']
    audio_path = "audio/temp.wav"
    audio_file.save(audio_path)

    # 1. Transcribe
    transcript = whisper_model.transcribe(audio_path)["text"]

    # 2. Audio features
    audio_features = extract_audio_features(audio_path)

    # 3. Text emotion
    text_emotion = emotion_model(transcript)[0]

    # 4. Adjust using audio clues
    adjusted_emotion, flagged, reason = adjust_emotion_based_on_voice(text_emotion, audio_features)

    # 5. Gemini
    prompt = f"""
    The user said: \"{transcript}\"

    Detected emotion: {adjusted_emotion}
    Voice cues:
    - Pause ratio: {audio_features['pause_ratio']:.2f}
    - Energy: {audio_features['energy']:.2f}
    - Tempo: {audio_features['tempo']:.1f}

    Respond like a real person who cares deeply.
    Briefly acknowledge what the user is feeling, then gently suggest one small thing that could help them feel better. Be warm and conversational.
    """

    gemini_reply = genai.GenerativeModel('models/gemini-2.5-pro').generate_content(prompt).text

    result = {
        "transcript": transcript,
        "text_emotion": text_emotion['label'],
        "confidence": round(text_emotion['score'], 2),
        "adjusted_emotion": adjusted_emotion,
        "flagged_by_voice": flagged,
        "adjustment_reason": reason,
        "audio_features": audio_features,
        "gemini_reply": gemini_reply
    }

    save_analysis(result, user_id="default_user")

    if os.path.exists(audio_path):
        os.remove(audio_path)

    return jsonify(result)

@app.route("/history", methods=["GET"])
def history():
    user_id = request.args.get("user_id", "default_user")
    history = get_user_history(user_id)
    response = [
        {
            "transcript": item["transcript"],
            "emotion": item["adjusted_emotion"],
            "confidence": item["confidence"],
            "timestamp": str(item["_id"].generation_time)
        } for item in history
    ]
    return jsonify(response)

if __name__ == "__main__":
    os.makedirs("audio", exist_ok=True)
    app.run(debug=True, use_reloader=False)
