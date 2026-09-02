import { useState } from 'react'
import LogEntryForm from './LogEntryForm'
import HistoryList from './HistoryList'

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="dashboard">
      <LogEntryForm onEntryAdded={() => setRefreshKey((key) => key + 1)} />
      <HistoryList refreshKey={refreshKey} />
    </div>
  )
}
