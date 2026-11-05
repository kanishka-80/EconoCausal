import { lazy, Suspense } from 'react'
import { Database, AlertTriangle } from 'lucide-react'

const Plot = lazy(() => import('react-plotly.js'))

const COLORS = ['#63a5ff', '#43c6ac', '#b18cff', '#f5b95f', '#ef829c']

const numericValue = (value) => {
  if (value === null || value === undefined) return null
  const cleaned = String(value).trim().replace(/,/g, '')
  if (!cleaned) return null
  const number = Number(cleaned)
  return Number.isFinite(number) ? number : null
}

const median = (values) => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

const detectColumn = (name, values) => {
  const nonEmpty = values.filter((value) => String(value ?? '').trim() !== '')
  const lowerName = name.toLowerCase()

  if (!nonEmpty.length) return { type: 'empty', values: [] }

  const dateName = /date|time|month|year|day/.test(lowerName)
  const dateCount = nonEmpty.filter((value) => {
    const text = String(value).trim()
    return /^\d{4}[-/]\d{1,2}([-/]\d{1,2})?/.test(text) ||
      /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(text)
  }).length

  if (dateName && dateCount / nonEmpty.length >= 0.5) {
    return { type: 'date', values: nonEmpty }
  }

  const parsed = nonEmpty.map(numericValue)
  const numericCount = parsed.filter((value) => value !== null).length

  if (numericCount / nonEmpty.length >= 0.85) {
    const uniqueCount = new Set(nonEmpty.map(String)).size
    const idLikeName = /(^id$|_id$|id$|uuid|customer.?number|record.?number)/i.test(name)
    const almostUnique = uniqueCount / nonEmpty.length > 0.98

    return {
      type: idLikeName || (almostUnique && /serial|index|number|key|code/.test(lowerName))
        ? 'identifier'
        : 'numeric',
      values: parsed.filter((value) => value !== null),
    }
  }

  const uniqueCount = new Set(nonEmpty.map((value) => String(value).trim())).size
  const booleanLike = nonEmpty.every((value) =>
    ['true', 'false', 'yes', 'no', '0', '1'].includes(
      String(value).trim().toLowerCase()
    )
  )

  return {
    type: booleanLike || uniqueCount <= Math.min(30, Math.max(2, nonEmpty.length * 0.2))
      ? 'categorical'
      : 'text',
    values: nonEmpty.map((value) => String(value).trim()),
  }
}

const format = (value) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 })
}

const calculateStats = (values) => {
  if (!values.length) return null

  const sum = values.reduce((total, value) => total + value, 0)
  const mean = sum / values.length
  const variance = values.reduce(
    (total, value) => total + (value - mean) ** 2, 0
  ) / values.length

  return {
    count: values.length,
    mean,
    median: median(values),
    min: Math.min(...values),
    max: Math.max(...values),
    std: Math.sqrt(variance),
  }
}

function ChartCard({ title, subtitle, children, wide = false }) {
  return (
    <article className={`di-card ${wide ? 'di-card-wide' : ''}`}>
      <div className="di-card-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </article>
  )
}

function Chart({ data, layout = {}, height = 300 }) {
  const baseLayout = {
    autosize: true,
    height,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#aebed5', family: 'Inter, sans-serif', size: 11 },
    margin: { l: 48, r: 18, t: 25, b: 55 },
    xaxis: { gridcolor: '#263750', automargin: true },
    yaxis: { gridcolor: '#263750', automargin: true },
    showlegend: false,
    ...layout,
  }

  return (
    <Suspense fallback={<div className="di-loading">Loading visualization...</div>}>
      <div className="di-plot">
        <Plot
          data={data}
          layout={baseLayout}
          config={{
            responsive: true,
            displaylogo: false,
            displayModeBar: false,
          }}
          style={{ width: '100%', height }}
          useResizeHandler
        />
      </div>
    </Suspense>
  )
}

