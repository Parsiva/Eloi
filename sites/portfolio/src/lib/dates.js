// Marginalia `date` values are plain calendar dates ("2025-12-31", a Postgres `date`).
// `new Date('2025-12-31')` reads that as UTC midnight, which is still Dec 30 anywhere
// west of Greenwich, so calendar dates are formatted in UTC and "today" is built from
// local time instead of toISOString().
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export function formatDate(value) {
  if (!value) return ''
  const dateOnly = typeof value === 'string' && DATE_ONLY.test(value)
  return new Date(value).toLocaleDateString(undefined, dateOnly ? { timeZone: 'UTC' } : undefined)
}

export function todayISODate() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
