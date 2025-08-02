"use client"

import { ChevronLeft, Send, Bot, User } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

export default function LoremIpsumPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isBotTyping, setIsBotTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isBotTyping])

  // Focus input when chat opens
  useEffect(() => {
    if (showChat) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 500)
    }
  }, [showChat])

  const handleBack = () => {
    if (showChat) {
      setShowChat(false)
      setMessages([])
      setInputText("")
    } else {
      console.log("Back button clicked")
    }
  }

  const handleContinue = async () => {
    setIsLoading(true)
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false)
      setShowChat(true)
      
      // Add welcome message from bot
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: "Hello! I'm here to help you. How are you feeling today? Feel free to share what's on your mind.",
        sender: "bot",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }, 1000)
  }

  const generateBotResponse = (userMessage: string): string => {
    const responses = [
      "That's really interesting. Can you tell me more about that?",
      "I understand how you're feeling. It's completely normal to feel this way.",
      "Thank you for sharing that with me. How does that make you feel?",
      "That sounds like it was quite an experience. What did you learn from it?",
      "I appreciate you opening up about this. What would you like to explore further?",
      "It sounds like you've been through a lot. What support do you feel you need right now?",
      "That's a thoughtful perspective. Have you considered looking at it from a different angle?",
      "Your feelings are valid. What do you think might help you feel better about this situation?"
    ]
    
    // Simple keyword-based responses
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes("sad") || lowerMessage.includes("down")) {
      return "I'm sorry you're feeling sad. It's okay to have difficult emotions. What's been weighing on your mind?"
    }
    if (lowerMessage.includes("happy") || lowerMessage.includes("good") || lowerMessage.includes("great")) {
      return "That's wonderful to hear! I'm glad you're feeling positive. What's been going well for you?"
    }
    if (lowerMessage.includes("stress") || lowerMessage.includes("anxious") || lowerMessage.includes("worried")) {
      return "Stress and anxiety can be really challenging. What's been causing you to feel this way? Sometimes talking about it can help."
    }
    if (lowerMessage.includes("tired") || lowerMessage.includes("exhausted")) {
      return "It sounds like you've been feeling drained. Rest is so important. What's been keeping you busy or preventing you from getting the rest you need?"
    }
    
    return responses[Math.floor(Math.random() * responses.length)]
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

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(userMessage.text),
        sender: "bot",
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, botResponse])
      setIsBotTyping(false)
    }, 1000 + Math.random() * 2000) // 1-3 seconds delay
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (showChat) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-200 flex flex-col">
        {/* Header */}
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

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
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
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Bot typing indicator */}
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

        {/* Input Area */}
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
      {/* Header with Back Button */}
      <div className="flex items-center p-6 pt-12">
        <button 
          onClick={handleBack}
          className="flex items-center text-slate-600 hover:text-slate-800 transition-colors duration-200"
        >
          <ChevronLeft className="w-6 h-6 mr-2" />
          <span className="text-lg font-medium">Back</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-lg w-full mx-auto text-center space-y-12">
          
          {/* Content Card */}
          <div className="bg-white/30 backdrop-blur-sm rounded-xl p-8 border border-white/40 shadow-lg">
            <p className="text-slate-700 text-center leading-relaxed text-base font-medium">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do 
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut 
              enim ad minim veniam, quis nostrud exercitation ullamco laboris 
              nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>

          {/* Continue Button */}
          <button 
            onClick={handleContinue}
            disabled={isLoading}
            className={`w-full py-4 px-6 rounded-xl font-medium text-white transition-all duration-200 ${
              isLoading 
                ? "bg-slate-400 cursor-not-allowed" 
                : "bg-blue-400 hover:bg-blue-500 hover:shadow-lg hover:scale-[1.02]"
            }`}
          >
            {isLoading ? "Loading..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  )
}