# Use official Python image
FROM python:3.10-slim

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y ffmpeg gcc libsndfile1

# Set working directory
WORKDIR /app

# Copy all files to the container
COPY . .

# Install required Python packages
RUN pip install --no-cache-dir \
    flask \
    flask-cors \
    python-dotenv \
    openai-whisper \
    transformers \
    google-generativeai \
    pymongo \
    twilio \
    librosa \
    soundfile \
    numpy

# Run the app
CMD ["python", "app.py"]
