// Shared distance conversion helpers (canonical storage unit is meters).
export function toMeters(value, unit) {
  const num = Number(value)
  if (Number.isNaN(num)) return null
  return unit === 'km' ? num * 1000 : num
}

export function formatDistance(meters) {
  if (meters === null || meters === undefined) return ''
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters} m`
}
