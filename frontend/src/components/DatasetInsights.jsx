
import { lazy, Suspense } from 'react'
import { Database, AlertTriangle } from 'lucide-react'

const Plot = lazy(() => import('react-plotly.js'))

const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#34d399', '#f59e0b', '#06b6d4']

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

// NEW: Pearson correlation calculation
const getCorrelation = (columnA, columnB, rows) => {
  const pairs = rows.map((row) => [
    numericValue(row[columnA.index]),
    numericValue(row[columnB.index]),
  ]).filter(([a, b]) => a !== null && b !== null)

  if (pairs.length < 2) return 0

  const meanA = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length
  const meanB = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length

  const numerator = pairs.reduce(
    (sum, pair) => sum + (pair[0] - meanA) * (pair[1] - meanB), 0
  )

  const denominator = Math.sqrt(
    pairs.reduce((sum, pair) => sum + (pair[0] - meanA) ** 2, 0) *
    pairs.reduce((sum, pair) => sum + (pair[1] - meanB) ** 2, 0)
  )

  return denominator ? numerator / denominator : 0
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

function Chart({ data, layout = {}, height = 210 }) {
  const baseLayout = {
    autosize: true,
    height,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#94a3b8', family: 'Inter, sans-serif', size: 11 },
    margin: { l: 35, r: 10, t: 15, b: 35 },
    xaxis: { gridcolor: 'rgba(255, 255, 255, 0.05)', automargin: true, tickfont: { color: '#64748b' } },
    yaxis: { gridcolor: 'rgba(255, 255, 255, 0.05)', automargin: true, tickfont: { color: '#64748b' } },
    showlegend: false,
    ...layout,
  }

  return (
    <Suspense fallback={<div className="ec-muted-text" style={{ padding: '40px', textAlign: 'center' }}>Rendering chart...</div>}>
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
            <span className="di-eyebrow">AUTOMATED DATA EXPLORATION</span>
            <h2>Dataset Insights &amp; Health</h2>
            <p>Upload a CSV file to generate automated exploratory data analysis and feature profiling.</p>
          </div>
          <span className="di-status">Awaiting Dataset</span>
        </div>
        <div className="di-empty">
          <Database size={36} />
          <strong>No Dataset Loaded</strong>
          <p>Statistical summaries, distributions, and column profiles will render automatically upon CSV upload.</p>
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

  // NEW: Additional visualization calculations
  const correlationColumns = numericColumns.slice(0, 8)

  const correlationMatrix = correlationColumns.map((columnA) =>
    correlationColumns.map((columnB) =>
      getCorrelation(columnA, columnB, rows)
    )
  )

  const distributionColumns = numericColumns.slice(0, 3)

  const scatterPairs = []

  for (let i = 0; i < Math.min(numericColumns.length, 3); i++) {
    for (let j = i + 1; j < Math.min(numericColumns.length, 3); j++) {
      const a = numericColumns[i]
      const b = numericColumns[j]

      const points = rows.map((row) => ({
        x: numericValue(row[a.index]),
        y: numericValue(row[b.index]),
      })).filter((point) => point.x !== null && point.y !== null)
        .slice(0, 3000)

      scatterPairs.push({ a, b, points })
    }
  }

  const missingColumns = columns
    .filter((column) => column.missing > 0)
    .sort((a, b) => b.missing - a.missing)
    .slice(0, 12)

  const categoryPie = categoricalColumns[0]
    ? (() => {
        const counts = new Map()

        categoricalColumns[0].values.forEach((value) => {
          counts.set(value, (counts.get(value) || 0) + 1)
        })

        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
        const top = sorted.slice(0, 8)
        const remaining = sorted.slice(8).reduce((sum, item) => sum + item[1], 0)

        if (remaining > 0) top.push(['Other', remaining])

        return {
          column: categoricalColumns[0],
          labels: top.map((item) => item[0]),
          values: top.map((item) => item[1]),
        }
      })()
    : null

  const chartableCount =
    numericColumns.length + categoricalColumns.length + dateColumns.length

  return (
    <section className="panel di-workspace" id="visualizations">
      <div className="di-heading">
        <div>
          <span className="di-eyebrow">AUTOMATED DATA EXPLORATION</span>
          <h2>Dataset Insights &amp; Feature Health</h2>
          <p>Automated statistical analysis and schema inference for causal readiness.</p>
        </div>
        <span className="di-status">{rows.length.toLocaleString()} Records Profiled</span>
      </div>

      {/* Summary KPI Cards */}
      <div className="di-summary-grid">
        <div className="di-summary-card">
          <span>Total Records</span>
          <strong>{rows.length.toLocaleString()}</strong>
        </div>
        <div className="di-summary-card">
          <span>Detected Features</span>
          <strong>{headers.length}</strong>
        </div>
        <div className="di-summary-card">
          <span>Missing Cells</span>
          <strong style={{ color: missingTotal > 0 ? '#fbbf24' : '#34d399' }}>
            {missingTotal.toLocaleString()}
          </strong>
        </div>
        <div className="di-summary-card">
          <span>Duplicate Rows</span>
          <strong style={{ color: duplicateCount > 0 ? '#fda4af' : '#34d399' }}>
            {duplicateCount.toLocaleString()}
          </strong>
        </div>
      </div>

      {/* Column Type Badges */}
      <div className="di-type-summary">
        <span>Numeric Features: <strong>{numericColumns.length}</strong></span>
        <span>Categorical Factors: <strong>{categoricalColumns.length}</strong></span>
        <span>Temporal Columns: <strong>{dateColumns.length}</strong></span>
        <span>Identifiers: <strong>{identifierColumns.length}</strong></span>
        <span>Text Columns: <strong>{columns.filter((c) => c.type === 'text').length}</strong></span>
      </div>

      <div className="di-section-title">
        <h3>Feature Distributions</h3>
        <p>Interactive exploratory charts generated from detected feature modalities.</p>
      </div>

      <div className="di-grid">
        {categoryCharts.map(({ column, entries }) => (
          <ChartCard
            key={column.name}
            title={`${column.name} Distribution`}
            subtitle={`Top ${entries.length} categories by frequency`}
          >
            <Chart
              data={[{
                type: 'bar',
                x: entries.map((entry) => entry[0]),
                y: entries.map((entry) => entry[1]),
                marker: { color: '#818cf8', opacity: 0.85 },
                hovertemplate: '%{x}<br>Count: %{y}<extra></extra>',
              }]}
              layout={chartLayout}
            />
          </ChartCard>
        ))}

        {numericCharts.map(({ column, values }) => (
          <ChartCard
            key={column.name}
            title={`${column.name} Histogram`}
            subtitle={`Distribution of ${values.length.toLocaleString()} valid numeric values`}
          >
            <Chart
              data={[{
                type: 'histogram',
                x: values.slice(0, 10000),
                marker: { color: COLORS[column.index % COLORS.length], opacity: 0.8 },
                nbinsx: 25,
                hovertemplate: 'Range: %{x}<br>Count: %{y}<extra></extra>',
              }]}
            />
          </ChartCard>
        ))}

        {/* NEW: Correlation Heatmap */}
        {correlationColumns.length >= 2 && (
          <ChartCard
            title="Feature Correlation Heatmap"
            subtitle="Pearson correlation between numeric features"
            wide
          >
            <Chart
              height={300}
              data={[{
                type: 'heatmap',
                z: correlationMatrix,
                x: correlationColumns.map((column) => column.name),
                y: correlationColumns.map((column) => column.name),
                zmin: -1,
                zmax: 1,
                colorscale: 'RdBu',
                reversescale: true,
                hovertemplate: '%{y} vs %{x}<br>Correlation: %{z:.3f}<extra></extra>',
                colorbar: { title: 'Correlation' },
              }]}
              layout={{
                margin: { l: 100, r: 35, t: 15, b: 90 },
                xaxis: { tickangle: -35 },
              }}
            />
          </ChartCard>
        )}

        {/* NEW: Box Plots */}
        {distributionColumns.map((column) => (
          <ChartCard
            key={`box-${column.name}`}
            title={`${column.name} Box Plot`}
            subtitle="Median, quartiles and potential outliers"
          >
            <Chart
              data={[{
                type: 'box',
                y: column.values.slice(0, 5000),
                name: column.name,
                boxpoints: 'outliers',
                marker: { color: '#818cf8' },
              }]}
            />
          </ChartCard>
        ))}

        {/* NEW: Scatter Plots */}
        {scatterPairs.map(({ a, b, points }) => (
          <ChartCard
            key={`scatter-${a.name}-${b.name}`}
            title={`${a.name} vs ${b.name}`}
            subtitle="Relationship between two numeric features"
          >
            <Chart
              data={[{
                type: 'scatter',
                mode: 'markers',
                x: points.map((point) => point.x),
                y: points.map((point) => point.y),
                marker: { color: '#38bdf8', size: 5, opacity: 0.5 },
                hovertemplate: 'X: %{x}<br>Y: %{y}<extra></extra>',
              }]}
              layout={{
                xaxis: { title: a.name },
                yaxis: { title: b.name },
              }}
            />
          </ChartCard>
        ))}

        {/* NEW: Violin Plots */}
        {distributionColumns.map((column) => (
          <ChartCard
            key={`violin-${column.name}`}
            title={`${column.name} Violin Plot`}
            subtitle="Distribution density and statistical spread"
          >
            <Chart
              data={[{
                type: 'violin',
                y: column.values.slice(0, 5000),
                name: column.name,
                box: { visible: true },
                meanline: { visible: true },
                points: false,
                line: { color: '#c084fc' },
                fillcolor: 'rgba(192, 132, 252, 0.25)',
              }]}
            />
          </ChartCard>
        ))}

        {/* NEW: Missing Values Chart */}
        {missingColumns.length > 0 && (
          <ChartCard
            title="Missing Values Analysis"
            subtitle="Features with missing records"
            wide
          >
            <Chart
              height={Math.max(210, missingColumns.length * 32)}
              data={[{
                type: 'bar',
                orientation: 'h',
                x: missingColumns.map((column) => column.missing),
                y: missingColumns.map((column) => column.name),
                marker: { color: '#f59e0b' },
                hovertemplate: '%{y}<br>Missing: %{x}<extra></extra>',
              }]}
              layout={{
                margin: { l: 120, r: 20, t: 10, b: 35 },
                yaxis: { autorange: 'reversed' },
              }}
            />
          </ChartCard>
        )}

        {/* NEW: Donut Chart */}
        {categoryPie && (
          <ChartCard
            title={`${categoryPie.column.name} Category Breakdown`}
            subtitle="Proportion of categorical values"
          >
            <Chart
              data={[{
                type: 'pie',
                labels: categoryPie.labels,
                values: categoryPie.values,
                hole: 0.55,
                textinfo: 'percent',
                hovertemplate: '%{label}<br>Count: %{value}<br>%{percent}<extra></extra>',
              }]}
              layout={{
                showlegend: true,
                legend: { orientation: 'h', y: -0.2 },
              }}
            />
          </ChartCard>
        )}

        {dateChart && (
          <ChartCard
            title={`${dateChart.column.name} Timeline`}
            subtitle="Temporal ordering of records as ingested"
            wide
          >
            <Chart
              data={[{
                type: 'scatter',
                mode: 'markers',
                x: dateChart.points.map((point) => point.date),
                y: dateChart.points.map((point) => point.row),
                marker: { color: '#38bdf8', size: 6 },
                hovertemplate: '%{x}<br>CSV row: %{y}<extra></extra>',
              }]}
              layout={{
                xaxis: { title: dateChart.column.name, gridcolor: 'rgba(255, 255, 255, 0.05)' },
                yaxis: { title: 'Row Index', gridcolor: 'rgba(255, 255, 255, 0.05)' },
              }}
            />
          </ChartCard>
        )}

        {chartableCount === 0 && (
          <div className="di-empty">
            <AlertTriangle size={26} />
            <strong>No Plottable Columns Detected</strong>
            <p>Dataset contains identifiers or text data with no numeric or categorical distributions.</p>
          </div>
        )}
      </div>

      {/* Numeric Stats Table */}
      {numericStats.length > 0 && (
        <>
          <div className="di-section-title">
            <h3>Parametric &amp; Non-Parametric Statistics</h3>
            <p>Mean, median, range, and dispersion for all numeric variables.</p>
          </div>
          <div className="table-scroll">
            <table className="di-table">
              <thead>
                <tr>
                  <th>Feature Column</th>
                  <th>Valid Count</th>
                  <th>Mean</th>
                  <th>Median</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Std Deviation</th>
                </tr>
              </thead>
              <tbody>
                {numericStats.map(({ column, stats }) => (
                  <tr key={column.name}>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>{column.name}</td>
                    <td>{stats.count.toLocaleString()}</td>
                    <td style={{ color: '#38bdf8' }}>{format(stats.mean)}</td>
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

      {/* Schema Profile */}
      <div className="di-section-title">
        <h3>Feature Dictionary &amp; Schema Profile</h3>
        <p>Inferred data types, null cell rates, and cardinality for all variables.</p>
      </div>
      <div className="table-scroll">
        <table className="di-table">
          <thead>
            <tr>
              <th>Column Name</th>
              <th>Inferred Type</th>
              <th>Missing Cells</th>
              <th>Unique Values</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((column) => (
              <tr key={column.name}>
                <td style={{ fontWeight: 600, color: '#ffffff' }}>{column.name}</td>
                <td>
                  <span
                    className="di-type-tag"
                    style={{
                      background:
                        column.type === 'numeric'
                          ? 'rgba(56, 189, 248, 0.15)'
                          : column.type === 'categorical'
                          ? 'rgba(129, 140, 248, 0.15)'
                          : column.type === 'date'
                          ? 'rgba(52, 211, 153, 0.15)'
                          : 'rgba(100, 116, 139, 0.15)',
                      color:
                        column.type === 'numeric'
                          ? '#38bdf8'
                          : column.type === 'categorical'
                          ? '#818cf8'
                          : column.type === 'date'
                          ? '#34d399'
                          : '#94a3b8',
                      borderColor: 'transparent'
                    }}
                  >
                    {column.type}
                  </span>
                </td>
                <td style={{ color: column.missing > 0 ? '#fbbf24' : 'var(--text-muted)' }}>
                  {column.missing.toLocaleString()}
                </td>
                <td>{column.unique.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="di-disclaimer">
        Exploratory statistics only. Inferred schema types reflect heuristics to guide causal feature selection and confounder adjustments.
      </p>
    </section>
  )
}
