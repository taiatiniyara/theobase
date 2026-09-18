// Local calendar date (not UTC) — a treasurer's "most recent Saturday"
// depends on their own timezone, not the server's.
export function getMostRecentSaturday(now = new Date()): string {
  const date = new Date(now)
  const daysSinceSaturday = (date.getDay() + 1) % 7 // Sat=6 -> 0, Sun=0 -> 1, ...
  date.setDate(date.getDate() - daysSinceSaturday)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
