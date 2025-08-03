"use client"

import { ChevronLeft, Send, Bot, User, Mic, MicOff } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import AudioVisualizer from "@/components/audio-visualizer"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  emotion?: string
  confidence?: number
}

export default function ChatbotPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isBotTyping, setIsBotTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [emotionalAnalysis, setEmotionalAnalysis] = useState<any>(null)

  useEffect(() => {
    // Load emotional analysis data when component mounts
    const savedAnalysis = localStorage.getItem('emotionalAnalysis')
    if (savedAnalysis) {
      const parsed = JSON.parse(savedAnalysis)
      setEmotionalAnalysis(parsed)
      
      // Create initial welcome message based on emotion
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: generateWelcomeMessage(parsed.adjusted_emotion),
        sender: "bot",
        timestamp: new Date(),
        emotion: parsed.adjusted_emotion,
        confidence: parsed.confidence
      }
      setMessages([welcomeMessage])
      setShowChat(true)
    }
    
    // Clean up
    return () => {
      localStorage.removeItem('emotionalAnalysis')
    }
  }, [])

  const generateWelcomeMessage = (emotion: string) => {
    const templates: {[key: string]: string} = {
      "stress": "I notice you're feeling stressed. Let's work through this together. How long have you been feeling this way?",
      "anxiety": "I can sense some anxiety. That's perfectly normal, and I'm here to help. Would you like to talk about what's causing these feelings?",
      "sadness": "I understand you're feeling down. Your feelings are valid, and I'm here to listen. What's been on your mind?",
      "anger": "I can tell you're frustrated. It's important to acknowledge these feelings. Would you like to tell me more about what's bothering you?",
      "joy": "It's wonderful to hear the positivity in your voice! What's been making you feel this way?",
      "neutral": "Thank you for sharing with me. I'm here to listen and support you. How are you feeling right now?"
    }
    
    return templates[emotion.toLowerCase()] || templates.neutral
  }

  const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    setAudioStream(stream)
    
    const recorder = new MediaRecorder(stream)
    setMediaRecorder(recorder)
    
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => chunks.push(e.data)
    
    recorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: "audio/wav" })
      const formData = new FormData()
      formData.append("audio", audioBlob)
      
      setIsBotTyping(true)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analyze`, {
          method: "POST",
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        const welcomeMessage: Message = {
            id: Date.now().toString(),
            text: result.welcome_message,
            sender: "bot",
            timestamp: new Date()
        }
        setMessages(prev => [...prev, welcomeMessage])

        // Play welcome audio
        const welcomeAudio = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/speak`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: result.welcome_message }),
        })
        
        const welcomeBlob = await welcomeAudio.blob()
        const welcomeSound = new Audio(URL.createObjectURL(welcomeBlob))
        await welcomeSound.play()

        // Wait for welcome message to finish
        await new Promise(resolve => {
            welcomeSound.onended = resolve
        })

        // Then add and play AI response
        const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: result.gemini_reply,
            sender: "bot",
            timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])

        const responseAudio = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/speak`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: result.gemini_reply }),
        })
        
        const responseBlob = await responseAudio.blob()
        const responseSound = new Audio(URL.createObjectURL(responseBlob))
        await responseSound.play()

    } catch (error) {
        console.error("Failed to analyze audio:", error)
    }
    setIsBotTyping(false)
}
    
    recorder.start()
    setIsRecording(true)
    
  } catch (error) {
    console.error("Error accessing microphone:", error)
  }
}

  const stopRecording = () => {
    mediaRecorder?.stop()
    audioStream?.getTracks().forEach(track => track.stop())
    setIsRecording(false)
    setMediaRecorder(null)
    setAudioStream(null)
  }

  const handleBack = () => {
    if (showChat) {
      setShowChat(false)
      setMessages([])
      setInputText("")
    }
  }

  const handleContinue = () => {
    setIsLoading(true)
    // Remove setTimeout and directly set the states
    setIsLoading(false)
    setShowChat(true)
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: "Hello! I'm here to help you. How are you feeling today? Feel free to speak or type what's on your mind.",
      sender: "bot",
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }

  const sendMessage = async () => {
    if (!inputText.trim() || isBotTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText("")
    setIsBotTyping(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      })
      
      const result = await response.json()
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: result.reply,
        sender: "bot",
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, botMessage])

      // Play audio response
      const audioResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: result.reply }),
      })
      
      const audioBlob = await audioResponse.blob()
      const audio = new Audio(URL.createObjectURL(audioBlob))
      await audio.play()

    } catch (error) {
      console.error("Failed to get response:", error)
    }
    
    setIsBotTyping(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const MessageBubble = ({ message }: { message: Message }) => (
    <div
      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
        message.sender === "user"
          ? "bg-blue-500 text-white"
          : "bg-white/40 backdrop-blur-sm text-slate-700 border border-white/50"
      }`}
    >
      <div className="flex items-start space-x-2">
        {message.sender === "bot" && (
          <Bot className="w-4 h-4 mt-1 text-slate-500" />
        )}
        {message.sender === "user" && (
          <User className="w-4 h-4 mt-1 text-blue-100" />
        )}
        <div>
          <p className="text-sm leading-relaxed">{message.text}</p>
          {message.emotion && (
            <p className="text-xs mt-1 opacity-75">
              Emotion: {message.emotion} ({message.confidence}% confidence)
            </p>
          )}
        </div>
      </div>
    </div>
  )

  if (showChat) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-200 flex flex-col">
        <div className="flex items-center justify-between p-6 pt-12 bg-white/20 backdrop-blur-sm border-b border-white/30">
          <button 
            onClick={handleBack}
            className="flex items-center text-slate-600 hover:text-slate-800 transition-colors duration-200"
          >
            <ChevronLeft className="w-6 h-6 mr-2" />
            <span className="text-lg font-medium">Back</span>
          </button>
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-slate-600" />
            <span className="text-lg font-medium text-slate-700">AI Assistant</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <MessageBubble message={message} />
            </div>
          ))}
          
          {isBotTyping && (
            <div className="flex justify-start">
              <div className="bg-white/40 backdrop-blur-sm text-slate-700 border border-white/50 px-4 py-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-slate-500" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-white/20 backdrop-blur-sm border-t border-white/30">
          <div className="flex space-x-4">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isBotTyping || isRecording}
              className="flex-1 px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-6 py-3 ${
                isRecording 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white rounded-xl transition-colors duration-200 flex items-center justify-center`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={sendMessage}
              disabled={(!inputText.trim() && !isRecording) || isBotTyping}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {isRecording && (
            <div className="mt-4">
              <AudioVisualizer isRecording={isRecording} audioStream={audioStream} />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-200 flex flex-col">
      <div className="flex items-center p-6 pt-12">
        <button 
          onClick={handleBack}
          className="flex items-center text-slate-600 hover:text-slate-800 transition-colors duration-200"
        >
          <ChevronLeft className="w-6 h-6 mr-2" />
          <span className="text-lg font-medium">Back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-lg w-full mx-auto text-center space-y-12">
          <div className="bg-white/30 backdrop-blur-sm rounded-xl p-8 border border-white/40 shadow-lg">
            <p className="text-slate-700 text-center leading-relaxed text-base font-medium">
              Welcome to your AI Mental Health Assistant. Here you can speak or type freely about your thoughts and feelings. 
              The AI will analyze your emotions and provide supportive responses, both in text and voice.
            </p>
          </div>

          <button 
            onClick={handleContinue}
            disabled={isLoading}
            className={`w-full py-4 px-6 rounded-xl font-medium text-white transition-all duration-200 ${
              isLoading 
                ? "bg-slate-400 cursor-not-allowed" 
                : "bg-blue-400 hover:bg-blue-500 hover:shadow-lg hover:scale-[1.02]"
            }`}
          >
            {isLoading ? "Loading..." : "Start Conversation"}
          </button>
        </div>
      </div>
    </div>
  )
}