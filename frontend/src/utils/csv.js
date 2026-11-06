export function parseCSVContent(content) {
  const text = String(content ?? '').replace(/^\uFEFF/, '')

  const records = []
  let row = []
  let value = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"'
        i++
      } else if (quoted || value === '') {
        quoted = !quoted
      } else {
        throw new Error('Unexpected quote in an unquoted field.')
      }
    } else if (char === ',' && !quoted) {
      row.push(value.trim())
      value = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++

      row.push(value.trim())

      if (row.some(cell => cell !== '')) records.push(row)

      row = []
      value = ''
    } else {
      value += char
    }
  }

  if (quoted) {
    throw new Error('The CSV file contains an unclosed quoted field.')
  }

  row.push(value.trim())
  if (row.some(cell => cell !== '')) records.push(row)

  if (records.length < 2) {
    throw new Error('This file is empty or has no data rows.')
  }

  const headers = records[0]

  if (headers.every(header => !header)) {
    throw new Error('The CSV file must contain column headers.')
  }

  if (headers.some(header => !header)) {
    throw new Error(
      'Each column must have a header. Please check the first row.'
    )
  }

  const data = records.slice(1)
  const invalidIndex = data.findIndex(record => record.length !== headers.length)

  if (invalidIndex !== -1) {
    throw new Error(
      `Data row ${invalidIndex + 1} has ${data[invalidIndex].length} columns; expected ${headers.length}. Please check your CSV file.`
    )
  }

  return { headers, rows: data }
}
