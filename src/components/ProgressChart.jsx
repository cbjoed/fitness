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
        .from('workout_logs')
        .select('date, exercise_name, weight_kg, distance_meters, duration_minutes')
        .order('date', { ascending: true })

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      setEntries(data)
      if (data.length > 0 && !exercise) {
        setExercise(data[0].exercise_name)
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
        .map((entry) => ({
          date: entry.date,
          weight_kg: entry.weight_kg,
          distance_km: entry.distance_meters ? entry.distance_meters / 1000 : null,
        })),
    [entries, exercise],
  )

  const isCardio = chartData.some((point) => point.distance_km !== null)

  if (error) return <p className="form-error">{error}</p>

  return (
    <div className="progress-chart">
      <h2>Progress</h2>
      {exerciseNames.length === 0 ? (
        <p>Log some entries to see progress charts.</p>
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
              {isCardio ? (
                <Line type="monotone" dataKey="distance_km" name="Distance (km)" stroke="#2563eb" />
              ) : (
                <Line type="monotone" dataKey="weight_kg" name="Weight (kg)" stroke="#2563eb" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
