import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../lib/supabaseClient'

export default function ProgressChart() {
  const [entries, setEntries] = useState([])
  const [exercise, setExercise] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error: fetchError } = await supabase
        .from('set_logs')
        .select(
          'weight_kg, reps, is_completed, exercise_log:exercise_logs!inner(exercise:exercises!inner(name, primary_muscle), session:workout_sessions!inner(start_time))',
        )
        .eq('is_completed', true)

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      const normalized = (data ?? []).map((entry) => ({
        date: entry.exercise_log.session.start_time,
        exercise_name: entry.exercise_log.exercise.name,
        primary_muscle: entry.exercise_log.exercise.primary_muscle,
        weight_kg: entry.weight_kg == null ? null : Number(entry.weight_kg),
        reps: entry.reps == null ? null : Number(entry.reps),
      }))
      normalized.sort((left, right) => new Date(left.date) - new Date(right.date))
      setEntries(normalized)
      if (normalized.length > 0 && !exercise) {
        setExercise(normalized[0].exercise_name)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exerciseNames = useMemo(
    () => [...new Set(entries.map((entry) => entry.exercise_name))],
    [entries],
  )

  const chartData = useMemo(
    () =>
      entries
        .filter((entry) => entry.exercise_name === exercise)
        .reduce((points, entry) => {
          const date = new Date(entry.date).toLocaleDateString()
          const previous = points.at(-1)
          if (previous?.date === date) {
            previous.volume_kg += (entry.weight_kg ?? 0) * (entry.reps ?? 0)
            previous.max_weight_kg = Math.max(previous.max_weight_kg, entry.weight_kg ?? 0)
            return points
          }
          return [...points, {
            date,
            volume_kg: (entry.weight_kg ?? 0) * (entry.reps ?? 0),
            max_weight_kg: entry.weight_kg ?? 0,
          }]
        }, []),
    [entries, exercise],
  )

  if (error) return <p className="form-error">{error}</p>

  return (
    <div className="progress-chart">
      <h2>Progress</h2>
      {exerciseNames.length === 0 ? (
        <p>Finish a routine workout to see your progress here.</p>
      ) : (
        <>
          <label>
            Exercise
            <select value={exercise} onChange={(e) => setExercise(e.target.value)}>
              {exerciseNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="max_weight_kg" name="Top weight (kg)" stroke="#2563eb" />
              <Line type="monotone" dataKey="volume_kg" name="Volume (kg)" stroke="#aa3bff" />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
