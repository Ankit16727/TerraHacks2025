"use client"

import { useEffect, useRef, useState } from "react"

interface AudioVisualizerProps {
  isRecording: boolean
  audioStream: MediaStream | null
}

export default function AudioVisualizer({ isRecording, audioStream }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const analyserRef = useRef<AnalyserNode>()
  const audioContextRef = useRef<AudioContext>()
  const amplitudeDataRef = useRef<number[]>([])
  const [dimensions, setDimensions] = useState({ width: 400, height: 100 })

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const containerHeight = Math.min(containerWidth * 0.25, 120) // Maintain aspect ratio

        setDimensions({
          width: Math.max(300, Math.min(containerWidth - 48, 600)), // Min 300px, max 600px, with padding
          height: Math.max(80, containerHeight),
        })
      }
    }

    // Initial size calculation
    updateDimensions()

    // Add resize listener
    window.addEventListener("resize", updateDimensions)

    // Use ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener("resize", updateDimensions)
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (isRecording && audioStream) {
      startVisualization()
    } else {
      stopVisualization()
    }

    return () => {
      stopVisualization()
    }
  }, [isRecording, audioStream, dimensions])

  const startVisualization = () => {
    if (!audioStream || !canvasRef.current) return

    // Create audio context and analyser
    audioContextRef.current = new AudioContext()
    analyserRef.current = audioContextRef.current.createAnalyser()

    const source = audioContextRef.current.createMediaStreamSource(audioStream)
    source.connect(analyserRef.current)

    analyserRef.current.fftSize = 2048
    analyserRef.current.smoothingTimeConstant = 0.1

    const bufferLength = analyserRef.current.fftSize
    const dataArray = new Uint8Array(bufferLength)

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size based on current dimensions
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Calculate responsive bar dimensions with reduced spacing on smaller screens
    const baseBarWidth = Math.max(2, Math.floor(dimensions.width / 120)) // Responsive bar width
    const barSpacing = Math.max(0, Math.floor(baseBarWidth * 0.2)) // Much smaller spacing, can be 0 on small screens
    const maxBars = Math.floor(dimensions.width / (baseBarWidth + barSpacing))

    // For very small screens, eliminate spacing entirely
    const actualBarSpacing = dimensions.width < 400 ? 0 : barSpacing
    const actualMaxBars = Math.floor(dimensions.width / (baseBarWidth + actualBarSpacing))

    // Initialize or resize amplitude data array
    if (amplitudeDataRef.current.length !== actualMaxBars) {
      amplitudeDataRef.current = new Array(actualMaxBars).fill(0)
    }

    const draw = () => {
      if (!analyserRef.current || !ctx) return

      // Get time domain data (waveform)
      analyserRef.current.getByteTimeDomainData(dataArray)

      // Calculate RMS (Root Mean Square) for amplitude
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        const sample = (dataArray[i] - 128) / 128
        sum += sample * sample
      }
      const rms = Math.sqrt(sum / bufferLength)
      const amplitude = Math.min(rms * 15, 1)

      // Shift existing amplitude data to the left (scrolling effect)
      amplitudeDataRef.current.shift()
      // Add new amplitude data to the right
      amplitudeDataRef.current.push(amplitude)

      // Clear canvas completely
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Set solid background
      ctx.fillStyle = "#f8fafc"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerY = canvas.height / 2

      // Draw amplitude bars with responsive sizing
      for (let i = 0; i < amplitudeDataRef.current.length; i++) {
        const x = i * (baseBarWidth + actualBarSpacing)
        const amplitude = amplitudeDataRef.current[i]
        const maxBarHeight = canvas.height * 0.4 // Responsive to canvas height
        const barHeight = amplitude * maxBarHeight

        // Color based on amplitude level with smooth gradient
        const getGradientColor = (amplitude: number) => {
          const normalizedAmp = Math.max(0, Math.min(1, amplitude))

          if (normalizedAmp <= 0.2) {
            // Blue to Cyan (0.0 - 0.2)
            const t = normalizedAmp / 0.2
            const r = Math.floor(59 + (34 - 59) * t)
            const g = Math.floor(130 + (197 - 130) * t)
            const b = Math.floor(246 + (255 - 246) * t)
            return `rgb(${r}, ${g}, ${b})`
          } else if (normalizedAmp <= 0.4) {
            // Cyan to Green (0.2 - 0.4)
            const t = (normalizedAmp - 0.2) / 0.2
            const r = Math.floor(34 + (34 - 34) * t)
            const g = Math.floor(197 + (197 - 197) * t)
            const b = Math.floor(255 + (94 - 255) * t)
            return `rgb(${r}, ${g}, ${b})`
          } else if (normalizedAmp <= 0.6) {
            // Green to Yellow (0.4 - 0.6)
            const t = (normalizedAmp - 0.4) / 0.2
            const r = Math.floor(34 + (234 - 34) * t)
            const g = Math.floor(197 + (179 - 197) * t)
            const b = Math.floor(94 + (8 - 94) * t)
            return `rgb(${r}, ${g}, ${b})`
          } else if (normalizedAmp <= 0.8) {
            // Yellow to Orange (0.6 - 0.8)
            const t = (normalizedAmp - 0.6) / 0.2
            const r = Math.floor(234 + (249 - 234) * t)
            const g = Math.floor(179 + (115 - 179) * t)
            const b = Math.floor(8 + (22 - 8) * t)
            return `rgb(${r}, ${g}, ${b})`
          } else {
            // Orange to Red (0.8 - 1.0)
            const t = (normalizedAmp - 0.8) / 0.2
            const r = Math.floor(249 + (239 - 249) * t)
            const g = Math.floor(115 + (68 - 115) * t)
            const b = Math.floor(22 + (68 - 22) * t)
            return `rgb(${r}, ${g}, ${b})`
          }
        }

        const fillStyle = getGradientColor(amplitude)
        ctx.fillStyle = fillStyle

        // Draw bar above center line
        if (barHeight > 1) {
          ctx.fillRect(x, centerY - barHeight, baseBarWidth, barHeight)
          // Draw mirrored bar below center line
          ctx.fillRect(x, centerY, baseBarWidth, barHeight)
        }
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()
  }

  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    amplitudeDataRef.current = []
  }

  if (!isRecording) {
    return null
  }

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-4xl mx-auto px-4">
      <div
        ref={containerRef}
        className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg w-full"
      >
        <canvas
          ref={canvasRef}
          className="rounded-lg w-full h-auto"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            maxWidth: "100%",
          }}
        />
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <p className="text-sm text-slate-600 font-medium">Recording...</p>
      </div>
    </div>
  )
}
