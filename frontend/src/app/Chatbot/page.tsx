"use client"

import { ChevronLeft, Send, Bot, User, Phone } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  emotion?: string
  confidence?: number
}

export default function ChatbotPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isBotTyping, setIsBotTyping] = useState(false)
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
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isBotTyping])

  const generateWelcomeMessage = (emotion: string) => {
    const templates: {[key: string]: string} = {
      "stress": "I notice you're feeling stressed. Let's work through this together step by step. What specific situation is causing you the most stress right now?",
      "anxiety": "I can see from your previous input that you're experiencing some anxiety. That's completely normal, and I'm here to help. What thoughts are running through your mind that might be contributing to these anxious feelings?",
      "sadness": "I understand you're feeling down right now. Your feelings are completely valid, and I'm here to listen without judgment. What's been weighing most heavily on your mind?",
      "anger": "I can tell from what you shared that you're frustrated about something. It's important to acknowledge these feelings rather than push them down. What situation or person is triggering this anger for you?",
      "fear": "I can see some fear or worry in what you shared earlier. Fear often comes from uncertainty about the future. What specific outcome are you most concerned about right now?",
      "joy": "It's wonderful to see some positivity in what you shared! Even when we're feeling good, it's valuable to explore what's contributing to these feelings. What's been going well for you recently?",
      "surprise": "It sounds like something unexpected has happened in your life. Change and surprises can be both exciting and overwhelming. How are you processing this new development?",
      "neutral": "Thank you for sharing with me. Sometimes our emotions can be complex or mixed. I'm here to help you explore whatever you're experiencing. What's been on your mind lately?"
    }
    
    return templates[emotion.toLowerCase()] || templates.neutral
  }

  const handleBack = () => {
    if (showChat) {
      setShowChat(false)
      setMessages([])
      setInputText("")
    } else {
      // Navigate back to the main app
      router.back()
    }
  }

  const handleContinue = () => {
    setIsLoading(true)
    // Remove setTimeout and directly set the states
    setIsLoading(false)
    setShowChat(true)
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: "Hello! I'm here to help you work through whatever you're experiencing. How are you feeling today? Feel free to share what's on your mind.",
      sender: "bot",
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }

  const navigateToCall = () => {
    // Save current emotional analysis to localStorage for call to use
    if (emotionalAnalysis) {
      localStorage.setItem('emotionalAnalysis', JSON.stringify(emotionalAnalysis))
    }
    router.push('/Call')
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
      // Build conversation context from recent messages
      const recentConversation = messages.slice(-6).map(message => 
        `${message.sender === 'user' ? 'User' : 'Assistant'}: ${message.text}`
      ).join('\n')

      // Create a contextual prompt for mental health support
      const contextualPrompt = `
You are a compassionate AI mental health assistant providing text-based support.

RECENT CONVERSATION CONTEXT:
${recentConversation}

USER JUST SAID: "${userMessage.text}"

${emotionalAnalysis ? `
INITIAL SESSION CONTEXT (for background only):
- Original concern: "${emotionalAnalysis.transcript}"
- Initial emotion: ${emotionalAnalysis.adjusted_emotion}
- Confidence: ${Math.round(emotionalAnalysis.confidence * 100)}%
` : ''}

Instructions:
1. Respond DIRECTLY and thoughtfully to what the user just said: "${userMessage.text}"
2. Be warm, empathetic, and genuinely helpful - not just supportive platitudes
3. Ask meaningful follow-up questions that help them explore their feelings
4. Provide practical, actionable suggestions when appropriate
5. Validate their emotions while helping them gain insight
6. Keep responses conversational but substantive (2-4 sentences)
7. Focus on their current words and build on the conversation naturally

Your goal is to provide genuine mental health support that helps them process their thoughts and feelings constructively.
`

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage.text,
          context: contextualPrompt,
          conversation_history: recentConversation
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: result.reply,
          sender: "bot",
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, botMessage])
      } else {
        // Fallback response if API fails
        const fallbackResponse = generateFallbackResponse(userMessage.text)
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: fallbackResponse,
          sender: "bot",
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
      }

    } catch (error) {
      console.error("Failed to get response:", error)
      // Provide a helpful fallback response
      const fallbackResponse = generateFallbackResponse(userMessage.text)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallbackResponse,
        sender: "bot",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
    }
    
    setIsBotTyping(false)
  }

  const generateFallbackResponse = (userInput: string) => {
    // Generate contextual fallback responses based on common keywords
    const input = userInput.toLowerCase()
    
    if (input.includes('sad') || input.includes('depressed') || input.includes('down')) {
      return "I can see that you're feeling really down right now. That takes courage to share. Can you tell me what specific thoughts or situations are contributing to these feelings? Sometimes talking through the details can help us understand what might help."
    }
    
    if (input.includes('anxious') || input.includes('worried') || input.includes('nervous')) {
      return "Anxiety can feel overwhelming, especially when our minds start racing with 'what if' scenarios. What specific situation or thought is triggering the most anxiety for you right now? Let's try to break it down together."
    }
    
    if (input.includes('angry') || input.includes('frustrated') || input.includes('mad')) {
      return "It sounds like something has really upset you, and those feelings are completely valid. Anger often signals that something important to us feels threatened or violated. What situation or behavior triggered these feelings?"
    }
    
    if (input.includes('stressed') || input.includes('overwhelmed') || input.includes('pressure')) {
      return "Feeling overwhelmed often happens when we have too much on our plate or feel like we're losing control. What's the biggest source of stress in your life right now? Sometimes identifying the main stressor can help us figure out the first step to take."
    }
    
    if (input.includes('confused') || input.includes('lost') || input.includes('don\'t know')) {
      return "Feeling uncertain or confused is actually very human - it shows you're thoughtfully considering your situation rather than rushing to conclusions. What specific aspect of your situation feels most unclear to you right now?"
    }
    
    // Default empathetic response
    return `Thank you for sharing that with me. I can tell this is important to you. Can you help me understand more about what you're experiencing? What aspect of this situation is affecting you most right now?`
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
          <button 
            onClick={navigateToCall}
            className="flex items-center text-green-600 hover:text-green-800 transition-colors duration-200 bg-white/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/40"
          >
            <Phone className="w-5 h-5" />
          </button>
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
              disabled={isBotTyping}
              className="flex-1 px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isBotTyping}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

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
          onClick={navigateToCall}
          className="flex items-center text-green-600 hover:text-green-800 transition-colors duration-200 bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/40"
        >
          <Phone className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Call</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-lg w-full mx-auto text-center space-y-12">
          <div className="bg-white/30 backdrop-blur-sm rounded-xl p-8 border border-white/40 shadow-lg">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">AI Mental Health Chat</h1>
            <p className="text-slate-700 text-center leading-relaxed text-base font-medium">
              Have a text conversation with your AI mental health assistant. Share your thoughts and feelings, 
              and receive personalized support and guidance in a safe, judgment-free environment.
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