import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toMeters } from '../lib/units'
import { COMMON_EXERCISES } from '../lib/exercises'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  exercise_name: '',
  sets: '',
  reps: '',
  weight_kg: '',
  distance: '',
  distance_unit: 'km',
  duration_minutes: '',
  notes: '',
}

export default function LogEntryForm({ onEntryAdded }) {
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      user_id: user.id,
      date: form.date,
      exercise_name: form.exercise_name.trim(),
      sets: form.sets ? Number(form.sets) : null,
      reps: form.reps ? Number(form.reps) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      distance_meters: form.distance ? toMeters(form.distance, form.distance_unit) : null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      notes: form.notes.trim() || null,
    }

    const { error: insertError } = await supabase.from('workout_logs').insert(payload)

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setForm(emptyForm)
    onEntryAdded?.()
  }

  return (
    <form className="log-entry-form" onSubmit={handleSubmit}>
      <h2>Log a workout</h2>
      {error && <p className="form-error">{error}</p>}

      <label>
        Date
        <input type="date" name="date" value={form.date} onChange={handleChange} required />
      </label>

      <label>
        Exercise
        <input
          type="text"
          name="exercise_name"
          list="exercise-options"
          value={form.exercise_name}
          onChange={handleChange}
          placeholder="e.g. Bench Press, Running"
          autoComplete="off"
          required
        />
        <datalist id="exercise-options">
          {COMMON_EXERCISES.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>

      <div className="form-row">
        <label>
          Sets
          <input type="number" name="sets" min="0" value={form.sets} onChange={handleChange} />
        </label>
        <label>
          Reps
          <input type="number" name="reps" min="0" value={form.reps} onChange={handleChange} />
        </label>
        <label>
          Weight (kg)
          <input
            type="number"
            name="weight_kg"
            min="0"
            step="0.5"
            value={form.weight_kg}
            onChange={handleChange}
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Distance
          <input type="number" name="distance" min="0" step="0.01" value={form.distance} onChange={handleChange} />
        </label>
        <label>
          Unit
          <select name="distance_unit" value={form.distance_unit} onChange={handleChange}>
            <option value="km">km</option>
            <option value="m">m</option>
          </select>
        </label>
        <label>
          Duration (min)
          <input
            type="number"
            name="duration_minutes"
            min="0"
            value={form.duration_minutes}
            onChange={handleChange}
          />
        </label>
      </div>

      <label>
        Notes
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} />
      </label>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Add entry'}
      </button>
    </form>
  )
}
