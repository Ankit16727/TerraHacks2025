"use client"

import { ChevronLeft } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface AnalysisResult {
  transcript: string
  adjusted_emotion: string
  confidence: number
  audio_features: {
    pause_ratio: number
    energy: number
    tempo: number
  }
}

export default function Result() {
  const [isLoading, setIsLoading] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const dataParam = searchParams.get("data")
    if (dataParam) {
      try {
        const parsed = JSON.parse(dataParam)
        setAnalysisData(parsed)
      } catch (err) {
        console.error("Error parsing result data:", err)
      }
    }
  }, [searchParams])

  const handleContinue = async () => {
  setIsLoading(true)

  if (analysisData) {
    localStorage.setItem('emotionalAnalysis', JSON.stringify(analysisData))
    // Check if emotion is severe
    if (analysisData.adjusted_emotion === "deep sadness or burnout") {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/call-alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: analysisData.transcript || "The user expressed signs of severe emotional distress."
          })
        })

        const result = await response.json()
        if (result.status === "success") {
          console.log("Call placed successfully. SID:", result.sid)
        } else {
          console.error("Call failed:", result.message)
        }
      } catch (err) {
        console.error("Error calling contact:", err)
      }
    }

    // Proceed to chatbot
    router.push("/Chatbot")
    }else {
      setIsLoading(false)
    }
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
              {analysisData?.transcript ? analysisData.transcript : "Loading..."}
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