import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatDistance } from '../lib/units'

function groupByDate(entries) {
  const groups = []
  let current = null
  for (const entry of entries) {
    if (!current || current.date !== entry.date) {
      current = { date: entry.date, entries: [] }
      groups.push(current)
    }
    current.entries.push(entry)
  }
  return groups
}

function EntryStat({ entry }) {
  const parts = []
  if (entry.sets || entry.reps) parts.push(`${entry.sets ?? '-'} x ${entry.reps ?? '-'}`)
  if (entry.weight_kg) parts.push(`${entry.weight_kg} kg`)
  if (entry.distance_meters) parts.push(formatDistance(entry.distance_meters))
  if (entry.duration_minutes) parts.push(`${entry.duration_minutes} min`)

  return <span className="entry-stats">{parts.join(' · ') || '-'}</span>
}

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

  const groups = groupByDate(entries)

  return (
    <div className="history-list">
      <h2>History</h2>
      {groups.length === 0 ? (
        <p>No entries yet.</p>
      ) : (
        <div className="day-groups">
          {groups.map((group) => (
            <div className="day-group" key={group.date}>
              <div className="day-group-header">{group.date}</div>
              <ul className="entry-list">
                {group.entries.map((entry) => (
                  <li className="entry-row" key={entry.id}>
                    <div className="entry-main">
                      <span className="entry-name">{entry.exercise_name}</span>
                      <EntryStat entry={entry} />
                      {entry.notes && <span className="entry-notes">{entry.notes}</span>}
                    </div>
                    <button
                      type="button"
                      className="entry-delete"
                      aria-label={`Delete ${entry.exercise_name} entry`}
                      onClick={() => handleDelete(entry.id)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

