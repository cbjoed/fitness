import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkout, formatElapsed } from '../context/WorkoutContext'
import { fetchPreviousPerformance } from '../lib/workoutApi'
import ExerciseCard from './ExerciseCard'
import ExercisePickerModal from './ExercisePickerModal'
import RestTimerModal from './RestTimerModal'

export default function ActiveWorkout() {
  const navigate = useNavigate()
  const { session, exercises, elapsedSeconds, addExercise, setPreviousPerformance, finishWorkout, cancelWorkout } =
    useWorkout()
  const [showPicker, setShowPicker] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) {
      navigate('/routines', { replace: true })
    }
  }, [session, navigate])

  useEffect(() => {
    exercises.forEach((entry) => {
      if (entry.previous !== null) return
      fetchPreviousPerformance(entry.exerciseId)
        .then((previous) => setPreviousPerformance(entry.id, previous))
        .catch(() => setPreviousPerformance(entry.id, null))
    })
  }, [exercises, setPreviousPerformance])

  if (!session) return null

  async function handleFinish() {
    setBusy(true)
    setError('')
    try {
      await finishWorkout()
      navigate('/routines')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel this workout? All logged sets will be discarded.')) return
    setBusy(true)
    setError('')
    try {
      await cancelWorkout()
      navigate('/routines')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="active-workout">
      <header className="active-workout-header">
        <div>
          <strong>{session.title}</strong>
          <span className="active-workout-timer">{formatElapsed(elapsedSeconds)}</span>
        </div>
        <div className="active-workout-actions">
          <button type="button" className="ghost-button" onClick={handleCancel} disabled={busy}>
            Cancel Workout
          </button>
          <button type="button" onClick={handleFinish} disabled={busy}>
            Finish
          </button>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="exercise-list">
        {exercises.map((entry) => (
          <ExerciseCard key={entry.id} exercise={entry} />
        ))}
        {exercises.length === 0 && <p>Add an exercise to get started.</p>}
      </div>

      <button type="button" className="add-exercise-button" onClick={() => setShowPicker(true)}>
        + Add Exercise
      </button>

      {showPicker && (
        <ExercisePickerModal
          onClose={() => setShowPicker(false)}
          onSelect={(exercise) => {
            addExercise(exercise)
            setShowPicker(false)
          }}
        />
      )}

      <RestTimerModal />
    </div>
  )
}
