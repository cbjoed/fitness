import { useEffect, useRef } from 'react'
import { useWorkout, formatElapsed } from '../context/WorkoutContext'

function playChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.6)
    oscillator.onended = () => ctx.close()
  } catch {
    // Web Audio unavailable; fail silently rather than break the workout flow.
  }
}

export default function RestTimerModal() {
  const { restTimer, adjustRestTimer, skipRestTimer } = useWorkout()
  const hasChimedRef = useRef(false)

  useEffect(() => {
    if (!restTimer.visible) {
      hasChimedRef.current = false
      return
    }
    if (restTimer.remaining === 0 && !hasChimedRef.current) {
      hasChimedRef.current = true
      playChime()
    }
    if (restTimer.remaining > 0) {
      hasChimedRef.current = false
    }
  }, [restTimer.visible, restTimer.remaining])

  if (!restTimer.visible) return null

  return (
    <div className="rest-timer-modal" role="status" aria-live="polite">
      <span className="rest-timer-label">Rest</span>
      <span className="rest-timer-clock">{formatElapsed(restTimer.remaining)}</span>
      <div className="rest-timer-controls">
        <button type="button" onClick={() => adjustRestTimer(-30)}>
          -30s
        </button>
        <button type="button" onClick={() => adjustRestTimer(30)}>
          +30s
        </button>
        <button type="button" className="ghost-button" onClick={skipRestTimer}>
          Skip
        </button>
      </div>
    </div>
  )
}
