import { useEffect, useState } from 'react'
import { fetchExercises } from '../lib/workoutApi'

const MUSCLE_OPTIONS = [
  'Chest',
  'Back',
  'Shoulders',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Biceps',
  'Triceps',
  'Core',
  'Cardio',
]

export default function ExercisePickerModal({ onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('')
  const [exerciseList, setExerciseList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchExercises({ search, muscle })
      .then((rows) => {
        if (!cancelled) setExerciseList(rows)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [search, muscle])

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add exercise">
      <div className="modal exercise-picker">
        <div className="modal-header">
          <h2>Add Exercise</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <input
          type="search"
          placeholder="Search exercises"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={muscle} onChange={(event) => setMuscle(event.target.value)}>
          <option value="">All muscles</option>
          {MUSCLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {error && <p className="form-error">{error}</p>}
        {loading && <p>Loading exercises...</p>}

        <ul className="exercise-picker-list">
          {!loading &&
            exerciseList.map((exercise) => (
              <li key={exercise.id}>
                <button type="button" onClick={() => onSelect(exercise)}>
                  <span className="exercise-picker-name">{exercise.name}</span>
                  <span className="exercise-picker-muscle">{exercise.primary_muscle}</span>
                </button>
              </li>
            ))}
          {!loading && exerciseList.length === 0 && <p>No exercises found.</p>}
        </ul>
      </div>
    </div>
  )
}
