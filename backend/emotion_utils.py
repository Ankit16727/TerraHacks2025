import whisper
import librosa
import numpy as np
from transformers import pipeline

# Load models once
whisper_model = whisper.load_model("base")
emotion_model = pipeline("text-classification", model="nateraw/bert-base-uncased-emotion")

def transcribe_audio(audio_path):
    return whisper_model.transcribe(audio_path)["text"]

def extract_audio_features(audio_path):
    y, sr = librosa.load(audio_path)
    return {
        "energy": float(np.mean(librosa.feature.rms(y=y)[0])),
        "zcr": float(np.mean(librosa.feature.zero_crossing_rate(y=y)[0])),
        "pause_ratio": float(len(np.where(np.abs(y) < 0.02)[0]) / len(y)),
        "tempo": float(librosa.beat.tempo(y=y, sr=sr)[0])
    }

def classify_emotion(text):
    return emotion_model(text)[0]

def adjust_emotion_based_on_voice(text_emotion, audio_features):
    label = text_emotion['label']
    adjusted = label
    reason = ""

    high_pause = audio_features['pause_ratio'] > 0.6
    low_energy = audio_features['energy'] < 0.02
    slow_tempo = audio_features['tempo'] < 90

    if label in ["joy", "neutral"] and (high_pause or low_energy or slow_tempo):
        adjusted = "tired or anxious"
        reason = "Adjusted due to high pause ratio, low energy, or slow tempo suggesting fatigue/anxiety."
    elif label == "sadness" and low_energy and high_pause:
        adjusted = "deep sadness or burnout"
        reason = "High pauses and low vocal energy confirm deeper sadness."
    elif label == "anger" and audio_features['zcr'] > 0.1:
        reason = "ZCR high, tone indicates sharpness/anger."
    else:
        reason = "No strong acoustic signal to override emotion."

    return adjusted, adjusted != label, reason
