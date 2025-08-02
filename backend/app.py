from flask import Flask, request, jsonify
import whisper
import librosa
import numpy as np
from transformers import pipeline
from pymongo import MongoClient
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# Load Whisper model
whisper_model = whisper.load_model("base")

# Load Hugging Face emotion classifier
emotion_model = pipeline("text-classification", model="nateraw/bert-base-uncased-emotion")

# Connect to MongoDB
client = MongoClient(os.getenv("MONGO_URI"))
db = client["lifelens"]
collection = db["records"]

# Gemini API setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def extract_audio_features(audio_path):
    y, sr = librosa.load(audio_path)

    return {
        "energy": float(np.mean(librosa.feature.rms(y=y)[0])),
        "zcr": float(np.mean(librosa.feature.zero_crossing_rate(y)[0])),
        "pause_ratio": float(len(np.where(np.abs(y) < 0.02)[0]) / len(y)),
        "tempo": float(librosa.beat.tempo(y=y, sr=sr)[0])
    }

@app.route("/analyze", methods=["POST"])
def analyze():
    if 'audio' not in request.files:
        return jsonify({"error": "Audio file missing"}), 400

    audio_file = request.files['audio']
    audio_path = "audio/temp.wav"
    audio_file.save(audio_path)

    # 1. Transcribe with Whisper
    transcript = whisper_model.transcribe(audio_path)["text"]

    # 2. Extract audio features
    audio_features = extract_audio_features(audio_path)

    # 3. Detect emotion from text
    text_emotion = emotion_model(transcript)[0]

    # 4. Gemini prompt
    prompt = f"""
    A user said: "{transcript}"
    Transcript emotion: {text_emotion['label']} (confidence: {round(text_emotion['score'], 2)})
    Voice features:
    - Pause ratio: {audio_features['pause_ratio']:.2f}
    - Energy: {audio_features['energy']:.2f}
    - Tempo: {audio_features['tempo']:.1f}

    Based on this, write a short sentence about how the person might be feeling. Then give a supportive one-liner.
    """

    # 5. Get Gemini response
    gemini_reply = genai.GenerativeModel('gemini-pro').generate_content(prompt).text

    # 6. Prepare response
    result = {
        "transcript": transcript,
        "text_emotion": text_emotion['label'],
        "confidence": round(text_emotion['score'], 2),
        "audio_features": audio_features,
        "gemini_reply": gemini_reply
    }

    # 7. Save to MongoDB
    collection.insert_one(result)

    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)


