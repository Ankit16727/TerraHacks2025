from flask import Flask, request, jsonify
import whisper
import librosa
import numpy as np
from transformers import pipeline
from pymongo import MongoClient
import google.generativeai as genai
import os
from dotenv import load_dotenv
from playsound import playsound
from text_to_speech import get_elevenlabs_audio

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
        "zcr": float(np.mean(librosa.feature.zero_crossing_rate(y=y)[0])),
        "pause_ratio": float(len(np.where(np.abs(y) < 0.02)[0]) / len(y)),
        "tempo": float(librosa.beat.tempo(y=y, sr=sr)[0])
    }

def adjust_emotion_based_on_voice(text_emotion, audio_features):
    label = text_emotion['label']
    score = text_emotion['score']
    reason = ""
    adjusted = label

    # Define thresholds (based on observation / research)
    high_pause = audio_features['pause_ratio'] > 0.6
    low_energy = audio_features['energy'] < 0.02
    slow_tempo = audio_features['tempo'] < 90

    # If model says "joy" but voice sounds tired, override
    if label in ["joy", "neutral"] and (high_pause or low_energy or slow_tempo):
        adjusted = "tired or anxious"
        reason = "Emotion adjusted due to high pause ratio, low energy, or slow speech suggesting hidden fatigue/anxiety."
    elif label == "sadness" and low_energy and high_pause:
        adjusted = "deep sadness or burnout"
        reason = "Confirmed by voice: high pauses and low vocal energy."
    elif label == "anger" and audio_features['zcr'] > 0.1:
        reason = "ZCR is high, matching sharp/angry tone."
    else:
        reason = "No strong acoustic signal to override emotion."

    return adjusted, adjusted != label, reason

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

    prompt = f"""
    The user said: "{transcript}"

    Detected emotion: {adjusted_emotion}
    Voice cues:
    - Pause ratio: {audio_features['pause_ratio']:.2f}
    - Energy: {audio_features['energy']:.2f}
    - Tempo: {audio_features['tempo']:.1f}

    Respond like a real person who cares deeply.
    1. Briefly acknowledge what the user is feeling, in your own words.
    2. Then gently suggest one small thing that could help them feel even a little bit better.
    3. Keep it natural, conversational, and kind — like you're truly talking to them. No labels or step numbers.
    4. Be warm, human, and no instructions or stage directions.
    """

    # Uncomment when ready
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

    # Save to DB (if needed)
    # collection.insert_one(result)

    if os.path.exists(audio_path):
        os.remove(audio_path)

    return jsonify(result)

@app.route("/elevenlabs", methods=["POST"])
def elevenlabs_tts():
    get_elevenlabs_audio("Hi, I'm evelyn, I'm a lesbian and I unironically love eclipse editor.")
    elevenlabs_audio = "elevenlabs.wav"
    playsound(elevenlabs_audio)

if __name__ == "__main__":
    app.run(debug=True)
