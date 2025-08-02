"use client"

import { ChevronLeft } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Result() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleContinue = async () => {
    setIsLoading(true)
    // Handle continue action
    console.log("Continue button clicked")
    
    setTimeout(() => {
      setIsLoading(false)
      router.push("/chatbot")
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-200 flex flex-col">
      {/* Header with Back Button */}
      <div className="flex items-center p-6 pt-12">
        <Link
          href="/Recorder"
          className="flex items-center text-slate-600 hover:text-slate-800 transition-colors duration-200"
        >
          <ChevronLeft className="w-6 h-6 mr-2" />
          <span className="text-lg font-medium">Back</span>
        </Link>
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