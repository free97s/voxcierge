'use client'

import { useEffect, useRef } from 'react'

interface AudioWaveformProps {
  mediaStream: MediaStream | null
  isRecording: boolean
}

export function AudioWaveform({ mediaStream, isRecording }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!mediaStream || !isRecording) {
      // Draw idle flat line
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      drawIdleLine(ctx, canvas)
      return
    }

    // Set up Web Audio API
    const audioContext = new AudioContext()
    audioContextRef.current = audioContext

    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8
    analyserRef.current = analyser

    const source = audioContext.createMediaStreamSource(mediaStream)
    source.connect(analyser)
    sourceRef.current = source

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!canvas || !ctx || !analyserRef.current) return

      animationFrameRef.current = requestAnimationFrame(draw)

      const width = canvas.width
      const height = canvas.height

      analyserRef.current.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, width, height)

      const barWidth = (width / bufferLength) * 2.5
      const barGap = 2
      const usableWidth = width - (bufferLength / 2) * barGap
      const effectiveBarWidth = Math.max(1, (usableWidth / bufferLength) * 2)

      let x = 0
      const midY = height / 2

      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i] / 255
        const barHeight = Math.max(2, value * (height * 0.85))

        const alpha = 0.5 + value * 0.5
        ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`

        ctx.beginPath()
        ctx.roundRect(
          x,
          midY - barHeight / 2,
          effectiveBarWidth,
          barHeight,
          2
        )
        ctx.fill()

        x += effectiveBarWidth + barGap
        if (x > width) break
      }
    }

    draw()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      sourceRef.current?.disconnect()
      audioContextRef.current?.close().catch(() => {})
      analyserRef.current = null
      audioContextRef.current = null
      sourceRef.current = null
    }
  }, [mediaStream, isRecording])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        canvas.width = entry.contentRect.width * window.devicePixelRatio
        canvas.height = entry.contentRect.height * window.devicePixelRatio
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
      }
    })

    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="w-full h-16 rounded-lg bg-muted/30 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  )
}

function drawIdleLine(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const width = canvas.offsetWidth || canvas.width
  const height = canvas.offsetHeight || canvas.height
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const midY = height / 2
  const barWidth = 3
  const barGap = 4
  const idleHeight = 4
  let x = 0

  ctx.fillStyle = 'rgba(99, 102, 241, 0.25)'
  while (x < width) {
    ctx.beginPath()
    ctx.roundRect(x, midY - idleHeight / 2, barWidth, idleHeight, 1)
    ctx.fill()
    x += barWidth + barGap
  }
}
