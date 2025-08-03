// 1. Create a new file: app/history-grid/page.tsx

"use client"

import { useEffect, useState } from "react"
import EmotionCard from "@/components/EmotionCard"

interface EmotionEntry {
  _id: string
  transcript: string
  text_emotion: string
  adjusted_emotion: string
  gemini_reply: string
  timestamp: string
}

export default function HistoryGrid() {
  const [entries, setEntries] = useState<EmotionEntry[]>([])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/history?user_id=default_user`)
      .then((res) => res.json())
      .then((data) => setEntries(data.reverse()))
      .catch((err) => console.error("Failed to fetch history:", err))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-200 px-6 py-12">
      <h1 className="text-3xl font-bold text-center mb-10 text-slate-700">
        Your Emotional Insights
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {entries.map((entry) => (
          <EmotionCard key={entry._id} entry={entry} />
        ))}
      </div>
    </div>
  )
}