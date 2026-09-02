import { useWorkout } from '../context/WorkoutContext'

const SET_TYPE_BADGE = {
  normal: null, // shows the numeric set index instead
  warmup: 'W',
  drop: 'D',
  failure: 'F',
}

function previousLabel(previous) {
  if (!previous || previous.weightKg == null || previous.reps == null) return 'Previous: —'
  return `Previous: ${previous.weightKg} kg × ${previous.reps} reps`
}

export default function ExerciseCard({ exercise }) {
  const { removeExercise, addSet, removeSet, cycleSetType, updateSetField, toggleSetCompleted } = useWorkout()

  return (
    <section className="exercise-card">
      <header className="exercise-card-header">
        <div>
          <h3>{exercise.name}</h3>
          <p className="exercise-card-subtitle">{previousLabel(exercise.previous)}</p>
        </div>
        <button
          type="button"
          className="ghost-button"
          onClick={() => removeExercise(exercise.id)}
          aria-label={`Remove ${exercise.name}`}
        >
          ✕
        </button>
      </header>

      <table className="sets-table">
        <thead>
          <tr>
            <th>SET</th>
            <th>PREVIOUS</th>
            <th>KG</th>
            <th>REPS</th>
            <th aria-label="Completed">✓</th>
            <th aria-label="Remove set" />
          </tr>
        </thead>
        <tbody>
          {exercise.sets.map((set, index) => {
            const badge = SET_TYPE_BADGE[set.setType] ?? String(index + 1)
            return (
              <tr key={set.id} className={set.isCompleted ? 'set-row-completed' : undefined}>
                <td>
                  <button
                    type="button"
                    className={`set-type-badge set-type-${set.setType}`}
                    onClick={() => cycleSetType(exercise.id, set.id)}
                    title="Click to change set type"
                  >
                    {badge}
                  </button>
                </td>
                <td className="previous-cell">
                  {set.previous && set.previous.weightKg != null
                    ? `${set.previous.weightKg}kg × ${set.previous.reps}`
                    : '—'}
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={set.weightKg}
                    onChange={(event) => updateSetField(exercise.id, set.id, 'weightKg', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={set.reps}
                    onChange={(event) => updateSetField(exercise.id, set.id, 'reps', event.target.value)}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className={`check-button ${set.isCompleted ? 'check-button-active' : ''}`}
                    onClick={() => toggleSetCompleted(exercise.id, set.id)}
                    aria-label="Mark set completed"
                  >
                    ✓
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => removeSet(exercise.id, set.id)}
                    aria-label="Remove set"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <button type="button" className="add-set-button" onClick={() => addSet(exercise.id)}>
        + Add Set
      </button>
    </section>
  )
}
