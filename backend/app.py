from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import whisper
import librosa
import numpy as np
from transformers import pipeline
import google.generativeai as genai
from playsound import playsound
from text_to_speech import get_elevenlabs_audio
from database import save_analysis, get_user_history
from emotion_utils import extract_audio_features, adjust_emotion_based_on_voice

load_dotenv()
app = Flask(__name__)
CORS(app)

# Load Whisper model
whisper_model = whisper.load_model("tiny")

# Load Hugging Face emotion classifier
emotion_model = pipeline("text-classification", model="nateraw/bert-base-uncased-emotion")

# Gemini API setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

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

@app.route("/elevenlabs", methods=["POST"])
def elevenlabs_tts():
    get_elevenlabs_audio("Hi, I'm Evelyn. I'm here to help you feel better.")
    playsound("elevenlabs.wav")
    return jsonify({"status": "played"})

if __name__ == "__main__":
    app.run(debug=True)
