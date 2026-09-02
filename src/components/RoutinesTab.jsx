import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkout } from '../context/WorkoutContext'
import { createRoutine, fetchExercises, fetchRoutines } from '../lib/workoutApi'
import ExercisePickerModal from './ExercisePickerModal'

const PRESET_ROUTINES = [
  {
    title: 'Row & Legs',
    description: 'Rowing warm-up followed by a lower-body session.',
    exerciseNames: ['Rowing Machine', 'Barbell Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'],
  },
  {
    title: 'Row & Push',
    description: 'Rowing warm-up followed by chest, shoulders, and triceps.',
    exerciseNames: [
      'Rowing Machine',
      'Bench Press',
      'Incline Dumbbell Press',
      'Overhead Press',
      'Lateral Raise',
      'Tricep Pushdown',
    ],
  },
  {
    title: 'Row & Pull',
    description: 'Rowing warm-up followed by back and biceps.',
    exerciseNames: ['Rowing Machine', 'Lat Pulldown', 'Seated Cable Row', 'Dumbbell Row', 'Face Pull', 'Bicep Curl'],
  },
]

function NewRoutineForm({ onCreated, onCancel }) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [selected, setSelected] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function moveExercise(index, direction) {
    setSelected((current) => {
      const next = [...current]
      const target = index + direction
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function removeExercise(index) {
    setSelected((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createRoutine({ title: title.trim(), notes, exerciseIds: selected.map((ex) => ex.id) })
      onCreated()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form className="new-routine-form card" onSubmit={handleSubmit}>
      <h2>New Routine</h2>
      {error && <p className="form-error">{error}</p>}
      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Push Day" required />
      </label>
      <label>
        Notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
      </label>

      <div className="routine-exercise-list">
        {selected.map((exercise, index) => (
          <div key={exercise.id} className="routine-exercise-row">
            <span>{exercise.name}</span>
            <div className="routine-exercise-controls">
              <button type="button" onClick={() => moveExercise(index, -1)} aria-label="Move up">
                ↑
              </button>
              <button type="button" onClick={() => moveExercise(index, 1)} aria-label="Move down">
                ↓
              </button>
              <button type="button" className="ghost-button" onClick={() => removeExercise(index)} aria-label="Remove">
                ✕
              </button>
            </div>
          </div>
        ))}
        {selected.length === 0 && <p>No exercises added yet.</p>}
      </div>

      <button type="button" className="ghost-button" onClick={() => setShowPicker(true)}>
        + Add Exercise
      </button>

      <div className="new-routine-actions">
        <button type="button" className="ghost-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={saving}>
          Save Routine
        </button>
      </div>

      {showPicker && (
        <ExercisePickerModal
          onClose={() => setShowPicker(false)}
          onSelect={(exercise) => {
            setSelected((current) => [...current, exercise])
            setShowPicker(false)
          }}
        />
      )}
    </form>
  )
}

export default function RoutinesTab() {
  const navigate = useNavigate()
  const { startEmptyWorkout, loadRoutineIntoWorkout } = useWorkout()
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewRoutine, setShowNewRoutine] = useState(false)
  const [busy, setBusy] = useState(false)

  function loadRoutines() {
    setLoading(true)
    fetchRoutines()
      .then(setRoutines)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(loadRoutines, [])

  async function handleStartEmpty() {
    setBusy(true)
    setError('')
    try {
      await startEmptyWorkout()
      navigate('/workout/active')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function handleStartRoutine(routine) {
    setBusy(true)
    setError('')
    try {
      await loadRoutineIntoWorkout(routine)
      navigate('/workout/active')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function handleStartPreset(preset) {
    setBusy(true)
    setError('')
    try {
      const exercises = await fetchExercises()
      const exercisesByName = new Map(exercises.map((exercise) => [exercise.name, exercise]))
      const missingExercise = preset.exerciseNames.find((name) => !exercisesByName.has(name))
      if (missingExercise) {
        throw new Error(`Add the updated exercise library in Supabase before starting this routine. Missing: ${missingExercise}`)
      }

      await loadRoutineIntoWorkout({
        title: preset.title,
        routine_exercises: preset.exerciseNames.map((name, sort_order) => ({
          sort_order,
          exercise: exercisesByName.get(name),
        })),
      })
      navigate('/workout/active')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const groups = routines.reduce((acc, routine) => {
    const key = routine.title || 'Untitled'
    acc[key] = acc[key] ?? []
    acc[key].push(routine)
    return acc
  }, {})

  return (
    <div className="routines-tab">
      {error && <p className="form-error">{error}</p>}

      <button type="button" className="start-empty-button" onClick={handleStartEmpty} disabled={busy}>
        Start Empty Workout
      </button>

      <section className="preset-routines" aria-label="Starter routines">
        <h2>Starter Routines</h2>
        {PRESET_ROUTINES.map((preset) => (
          <article key={preset.title} className="preset-routine card">
            <div>
              <h3>{preset.title}</h3>
              <p>{preset.description}</p>
              <span>{preset.exerciseNames.join(' · ')}</span>
            </div>
            <button type="button" onClick={() => handleStartPreset(preset)} disabled={busy}>
              Start
            </button>
          </article>
        ))}
      </section>

      {!showNewRoutine && (
        <button type="button" className="ghost-button" onClick={() => setShowNewRoutine(true)}>
          + Routine
        </button>
      )}

      {showNewRoutine && (
        <NewRoutineForm
          onCreated={() => {
            setShowNewRoutine(false)
            loadRoutines()
          }}
          onCancel={() => setShowNewRoutine(false)}
        />
      )}

      {loading && <p>Loading routines...</p>}

      {!loading &&
        Object.entries(groups).map(([title, group]) => (
          <section key={title} className="routine-group card">
            <h2>{title}</h2>
            {group.map((routine) => (
              <div key={routine.id} className="routine-row">
                <span>{(routine.routine_exercises ?? []).length} exercises</span>
                <button type="button" onClick={() => handleStartRoutine(routine)} disabled={busy}>
                  Start
                </button>
              </div>
            ))}
          </section>
        ))}

      {!loading && routines.length === 0 && !showNewRoutine && <p>No saved routines yet.</p>}
    </div>
  )
}