export default function DatasetInsights({ headers = [], rows = [] }) {
  if (!headers.length || !rows.length) {
    return (
      <section className="panel di-workspace" id="visualizations">
        <div className="di-heading">
          <div>
            <span className="di-eyebrow">DATA EXPLORATION</span>
            <h2>Dataset Insights</h2>
            <p>Upload a CSV file to generate automatic data analysis.</p>
          </div>
          <span className="di-status">Awaiting data</span>
        </div>
        <div className="di-empty">
          <Database size={30} />
          <strong>No dataset loaded</strong>
          <p>Your dataset statistics and visualizations will appear here after upload.</p>
        </div>
      </section>
    )
  }

  const columns = headers.map((name, index) => {
    const rawValues = rows.map((row) => row[index] ?? '')
    const detected = detectColumn(name, rawValues)
    const nonEmptyCount = rawValues.filter(
      (value) => String(value).trim() !== ''
    ).length

    return {
      name,
      index,
      rawValues,
      ...detected,
      missing: rows.length - nonEmptyCount,
      unique: new Set(
        rawValues
          .filter((value) => String(value).trim() !== '')
          .map(String)
      ).size,
    }
  })

  const numericColumns = columns.filter((column) => column.type === 'numeric')
  const categoricalColumns = columns.filter((column) => column.type === 'categorical')
  const dateColumns = columns.filter((column) => column.type === 'date')
  const identifierColumns = columns.filter((column) => column.type === 'identifier')

  const missingTotal = columns.reduce((total, column) => total + column.missing, 0)
  const duplicateCount = rows.length - new Set(
    rows.map((row) => JSON.stringify(row))
  ).size

  const chartLayout = {
    legend: { orientation: 'h', y: -0.25 },
  }

  const categoryCharts = categoricalColumns.slice(0, 2).map((column) => {
    const counts = new Map()
    column.values.forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1)
    })

    const entries = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    return {
      column,
      entries,
    }
  })

  const numericCharts = numericColumns.slice(0, 4).map((column) => ({
    column,
    values: column.values,
  }))

  const dateChart = dateColumns[0]
    ? {
        column: dateColumns[0],
        points: rows
          .map((row, index) => ({
            date: String(row[dateColumns[0].index] ?? '').trim(),
            row: index + 1,
          }))
          .filter((point) => point.date)
          .slice(0, 500),
      }
    : null

  const numericStats = numericColumns.map((column) => ({
    column,
    stats: calculateStats(column.values),
  }))

  const chartableCount =
    numericColumns.length + categoricalColumns.length + dateColumns.length

  return (
    <section className="panel di-workspace" id="visualizations">
      <div className="di-heading">
        <div>
          <span className="di-eyebrow">DATA EXPLORATION</span>
          <h2>Dataset Insights</h2>
          <p>Automatic analysis based on the detected columns in your uploaded CSV.</p>
        </div>
        <span className="di-status">{rows.length.toLocaleString()} rows loaded</span>
      </div>

      <div className="di-summary-grid">
        <div className="di-summary-card">
          <span>Total rows</span>
          <strong>{rows.length.toLocaleString()}</strong>
        </div>
        <div className="di-summary-card">
          <span>Total columns</span>
          <strong>{headers.length}</strong>
        </div>
        <div className="di-summary-card">
          <span>Missing cells</span>
          <strong>{missingTotal.toLocaleString()}</strong>
        </div>
        <div className="di-summary-card">
          <span>Duplicate rows</span>
          <strong>{duplicateCount.toLocaleString()}</strong>
        </div>
      </div>

      <div className="di-type-summary">
        <span>Numeric: <strong>{numericColumns.length}</strong></span>
        <span>Categorical: <strong>{categoricalColumns.length}</strong></span>
        <span>Date: <strong>{dateColumns.length}</strong></span>
        <span>Identifiers: <strong>{identifierColumns.length}</strong></span>
        <span>Text: <strong>{columns.filter((column) => column.type === 'text').length}</strong></span>
      </div>

      <div className="di-section-title">
        <h3>Visual analysis</h3>
        <p>Charts are selected automatically from the detected data types.</p>
      </div>

      <div className="di-grid">
        {categoryCharts.map(({ column, entries }) => (
          <ChartCard
            key={column.name}
            title={`${column.name} distribution`}
            subtitle={`Top ${entries.length} categories by frequency`}
          >
            <Chart
              data={[{
                type: 'bar',
                x: entries.map((entry) => entry[0]),
                y: entries.map((entry) => entry[1]),
                marker: { color: COLORS[1] },
                hovertemplate: '%{x}<br>Count: %{y}<extra></extra>',
              }]}
              layout={chartLayout}
            />
          </ChartCard>
        ))}

        {numericCharts.map(({ column, values }) => (
          <ChartCard
            key={column.name}
            title={`${column.name} distribution`}
            subtitle={`Histogram of ${values.length.toLocaleString()} valid numeric values`}
          >
            <Chart
              data={[{
                type: 'histogram',
                x: values.slice(0, 10000),
                marker: { color: COLORS[column.index % COLORS.length] },
                nbinsx: 25,
                hovertemplate: 'Range: %{x}<br>Count: %{y}<extra></extra>',
              }]}
            />
          </ChartCard>
        ))}

        {dateChart && (
          <ChartCard
            title={`${dateChart.column.name} values`}
            subtitle="Date values in the order they appear in the CSV"
            wide
          >
            <Chart
              data={[{
                type: 'scatter',
                mode: 'markers',
                x: dateChart.points.map((point) => point.date),
                y: dateChart.points.map((point) => point.row),
                marker: { color: COLORS[0], size: 6 },
                hovertemplate: '%{x}<br>CSV row: %{y}<extra></extra>',
              }]}
              layout={{
                xaxis: { title: dateChart.column.name, gridcolor: '#263750' },
                yaxis: { title: 'CSV row number', gridcolor: '#263750' },
              }}
            />
          </ChartCard>
        )}

        {chartableCount === 0 && (
          <div className="di-empty">
            <AlertTriangle size={26} />
            <strong>No suitable chart columns detected</strong>
            <p>This file may contain only identifiers, free text or empty columns.</p>
          </div>
        )}
      </div>

      {numericStats.length > 0 && (
        <>
          <div className="di-section-title">
            <h3>Numeric column statistics</h3>
            <p>Calculated from valid numeric values in each detected numeric column.</p>
          </div>
          <div className="di-table-wrap">
            <table className="di-table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Valid values</th>
                  <th>Mean</th>
                  <th>Median</th>
                  <th>Minimum</th>
                  <th>Maximum</th>
                  <th>Std. deviation</th>
                </tr>
              </thead>
              <tbody>
                {numericStats.map(({ column, stats }) => (
                  <tr key={column.name}>
                    <td>{column.name}</td>
                    <td>{stats.count.toLocaleString()}</td>
                    <td>{format(stats.mean)}</td>
                    <td>{format(stats.median)}</td>
                    <td>{format(stats.min)}</td>
                    <td>{format(stats.max)}</td>
                    <td>{format(stats.std)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="di-section-title">
        <h3>Column profile</h3>
        <p>Detected type, missing cells and distinct values for every column.</p>
      </div>
      <div className="di-table-wrap">
        <table className="di-table">
          <thead>
            <tr>
              <th>Column</th>
              <th>Detected type</th>
              <th>Missing</th>
              <th>Unique values</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((column) => (
              <tr key={column.name}>
                <td>{column.name}</td>
                <td><span className="di-type-tag">{column.type}</span></td>
                <td>{column.missing.toLocaleString()}</td>
                <td>{column.unique.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="di-disclaimer">
        These are descriptive statistics and visualizations, not causal estimates.
        Identifier columns are excluded from numeric charts. Date and type detection
        is heuristic and should be checked before making decisions.
      </p>
    </section>
  )
}
