import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatDistance } from '../lib/units'

export default function HistoryList({ refreshKey }) {
  const [entries, setEntries] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error: fetchError } = await supabase
        .from('workout_logs')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      setEntries(data)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  async function handleDelete(id) {
    const { error: deleteError } = await supabase.from('workout_logs').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  if (error) return <p className="form-error">{error}</p>

  return (
    <div className="history-list">
      <h2>History</h2>
      {entries.length === 0 ? (
        <p>No entries yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Exercise</th>
              <th>Sets x Reps</th>
              <th>Weight</th>
              <th>Distance</th>
              <th>Duration</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.date}</td>
                <td>{entry.exercise_name}</td>
                <td>{entry.sets ?? '-'} x {entry.reps ?? '-'}</td>
                <td>{entry.weight_kg ? `${entry.weight_kg} kg` : '-'}</td>
                <td>{entry.distance_meters ? formatDistance(entry.distance_meters) : '-'}</td>
                <td>{entry.duration_minutes ? `${entry.duration_minutes} min` : '-'}</td>
                <td>
                  <button type="button" onClick={() => handleDelete(entry.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
