import { useWorkout } from '../context/WorkoutContext'
import { getExerciseGuide } from '../lib/exerciseGuide'

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
  const {
    removeExercise,
    moveExercise,
    updateExerciseField,
    addSet,
    removeSet,
    cycleSetType,
    updateSetField,
    toggleSetCompleted,
  } = useWorkout()
  const guide = getExerciseGuide({
    name: exercise.name,
    primary_muscle: exercise.primaryMuscle,
    image_url: exercise.imageUrl,
    instructions: exercise.instructions,
    target_muscles: exercise.targetMuscles,
  })

  return (
    <section className="exercise-card">
      <header className="exercise-card-header">
        <div>
          <h3>{exercise.name}</h3>
          <p className="exercise-card-subtitle">{previousLabel(exercise.previous)}</p>
        </div>
        <div className="exercise-card-actions">
          <button type="button" className="ghost-button" onClick={() => moveExercise(exercise.id, -1)} aria-label="Move exercise up">
            ↑
          </button>
          <button type="button" className="ghost-button" onClick={() => moveExercise(exercise.id, 1)} aria-label="Move exercise down">
            ↓
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => removeExercise(exercise.id)}
            aria-label={`Remove ${exercise.name}`}
          >
            ✕
          </button>
        </div>
      </header>

      <div className="exercise-guide">
        <img src={guide.imageUrl} alt={`${exercise.name} exercise demonstration`} loading="lazy" />
        <div>
          <strong>Targets: {guide.targetMuscles}</strong>
          <p>{guide.instructions}</p>
          <a className="exercise-guide-source" href={guide.sourceUrl} target="_blank" rel="noreferrer">
            Exercise reference
          </a>
        </div>

      </div>

      <div className="exercise-settings">
        <label>
          Rest (seconds)
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="15"
            value={exercise.restSeconds}
            onChange={(event) => updateExerciseField(exercise.id, 'restSeconds', Number(event.target.value) || 0)}
          />
        </label>
        <label>
          Exercise notes
          <textarea
            rows="1"
            value={exercise.notes}
            onChange={(event) => updateExerciseField(exercise.id, 'notes', event.target.value)}
            placeholder="Form cues, setup, or reminders"
          />
        </label>
      </div>

      <table className="sets-table">
        <thead>
          <tr>
            <th>SET</th>
            <th>PREVIOUS</th>
            <th>KG</th>
            <th>REPS</th>
            <th>RPE</th>
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
                    placeholder={set.previous?.weightKg ?? ''}
                    value={set.weightKg}
                    onChange={(event) => updateSetField(exercise.id, set.id, 'weightKg', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={set.previous?.reps ?? ''}
                    value={set.reps}
                    onChange={(event) => updateSetField(exercise.id, set.id, 'reps', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="rpe-input"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="10"
                    step="0.5"
                    aria-label="RPE"
                    placeholder="RPE"
                    value={set.rpe}
                    onChange={(event) => updateSetField(exercise.id, set.id, 'rpe', event.target.value)}
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
