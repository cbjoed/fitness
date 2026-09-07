import { useMemo, useState } from 'react'

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]

function calculatePlates(total, bar) {
  let remaining = Math.max(0, total - bar) / 2
  return PLATES.flatMap((plate) => {
    const count = Math.floor(remaining / plate)
    remaining -= count * plate
    return Array.from({ length: count }, () => plate)
  })
}

export default function WorkoutCalculators() {
  const [open, setOpen] = useState(null)
  const [total, setTotal] = useState(60)
  const [bar, setBar] = useState(20)
  const [oneRepMax, setOneRepMax] = useState(100)
  const plates = useMemo(() => calculatePlates(Number(total), Number(bar)), [total, bar])
  const warmups = [0.5, 0.7, 0.8, 0.9].map((percentage, index) => ({
    percentage,
    reps: [5, 3, 2, 1][index],
    weight: Math.round((Number(oneRepMax) * percentage) / 2.5) * 2.5,
  }))

  return (
    <section className="workout-tools">
      <button type="button" className="ghost-button" onClick={() => setOpen(open === 'plates' ? null : 'plates')}>
        Plate Calculator
      </button>
      <button type="button" className="ghost-button" onClick={() => setOpen(open === 'warmup' ? null : 'warmup')}>
        Warmup Calculator
      </button>
      {open === 'plates' && (
        <div className="calculator-panel">
          <label>Total weight (kg)<input type="number" inputMode="decimal" value={total} onChange={(event) => setTotal(event.target.value)} /></label>
          <label>Bar weight (kg)<input type="number" inputMode="decimal" value={bar} onChange={(event) => setBar(event.target.value)} /></label>
          <strong>{plates.length ? plates.join(' + ') : 'No plates required'} kg per side</strong>
        </div>
      )}
      {open === 'warmup' && (
        <div className="calculator-panel">
          <label>Working 1RM (kg)<input type="number" inputMode="decimal" value={oneRepMax} onChange={(event) => setOneRepMax(event.target.value)} /></label>
          <ul>
            {warmups.map((set) => <li key={set.percentage}>{Math.round(set.percentage * 100)}% × {set.reps}: <strong>{set.weight} kg</strong></li>)}
          </ul>
        </div>
      )}
    </section>
  )
}
