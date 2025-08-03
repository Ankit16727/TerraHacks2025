"use client"

import { ChevronLeft, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, MessageCircle } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import AudioVisualizer from "@/components/audio-visualizer"

interface Caption {
  id: string
  text: string
  speaker: "user" | "assistant"
  timestamp: Date
  isComplete: boolean
}

interface CallState {
  isActive: boolean
  isConnected: boolean
  duration: number
}

export default function AICallPage() {
  const router = useRouter()
  
  // Call state
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    isConnected: false,
    duration: 0
  })
  
  // Audio controls
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  
  // Captions
  const [captions, setCaptions] = useState<Caption[]>([])
  const [currentUserCaption, setCurrentUserCaption] = useState("")
  const [currentAssistantCaption, setCurrentAssistantCaption] = useState("")
  
  // References
  const captionsEndRef = useRef<HTMLDivElement>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const captionIdCounter = useRef<number>(0)
  
  // Emotional analysis from previous screen
  const [emotionalAnalysis, setEmotionalAnalysis] = useState<any>(null)

  useEffect(() => {
    // Load emotional analysis data when component mounts
    const savedAnalysis = localStorage.getItem('emotionalAnalysis')
    if (savedAnalysis) {
      try {
        const parsed = JSON.parse(savedAnalysis)
        setEmotionalAnalysis(parsed)
        console.log('Loaded emotional analysis:', parsed)
      } catch (error) {
        console.error('Error parsing emotional analysis:', error)
      }
    }
    
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
      // Don't remove localStorage here - let it persist for the call
    }
  }, [])

  useEffect(() => {
    if (captionsEndRef.current) {
      captionsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [captions, currentUserCaption, currentAssistantCaption])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const generateUniqueId = () => {
    captionIdCounter.current += 1
    return `${Date.now()}-${captionIdCounter.current}`
  }

  const startCall = async () => {
    try {
      setCallState(prev => ({ ...prev, isActive: true }))
      
      // Simulate connection delay
      setTimeout(() => {
        setCallState(prev => ({ ...prev, isConnected: true }))
        
        // Start call timer
        callTimerRef.current = setInterval(() => {
          setCallState(prev => ({ ...prev, duration: prev.duration + 1 }))
        }, 1000)
        
        // Add initial assistant greeting
        const greeting = generateInitialGreeting()
        addAssistantCaption(greeting, true)
        speakText(greeting)
      }, 2000)
      
    } catch (error) {
      console.error("Error starting call:", error)
      setCallState({ isActive: false, isConnected: false, duration: 0 })
    }
  }

  const endCall = () => {
    // Stop all audio streams
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    
    // Clean up localStorage when call ends
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
    }
    
    // Reset state
    setCallState({ isActive: false, isConnected: false, duration: 0 })
    setIsRecording(false)
    setAudioStream(null)
    setMediaRecorder(null)
    setCaptions([])
    setCurrentUserCaption("")
    setCurrentAssistantCaption("")
    captionIdCounter.current = 0 // Reset counter
    
    // Clear emotional analysis after call ends
    localStorage.removeItem('emotionalAnalysis')
  }

  const generateInitialGreeting = () => {
    if (emotionalAnalysis) {
      const emotion = emotionalAnalysis.adjusted_emotion?.toLowerCase() || 'neutral'
      const confidence = emotionalAnalysis.confidence || 0
      const transcript = emotionalAnalysis.transcript || ''
      
      const templates: {[key: string]: string} = {
        "sadness": `Hi there. I heard what you shared earlier: "${transcript}". I can sense you're feeling quite sad right now, and I want you to know that's completely valid. I'm here to listen and support you through this difficult time.`,
        "anxiety": `Hello. From what you told me - "${transcript}" - I can feel the anxiety in your voice. It's completely normal to feel this way, and I'm here to help you work through these feelings at your own pace.`,
        "stress": `Hi. I noticed when you said "${transcript}" that you're dealing with significant stress right now. I can hear it in your voice, and I want to help you find some relief and coping strategies.`,
        "anger": `Hello there. I can tell from what you shared - "${transcript}" - that you're feeling really frustrated or angry about something. Those feelings are valid, and I'm here to listen without any judgment.`,
        "fear": `Hi. When you said "${transcript}", I could sense some fear or worry in your voice. It's natural to feel scared sometimes, and I'm here to help you feel more grounded and secure.`,
        "joy": `Hi there! I could hear the positive energy when you said "${transcript}". It's wonderful that you're feeling good, and I'd love to explore what's contributing to these positive feelings.`,
        "surprise": `Hello! From what you shared - "${transcript}" - it sounds like something unexpected has happened. I'm here to help you process whatever you're experiencing right now.`,
        "neutral": `Hello! Thank you for sharing "${transcript}" with me earlier. I'm here to listen and support you however I can. How are you feeling right now?`
      }
      
      const greeting = templates[emotion] || templates.neutral
      
      // Add confidence and audio features context if available
      let contextualGreeting = greeting
      if (emotionalAnalysis.audio_features) {
        const features = emotionalAnalysis.audio_features
        if (features.pause_ratio > 0.3) {
          contextualGreeting += " I also noticed some hesitation in your voice, which is completely understandable."
        }
        if (features.energy < 0.3) {
          contextualGreeting += " Your energy seems a bit low, and that's okay - we can work with wherever you're at right now."
        }
        if (features.tempo > 1.2) {
          contextualGreeting += " I could hear that you were speaking quite quickly, which might indicate some stress or anxiety."
        }
      }
      
      return contextualGreeting
    }
    
    return "Hello! I'm your AI mental health assistant. I'm here to listen and support you. How are you feeling today?"
  }

  const startListening = async () => {
    if (!callState.isConnected || isRecording) return
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setAudioStream(stream)
      
      const recorder = new MediaRecorder(stream)
      setMediaRecorder(recorder)
      
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => chunks.push(e.data)
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" })
        await processUserSpeech(audioBlob)
        
        // Clean up stream after processing
        stream.getTracks().forEach(track => track.stop())
        setAudioStream(null)
        setMediaRecorder(null)
      }
      
      recorder.start()
      setIsRecording(true)
      
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopListening = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const processUserSpeech = async (audioBlob: Blob) => {
    try {
      // Show temporary caption while processing
      setCurrentUserCaption("Processing...")
      
      const formData = new FormData()
      formData.append("audio", audioBlob)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analyze`, {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Clear temporary caption and add final user caption
      setCurrentUserCaption("")
      if (result.transcript && result.transcript.trim()) {
        addUserCaption(result.transcript)
        
        // Generate contextual response based on current conversation
        const aiResponse = await generateContextualResponse(result.transcript, result)
        if (aiResponse) {
          addAssistantCaption(aiResponse, true)
          await speakText(aiResponse)
        }
      } else {
        // If no speech detected, show a message
        setCurrentUserCaption("No speech detected. Please try again.")
        setTimeout(() => setCurrentUserCaption(""), 2000)
      }
      
    } catch (error) {
      console.error("Failed to process speech:", error)
      setCurrentUserCaption("Error processing speech. Please try again.")
      setTimeout(() => setCurrentUserCaption(""), 2000)
    }
  }

  const generateContextualResponse = async (userInput: string, analysisResult: any) => {
    try {
      // Build conversation context from recent captions
      const recentConversation = captions.slice(-6).map(caption => 
        `${caption.speaker === 'user' ? 'User' : 'Assistant'}: ${caption.text}`
      ).join('\n')
      
      // Create a contextual prompt that focuses on the current conversation
      const contextualPrompt = `
You are a compassionate AI mental health assistant in an ongoing voice conversation. 

RECENT CONVERSATION CONTEXT:
${recentConversation}

USER JUST SAID: "${userInput}"

CURRENT EMOTIONAL ANALYSIS:
- Detected emotion: ${analysisResult.adjusted_emotion}
- Confidence: ${analysisResult.confidence}
- Voice indicators: Energy ${analysisResult.audio_features?.energy}, Tempo ${analysisResult.audio_features?.tempo}

${emotionalAnalysis ? `
INITIAL SESSION CONTEXT (for background only):
- Original concern: "${emotionalAnalysis.transcript}"
- Initial emotion: ${emotionalAnalysis.adjusted_emotion}
` : ''}

Instructions:
1. Respond DIRECTLY to what the user just said: "${userInput}"
2. Be conversational and natural - this is a flowing dialogue
3. Ask follow-up questions about their current statement
4. Don't give generic advice unless specifically asked
5. Show that you heard and understood their specific words
6. Keep responses 1-2 sentences unless they ask for more detail
7. Match their conversational style and energy level

Respond naturally as if you're having a real conversation, focusing on their current words rather than giving preset advice.
`

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userInput,
          context: contextualPrompt,
          conversation_history: recentConversation
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        return result.reply
      } else {
        // Fallback to a simple acknowledgment if the chat endpoint fails
        return generateSimpleResponse(userInput, analysisResult)
      }
      
    } catch (error) {
      console.error("Error generating contextual response:", error)
      return generateSimpleResponse(userInput, analysisResult)
    }
  }

  const generateSimpleResponse = (userInput: string, analysisResult: any) => {
    // Simple response patterns that acknowledge what they said
    const responses = [
      `I hear that you ${userInput.toLowerCase()}. Can you tell me more about that?`,
      `That sounds ${analysisResult.adjusted_emotion === 'sadness' ? 'difficult' : 'important'}. What's that like for you?`,
      `Thanks for sharing that with me. How are you feeling about ${userInput.split(' ').slice(-3).join(' ')}?`,
      `I understand you're saying ${userInput.toLowerCase()}. What's going through your mind about this?`,
      `That's really ${analysisResult.adjusted_emotion === 'joy' ? 'wonderful' : 'significant'} that you ${userInput.toLowerCase()}. How long has this been on your mind?`
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const addUserCaption = (text: string) => {
    const caption: Caption = {
      id: generateUniqueId(),
      text: text.trim(),
      speaker: "user",
      timestamp: new Date(),
      isComplete: true
    }
    setCaptions(prev => [...prev, caption])
  }

  const addAssistantCaption = (text: string, isComplete: boolean = false) => {
    if (isComplete) {
      const caption: Caption = {
        id: generateUniqueId(),
        text: text.trim(),
        speaker: "assistant",
        timestamp: new Date(),
        isComplete: true
      }
      setCaptions(prev => [...prev, caption])
      setCurrentAssistantCaption("")
    } else {
      setCurrentAssistantCaption(text)
    }
  }

  const speakText = async (text: string) => {
    if (!isSpeakerOn) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      
      const audioBlob = await response.blob()
      const audio = new Audio(URL.createObjectURL(audioBlob))
      await audio.play()
    } catch (error) {
      console.error("Text-to-speech error:", error)
    }
  }

  const handlePushToTalk = () => {
    if (isRecording) {
      stopListening()
    } else {
      startListening()
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
  }

  const handleBack = () => {
    if (callState.isActive) {
      endCall()
    }
  }

  const navigateToChatbot = () => {
    // Save current emotional analysis to localStorage for chatbot to use
    if (emotionalAnalysis) {
      localStorage.setItem('emotionalAnalysis', JSON.stringify(emotionalAnalysis))
    }
    router.push('/Chatbot')
  }

  const CaptionBubble = ({ caption }: { caption: Caption }) => (
    <div className={`flex ${caption.speaker === "user" ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
        caption.speaker === "user"
          ? "bg-blue-500 text-white"
          : "bg-white/60 backdrop-blur-sm text-slate-700 border border-white/30"
      }`}>
        <p className="text-sm leading-relaxed">{caption.text}</p>
        <p className="text-xs opacity-60 mt-1">
          {caption.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )

  if (!callState.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-200 flex flex-col">
        <div className="flex items-center justify-between p-6 pt-12">
          <button 
            onClick={handleBack}
            className="flex items-center text-slate-600 hover:text-slate-800 transition-colors duration-200"
          >
            <ChevronLeft className="w-6 h-6 mr-2" />
            <span className="text-lg font-medium">Back</span>
          </button>
          
          <button 
            onClick={navigateToChatbot}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/40"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Chat</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 py-12">
          <div className="max-w-lg w-full mx-auto text-center space-y-12">
            <div className="bg-white/30 backdrop-blur-sm rounded-xl p-8 border border-white/40 shadow-lg">
              <h1 className="text-2xl font-bold text-slate-800 mb-4">AI Mental Health Call</h1>
              <p className="text-slate-700 text-center leading-relaxed text-base mb-4">
                Start a voice conversation with your AI mental health assistant. 
                The call will include live captions of your conversation for better accessibility.
              </p>
              
              {emotionalAnalysis && (
                <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-200/50">
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Previous Analysis:</strong>
                  </p>
                  <p className="text-sm text-slate-700 italic mb-2">
                    "{emotionalAnalysis.transcript}"
                  </p>
                  <p className="text-sm text-slate-600">
                    Detected emotion: <span className="font-medium text-slate-800">{emotionalAnalysis.adjusted_emotion}</span> 
                    ({Math.round(emotionalAnalysis.confidence * 100)}% confidence)
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button 
                onClick={startCall}
                className="w-full py-4 px-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02] flex items-center justify-center space-x-2"
              >
                <Phone className="w-5 h-5" />
                <span>Start Call</span>
              </button>
              
              <p className="text-sm text-slate-600 text-center">
                {emotionalAnalysis 
                  ? "Your AI assistant will address the emotions detected in your previous session"
                  : "Make sure your microphone is enabled for the best experience"
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-200 flex flex-col">
      {/* Header */}
      <div className="bg-white/20 backdrop-blur-sm border-b border-white/30 p-6 pt-12">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="flex items-center text-slate-600 hover:text-slate-800 transition-colors duration-200"
          >
            <ChevronLeft className="w-6 h-6 mr-2" />
            <span className="text-lg font-medium">End Call</span>
          </button>
          
          <div className="text-center">
            <p className="text-lg font-medium text-slate-800">AI Assistant</p>
            <p className="text-sm text-slate-600">
              {callState.isConnected ? (
                <>Connected • {formatDuration(callState.duration)}</>
              ) : (
                "Connecting..."
              )}
            </p>
          </div>
          
          <button 
            onClick={navigateToChatbot}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 bg-white/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/40"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Call Interface */}
      <div className="flex-1 flex flex-col">
        {/* Avatar/Status Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-32 h-32 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 border border-white/40">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
              callState.isConnected ? "bg-green-500" : "bg-yellow-500"
            }`}>
              <span className="text-white font-bold text-2xl">AI</span>
            </div>
          </div>
          
          {isRecording && (
            <div className="mb-4">
              <AudioVisualizer isRecording={isRecording} audioStream={audioStream} />
            </div>
          )}
          
          {!callState.isConnected && (
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-slate-600">Connecting to AI Assistant...</p>
            </div>
          )}
        </div>

        {/* Live Captions */}
        <div className="bg-black/80 backdrop-blur-sm text-white p-4 max-h-64 overflow-y-auto">
          <h3 className="text-sm font-medium mb-3 text-center text-gray-300">Live Captions</h3>
          
          <div className="space-y-2">
            {captions.slice(-5).map((caption) => (
              <CaptionBubble key={caption.id} caption={caption} />
            ))}
            
            {currentUserCaption && (
              <div className="flex justify-end mb-3">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-blue-500 text-white">
                  <p className="text-sm leading-relaxed">{currentUserCaption}</p>
                </div>
              </div>
            )}
            
            {currentAssistantCaption && (
              <div className="flex justify-start mb-3">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-sm text-slate-700 border border-white/30">
                  <p className="text-sm leading-relaxed">{currentAssistantCaption}</p>
                </div>
              </div>
            )}
          </div>
          
          <div ref={captionsEndRef} />
        </div>

        {/* Call Controls */}
        <div className="bg-white/20 backdrop-blur-sm border-t border-white/30 p-6">
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={toggleSpeaker}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200 ${
                !isSpeakerOn ? "bg-gray-500 hover:bg-gray-600" : "bg-white/40 hover:bg-white/60"
              }`}
            >
              {isSpeakerOn ? (
                <Volume2 className="w-6 h-6 text-slate-700" />
              ) : (
                <VolumeX className="w-6 h-6 text-white" />
              )}
            </button>
            
            <button
              onClick={handlePushToTalk}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200 ${
                isRecording 
                  ? "bg-red-500 hover:bg-red-600 scale-110" 
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isRecording ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
            
            <button
              onClick={endCall}
              className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-slate-600">
              {isRecording 
                ? "Recording... Tap the blue button again to send" 
                : "Tap the blue button to speak"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}