"use client"

import { Html } from "@react-three/drei"

interface EmotionEntry {
  _id: string
  transcript: string
  text_emotion: string
  adjusted_emotion: string
  gemini_reply: string
  timestamp: string
}

export default function EmotionCard({ entry }: { entry: EmotionEntry }) {
  return (
    <div className="bg-white border border-gray-300 shadow-md rounded-xl p-4 space-y-2 hover:scale-[1.01] transition-transform duration-200">
      <p className="text-sm text-gray-500 text-right">
        {new Date(entry.timestamp).toLocaleString()}
      </p>
      <h2 className="text-md font-semibold capitalize text-blue-700">
        {entry.adjusted_emotion}
      </h2>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">
        <strong>You:</strong> {entry.transcript || "N/A"}
      </p>
      <p className="text-sm text-gray-900 whitespace-pre-wrap">
        <strong>Gemini:</strong> {entry.gemini_reply || "No reply"}
      </p>
    </div>
  )
}
