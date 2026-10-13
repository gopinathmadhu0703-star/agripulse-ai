/**
 * Export an array of records to a CSV file download.
 * Headers are derived from the keys of the first record.
 */
export function exportToCSV(
  rows: Record<string, unknown>[],
  filename: string
): void {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0]!)
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v)
    // Wrap in quotes if contains comma, quote, or newline
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
