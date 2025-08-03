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
from database import save_analysis, get_user_history
from emotion_utils import extract_audio_features, adjust_emotion_based_on_voice
from twilio.rest import Client

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

def get_gemini_response(prompt, max_retries=3):
    """Get response from Gemini with retry logic and fallback"""
    for attempt in range(max_retries):
        try:
            # Try with different model names in case gemini-2.5-pro is not available
            model_names = ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-pro']
            
            for model_name in model_names:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt)
                    return response.text
                except Exception as model_error:
                    print(f"Model {model_name} failed: {str(model_error)}")
                    continue
            
            # If all models fail, wait and retry
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2  # Exponential backoff
                print(f"Attempt {attempt + 1} failed, retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            
        except Exception as e:
            print(f"Gemini API attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2
                time.sleep(wait_time)
    
    # Fallback response if Gemini completely fails
    return generate_fallback_response(prompt)

def generate_fallback_response(prompt):
    """Generate a basic response when Gemini API fails"""
    # Extract emotion from the prompt
    lines = prompt.split('\n')
    emotion = "neutral"
    
    for line in lines:
        if "Primary emotion:" in line:
            emotion = line.split("Primary emotion:")[-1].strip()
            break
    
    # Basic responses based on emotion
    responses = {
        "sadness": {
            "initial": "I can hear that you're going through a difficult time right now.",
            "detailed": "It's completely normal to feel sad sometimes. Consider taking some deep breaths, reaching out to someone you trust, or engaging in a small activity that usually brings you comfort."
        },
        "joy": {
            "initial": "I can sense the positive energy in your voice!",
            "detailed": "It's wonderful to hear you feeling good. This is a great time to share your joy with others or reflect on what's contributing to these positive feelings."
        },
        "anger": {
            "initial": "I notice some frustration in your voice.",
            "detailed": "When feeling angry, try taking a few deep breaths and counting to ten. Consider what specific situation is causing this feeling and whether there's a constructive way to address it."
        },
        "fear": {
            "initial": "I can sense some anxiety or concern in what you're sharing.",
            "detailed": "Fear and anxiety are natural responses to uncertainty. Try grounding yourself by focusing on what you can control right now, and remember that it's okay to seek support when you need it."
        },
        "surprise": {
            "initial": "You sound like something unexpected has happened.",
            "detailed": "Surprise can be both exciting and overwhelming. Take a moment to process what you're experiencing and consider how this new information or situation might affect you."
        }
    }
    
    default_response = {
        "initial": "I'm here to listen and support you.",
        "detailed": "Whatever you're feeling right now is valid. Take things one step at a time, and remember that it's okay to reach out for help when you need it."
    }
    
    response_data = responses.get(emotion.lower(), default_response)
    
    return f"INITIAL_RESPONSE: {response_data['initial']}\nDETAILED_RESPONSE: {response_data['detailed']}"

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

@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    # Handle preflight request
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", request.origin or "*")
        response.headers.add("Access-Control-Allow-Methods", "POST")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return response

    try:
        data = request.get_json()
        if not data or "message" not in data:
            response = jsonify({"error": "No message provided"})
            response.headers.add("Access-Control-Allow-Origin", request.origin or "*")
            return response, 400

        user_message = data["message"]
        context = data.get("context", "")
        conversation_history = data.get("conversation_history", "")

        # Create a focused prompt for ongoing conversation
        if context:
            prompt = context
        else:
            prompt = f"""
            You are a compassionate AI mental health assistant in an ongoing conversation.

            User just said: "{user_message}"

            Respond naturally and directly to what they said. Be conversational, empathetic, and ask follow-up questions about their specific statement. Keep responses 1-2 sentences unless they ask for more detail.
            
            Focus on their current words rather than giving generic advice.
            """

        # Get AI response with retry logic and fallback
        ai_response = get_gemini_response(prompt)
        
        result = {"reply": ai_response}
        
        # Create response with CORS headers
        response = jsonify(result)
        response.headers.add("Access-Control-Allow-Origin", request.origin or "*")
        return response

    except Exception as e:
        print(f"Chat error: {str(e)}")
        error_response = jsonify({"error": f"Chat failed: {str(e)}"})
        error_response.headers.add("Access-Control-Allow-Origin", request.origin or "*")
        return error_response, 500

@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze():
    # Handle preflight request
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", request.origin or "*")
        response.headers.add("Access-Control-Allow-Methods", "POST")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return response

    try:
        if 'audio' not in request.files:
            response = jsonify({"error": "Audio file missing"})
            response.headers.add("Access-Control-Allow-Origin", request.origin or "*")
            return response, 400

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

        Emotional Analysis:
        - Primary emotion: {adjusted_emotion}
        - Confidence: {text_emotion['score']:.2%}
        - Voice indicators:
          * Pause ratio: {audio_features['pause_ratio']:.2f} (higher values suggest hesitation/anxiety)
          * Energy level: {audio_features['energy']:.2f} (lower values might indicate low mood)
          * Speech tempo: {audio_features['tempo']:.1f} (faster tempo could indicate stress/anxiety)
        
        You are an empathetic mental health assistant. Based on this emotional analysis:
        1. First, provide a warm, understanding acknowledgment of their emotional state (1 sentence)
        2. Then, expand with specific observations about their voice and emotional indicators
        3. Finally, suggest a tailored coping strategy for their detected {adjusted_emotion}

        Keep the response natural and conversational. Split your response into two parts:
        INITIAL_RESPONSE: A warm, immediate acknowledgment (1 sentence)
        DETAILED_RESPONSE: The deeper insights and coping strategy (2-3 sentences)

        Do not use any symbols or formatting in the response, that includes bolding, italics, underline, etc.
        Additionally, make sure to not write and start with something along the lines of Here is an emotionally emphatic response.
        Keep it concise and focused on the user's emotional well-being.
        """

        # Get AI response with retry logic and fallback
        gemini_response = get_gemini_response(prompt)
        
        # Split the response into initial and detailed parts
        response_parts = gemini_response.split("DETAILED_RESPONSE:")
        initial_response = response_parts[0].replace("INITIAL_RESPONSE:", "").strip()
        detailed_response = response_parts[1].strip() if len(response_parts) > 1 else ""

        result = {
            "transcript": transcript,
            "text_emotion": text_emotion['label'],
            "confidence": round(text_emotion['score'], 2),
            "adjusted_emotion": adjusted_emotion,
            "flagged_by_voice": flagged,
            "adjustment_reason": reason,
            "audio_features": audio_features,
            "welcome_message": initial_response,  # Use Gemini's initial response as welcome
            "gemini_reply": detailed_response,    # Use the detailed part as main reply
        }
        
        # Save analysis
        try:
            save_analysis(result, user_id="default_user")
        except Exception as db_error:
            print(f"Database save error: {str(db_error)}")
            # Continue without saving if database fails

        # Clean up temp file
        if os.path.exists(audio_path):
            os.remove(audio_path)

        # Create response with CORS headers
        response = jsonify(result)
        response.headers.add("Access-Control-Allow-Origin", request.origin or "*")
        return response

    except Exception as e:
        print(f"Analysis error: {str(e)}")
        error_response = jsonify({"error": f"Analysis failed: {str(e)}"})
        error_response.headers.add("Access-Control-Allow-Origin", request.origin or "*")
        return error_response, 500

@app.route("/history", methods=["GET"])
def history():
    user_id = request.args.get("user_id", "default_user")
    history = get_user_history(user_id)
    response = [
        {
            "_id": str(item["_id"]),
            "transcript": item.get("transcript", ""),
            "text_emotion": item.get("text_emotion", ""),
            "adjusted_emotion": item.get("adjusted_emotion", ""),
            "gemini_reply": item.get("gemini_reply", ""),
            "confidence": item.get("confidence", 0.0),
            "timestamp": str(item["_id"].generation_time)
        } for item in history
    ]
    return jsonify(response)

@app.route("/call-alert", methods=["POST"])
def call_alert():
    data = request.get_json()
    transcript = data.get("transcript", "The user expressed distress.")

    try:
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        client = Client(account_sid, auth_token)

        call = client.calls.create(
            twiml=f'<Response><Say voice="alice">{transcript}</Say></Response>',
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            to=os.getenv("TRUSTED_CONTACT_NUMBER")
        )

        return jsonify({"status": "success", "sid": call.sid})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    os.makedirs("audio", exist_ok=True)
    app.run(debug=True, use_reloader=False)
