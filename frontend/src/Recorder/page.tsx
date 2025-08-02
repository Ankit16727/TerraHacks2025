"use client"

import { Mic, MicOff, Square } from "lucide-react"
import { useState, useRef, useCallback } from "react"
import AudioVisualizer from "@/components/audio-visualizer"

export default function Recorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout>()

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })
      setPermissionGranted(true)
      setAudioStream(stream)
      return stream
    } catch (error) {
      console.error("Microphone permission denied:", error)
      setPermissionGranted(false)
      return null
    }
  }, [])

  const startRecording = useCallback(async () => {
    const stream = await requestMicrophonePermission()
    if (!stream) return

    audioChunksRef.current = []
    setRecordingTime(0)

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    })
    mediaRecorderRef.current = mediaRecorder

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
      const url = URL.createObjectURL(audioBlob)
      setAudioURL(url)

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // Stop all tracks to release the microphone
      stream.getTracks().forEach((track) => track.stop())
      setAudioStream(null)
    }

    mediaRecorder.start(100)
    setIsRecording(true)
  }, [requestMicrophonePermission])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getButtonContent = () => {
    if (permissionGranted === false) {
      return <MicOff className="w-15 h-15 text-white" />
    }
    if (isRecording) {
      return <Square className="w-12 h-12 text-white" />
    }
    return <Mic className="w-15 h-15 text-white" />
  }

  const getStatusText = () => {
    if (permissionGranted === false) {
      return "Microphone access denied"
    }
    if (isRecording) {
      return `Recording ${formatTime(recordingTime)} - Tap to stop`
    }
    if (audioURL) {
      return "Recording complete! Tap to record again"
    }
    return "Tap to speak"
  }

  const getButtonColor = () => {
    if (permissionGranted === false) {
      return "bg-red-400 hover:bg-red-500"
    }
    if (isRecording) {
      return "bg-red-500 shadow-lg scale-105"
    }
    if (audioURL) {
      return "bg-green-400 hover:bg-green-500"
    }
    return "bg-blue-200 hover:bg-blue-300 hover:shadow-md"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-200 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center space-y-12">
        {/* Main heading */}
        <h1 className="text-4xl md:text-5xl font-medium text-slate-700 leading-tight">How are you feeling today?</h1>

        {/* Voice input section */}
        <div className="flex flex-col items-center space-y-8">
          {/* Audio Visualizer - shows while recording */}
          <AudioVisualizer isRecording={isRecording} audioStream={audioStream} />

          {/* Microphone button */}
          <button
            onClick={handleMicClick}
            disabled={permissionGranted === false}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200 ${getButtonColor()} ${
              permissionGranted === false ? "cursor-not-allowed opacity-75" : ""
            }`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {getButtonContent()}
          </button>

          {/* Status text */}
          <p className="text-lg text-slate-600 font-medium">{getStatusText()}</p>

          {/* Audio playback */}
          {audioURL && (
            <div className="mt-6 space-y-4 w-full max-w-sm">
              <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                <audio controls className="w-full">
                  <source src={audioURL} type="audio/webm" />
                  Your browser does not support the audio element.
                </audio>
              </div>
              <button
                onClick={() => {
                  setAudioURL(null)
                  setPermissionGranted(null)
                  setRecordingTime(0)
                  if (audioURL) {
                    URL.revokeObjectURL(audioURL)
                  }
                }}
                className="px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                New Recording
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
