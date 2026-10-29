import { parseCSVContent } from './utils/csv'
import { checkApiHealth, uploadDataset, getDatasetSummary } from './services/api'
import CausalAnalysisPanel from './components/CausalAnalysisPanel'
import { useEffect, useState } from 'react'
import Plot from 'react-plotly.js'
import {
  Activity, BarChart3, Bell, CheckCircle2, ChevronRight,
  CircleHelp, CloudUpload, Database, FileSpreadsheet, FileText,
  LayoutDashboard, Search, Settings, ShieldCheck, Sparkles,
  UploadCloud, Workflow, X
} from 'lucide-react'
import './App.css'


function DatasetCharts({ headers, rows }) {
  const numericColumns = headers
    .map((name, index) => ({
      name,
      index,
      values: rows.map(row => String(row[index] ?? '').trim()),
    }))
    .filter(column => {
      const valid = column.values.filter(
        value => value !== '' && Number.isFinite(Number(value))
      )
      return valid.length >= 2
    })
    .slice(0, 3)

  if (!rows.length) return null

  return (
    <section className="panel" style={{ marginTop: 20 }} id="visualizations">
      <div className="panel-heading">
        <div className="panel-title-icon"><BarChart3 size={23} /></div>
        <div className="panel-title-copy">
          <h2>Dataset Visualizations</h2>
          <p>Charts generated from numeric columns in your uploaded CSV.</p>
        </div>
        <span className="step-badge">CSV DATA</span>
      </div>

      {numericColumns.length === 0 ? (
        <p>No numeric columns with enough values were found. Upload a CSV
          containing numeric data to display charts.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {numericColumns.map(column => {
            const points = rows
              .map((row, index) => ({
                x: index + 1,
                y: String(row[column.index] ?? '').trim(),
              }))
              .filter(point => point.y !== '' && Number.isFinite(Number(point.y)))
              .slice(0, 100)

            return (
              <div key={column.index} style={{ minWidth: 0 }}>
                <Plot
                  data={[{
                    x: points.map(point => point.x),
                    y: points.map(point => Number(point.y)),
                    type: 'bar',
                    marker: { color: '#6c8cff' },
                    name: column.name,
                  }]}
                  layout={{
                    title: { text: column.name, font: { size: 16 } },
                    autosize: true,
                    margin: { l: 45, r: 15, t: 55, b: 45 },
                    xaxis: { title: 'Row number' },
                    yaxis: { title: column.name },
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: '100%', height: 320 }}
                  useResizeHandler
                />
              </div>
            )
          })}
        </div>
      )}
      <p style={{ fontSize: 12, opacity: 0.7 }}>
        Showing up to 100 valid values per chart. These are descriptive
        visualizations, not causal estimates.
      </p>
    </section>
  )
}

function BudgetAllocationPreview() {
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  function handlePreview() {
    const amount = Number(budget);

    if (budget.trim() === "" || !Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a budget greater than zero.");
      setShowPreview(false);
      return;
    }

    setError("");
    setShowPreview(true);
  }

  return (
    <div className="budget-preview">
      <div className="budget-input-area">
        <label htmlFor="marketing-budget">Marketing budget</label>
        <div className="budget-input-row">
          <input
            id="marketing-budget"
            type="number"
            min="0"
            step="any"
            placeholder="Enter budget amount"
            value={budget}
            onChange={(event) => {
              setBudget(event.target.value);
              setError("");
              setShowPreview(false);
            }}
          />
          <button type="button" onClick={handlePreview}>
            Preview scenario
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
      </div>

      {showPreview && (
        <div className="budget-scenario">
          <strong>Budget received: {Number(budget).toLocaleString()}</strong>
          <p>
            Your budget input is valid. No allocation has been calculated yet.
            Recommendations will appear after the optimization model and API are connected.
          </p>
          <span className="step-badge">PREVIEW ONLY</span>
        </div>
      )}

      {!showPreview && !error && (
        <div className="empty-table">
          <div className="database-illustration">
            <Workflow size={35} />
          </div>
          <strong>Allocation preview not generated</strong>
          <p>
            Enter a positive budget amount to validate your input and preview
            the scenario.
          </p>
        </div>
      )}
    </div>
  );
}

function App() {
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState([])
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [apiStatus, setApiStatus] = useState('Checking')
  const [uploadStatus, setUploadStatus] = useState('Not uploaded')
  const [summaryStatus, setSummaryStatus] = useState('Waiting for dataset')
  const [backendSummary, setBackendSummary] = useState(null)

  useEffect(() => {
    let active = true

    async function checkApi() {
      try {
        await checkApiHealth()
        if (active) setApiStatus('Connected')
      } catch {
        if (active) setApiStatus('Offline')
      }
    }

    checkApi()

    return () => {
      active = false
    }
  }, [])


  function processFile(file) {
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please choose a valid CSV file.')
      return
    }

    setError('')
    setIsLoading(true)
    setFileName('')
    setHeaders([])
    setRows([])
    setSearch('')
    setUploadStatus('Not uploaded')
    setSummaryStatus('Waiting for dataset')
    setBackendSummary(null)

    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const content = String(event.target?.result ?? '')
        const { headers: columns, rows: data } = parseCSVContent(content)

        setFileName(file.name)
        setHeaders(columns)
        setRows(data)
        setUploadStatus('Uploading...')
        try {
          await uploadDataset(file)
          setUploadStatus('Uploaded successfully')
          setSummaryStatus('Loading backend summary...')
          try {
            const summary = await getDatasetSummary()
            setBackendSummary(summary.data ?? summary)
            setSummaryStatus('Backend summary received')
          } catch {
            setBackendSummary(null)
            setSummaryStatus('Backend summary unavailable; showing local statistics')
          }
        } catch {
          setBackendSummary(null)
          setUploadStatus('Local preview ready; backend upload unavailable')
          setSummaryStatus('Using local statistics; backend upload unavailable')
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Unable to read this CSV file.'
        )
      } finally {
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      setError('Unable to read this file.')
      setIsLoading(false)
    }

    reader.readAsText(file)
  }

  function removeFile() {
    setFileName('')
    setHeaders([])
    setRows([])
    setSearch('')
    setError('')
    setIsLoading(false)
    setUploadStatus('Not uploaded')
    setSummaryStatus('Waiting for dataset')
  }

  const missingValues = rows.reduce((total, row) => {
    return total + headers.reduce((count, _, index) => {
      const value = String(row[index] ?? '').trim()
      return count + (value === '' ? 1 : 0)
    }, 0)
  }, 0)

  const totalRows = backendSummary?.row_count ?? rows.length
  const totalColumns = backendSummary?.column_count ?? headers.length
  const backendMissingValues = backendSummary?.columns?.reduce(
    (total, column) => total + (column.null_count ?? 0),
    0
  )
  const displayedMissingValues = backendMissingValues ?? missingValues

  const isSyntheticDataset =
    fileName.toLowerCase().includes('synthetic') ||
    fileName.toLowerCase().includes('demo')

  const filteredRows = rows.filter(row =>
    row.some(cell =>
      String(cell ?? '').toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <span className="brand-mark">
            <Activity size={25} />
          </span>
          <span>
            <strong>EconoCausal</strong>
            <small>Causal Intelligence Platform</small>
          </span>
        </a>

        <div className="nav-section-label">WORKSPACE</div>

        <nav className="navigation">
          <a className="nav-link active" href="#dashboard">
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </a>

          <a className="nav-link" href="#upload">
            <CloudUpload size={19} />
            <span>Upload &amp; Preview</span>
          </a>

          <a className="nav-link" href="#analysis">
            <Workflow size={19} />
            <span>Causal Results</span>
          </a>

          <a className="nav-link" href="#budget">
            <BarChart3 size={19} />
            <span>Budget Allocation</span>
          </a>

          <a className="nav-link" href="#settings">
            <Settings size={19} />
            <span>Settings</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="team-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <strong>27</strong>
            <small>Frontend Workspace</small>
          </div>
          <span className="online-dot" />
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={15} />
            <strong>Dashboard</strong>
          </div>

          <div className="topbar-right">
            <div className="system-status" title="Backend API connection status">
              <span className={`online-dot ${apiStatus === 'Connected' ? 'api-connected' : apiStatus === 'Checking' ? 'api-checking' : 'api-offline'}`} />
              API: {apiStatus}
            </div>

            <div className="system-status" title="Dataset upload status">
              Dataset: {uploadStatus}
            </div>

            <button className="icon-button" aria-label="Help" title="Help">
              <CircleHelp size={19} />
            </button>

            <button
              className="icon-button"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={19} />
            </button>

            <div className="profile">
              <div className="avatar">EC</div>
              <div className="profile-text">
                <strong>EconoCausal</strong>
                <small>Project workspace</small>
              </div>
            </div>
          </div>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span />
              CAUSAL INTELLIGENCE PLATFORM
            </div>
            <h1>Welcome to <span>EconoCausal</span></h1>
            <p>
              Explore your data, understand causal relationships,
              and prepare for better-informed decisions.
            </p>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-glow" />
            <div className="hero-message">
              <span>Better data.</span>
              <span>Deeper insights.</span>
              <span>Real impact.</span>
            </div>
          </div>
        </section>

        {/* Existing dashboard cards */}
        <section className="stats-grid">
          <article className="stat-card blue">
            <div className="stat-top">
              <span className="stat-icon">
                <FileSpreadsheet size={22} />
              </span>
              <span className="stat-arrow">
                <ChevronRight size={17} />
              </span>
            </div>
            <p>Dataset</p>
            <h2>{fileName ? 'Selected' : 'Not uploaded'}</h2>
            <small>{fileName || 'Upload a CSV to get started'}</small>
          </article>

          <article className="stat-card cyan">
            <div className="stat-top">
              <span className="stat-icon">
                <ShieldCheck size={22} />
              </span>
              <span className="stat-arrow">
                <ChevronRight size={17} />
              </span>
            </div>
            <p>Data validation</p>
            <h2>{headers.length ? 'Loaded' : 'Pending'}</h2>
            <small>
              {headers.length
                ? `${headers.length} columns detected`
                : 'Waiting for dataset'}
            </small>
          </article>

          <article className="stat-card purple">
            <div className="stat-top">
              <span className="stat-icon">
                <Workflow size={22} />
              </span>
              <span className="stat-arrow">
                <ChevronRight size={17} />
              </span>
            </div>
            <p>Causal analysis</p>
            <h2>Not started</h2>
            <small>{apiStatus === "Connected" ? "API connected; analysis endpoint not yet available" : "Connect the backend API to enable analysis"}</small>
          </article>

          <article className="stat-card amber">
            <div className="stat-top">
              <span className="stat-icon">
                <BarChart3 size={22} />
              </span>
              <span className="stat-arrow">
                <ChevronRight size={17} />
              </span>
            </div>
            <p>Budget allocation</p>
            <h2>Not available</h2>
            <small>Waiting for optimization functionality</small>
          </article>

          {/* Day 4: Dataset summary cards */}
          <article className="stat-card blue">
            <div className="stat-top">
              <span className="stat-icon">
                <Database size={22} />
              </span>
            </div>
            <p>Total Rows</p>
            <h2>{totalRows.toLocaleString()}</h2>
            <small>Rows in uploaded dataset</small>
          </article>

          <article className="stat-card cyan">
            <div className="stat-top">
              <span className="stat-icon">
                <FileSpreadsheet size={22} />
              </span>
            </div>
            <p>Total Columns</p>
            <h2>{totalColumns}</h2>
            <small>Columns detected</small>
          </article>

          <article className="stat-card amber">
            <div className="stat-top">
              <span className="stat-icon">
                <ShieldCheck size={22} />
              </span>
            </div>
            <p>Missing Values</p>
            <h2>{displayedMissingValues.toLocaleString()}</h2>
            <small>Blank cells · {summaryStatus}</small>
          </article>
        </section>

        <section className="work-grid" id="upload">
          <article className="panel upload-panel">
            <div className="panel-heading">
              <div className="panel-title-icon">
                <UploadCloud size={23} />
              </div>
              <div className="panel-title-copy">
                <h2>Upload your dataset</h2>
                <p>Select a CSV file to begin data preparation.</p>
              </div>
              <span className="step-badge">STEP 01</span>
            </div>

            <label
              className={`dropzone ${dragging ? 'dragging' : ''}`}
              onDragOver={event => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={event => {
                event.preventDefault()
                setDragging(false)
                processFile(event.dataTransfer.files[0])
              }}
            >
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={event => {
                  processFile(event.target.files[0])
                  event.target.value = ''
                }}
              />

              <span className="drop-icon">
                <UploadCloud size={31} />
              </span>
              <strong>Choose a CSV file</strong>
              <span className="drop-description">
                Click to browse or drag and drop your file here
              </span>
              <span className="file-rules">
                <FileText size={14} /> CSV format <i /> Local preview
              </span>
            </label>

            {fileName && (
              <div className="file-selected">
                <CheckCircle2 size={18} />
                <span>
                  <strong>{fileName}</strong>
                  <small>
                    {isSyntheticDataset
                      ? 'Synthetic / demo dataset'
                      : 'Dataset selected; source not verified'}
                  </small>
                </span>
                <button
                  className="remove-file"
                  onClick={removeFile}
                  aria-label="Remove selected file"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {error && (
              <p className="error-message" role="alert">{error}</p>
            )}

            {isLoading && (
              <p role="status">Reading your CSV file...</p>
            )}

            <p className="privacy-note">
              <ShieldCheck size={15} />
              Your file is previewed locally in this browser. Do not upload
              sensitive or private customer data unless the location is
              approved by your team.
            </p>
          </article>

          <article className="panel preview-panel" id="preview">
            <div className="panel-heading">
              <div className="panel-title-icon cyan-icon">
                <Database size={23} />
              </div>
              <div className="panel-title-copy">
                <h2>Dataset Preview</h2>
                <p>Review your uploaded CSV data below.</p>
              </div>
              <span className="step-badge">STEP 02</span>
            </div>

            {fileName && (
              <p className="privacy-note">
                {isSyntheticDataset
                  ? 'Synthetic / demo data: use for interface and pipeline testing, not as verified real-world evidence.'
                  : 'Dataset source has not been verified. Check its origin before interpreting analysis results.'}
              </p>
            )}

            <div className="table-toolbar">
              <div className="search-box">
                <Search size={17} />
                <input
                  type="search"
                  placeholder="Search in dataset..."
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  aria-label="Search in dataset"
                />
              </div>
              <span className="row-count">
                {filteredRows.length.toLocaleString()} of{' '}
                {rows.length.toLocaleString()} rows
              </span>
            </div>

            {headers.length ? (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      {headers.map((header, index) => (
                        <th key={index}>
                          {header || `Column ${index + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.slice(0, 100).map((row, index) => (
                      <tr key={index}>
                        <td className="row-number">{index + 1}</td>
                        {headers.map((_, colIndex) => (
                          <td key={colIndex}>
                            {row[colIndex] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredRows.length > 100 && (
                  <p className="table-note">
                    Showing the first 100 matching rows.
                  </p>
                )}

                {filteredRows.length === 0 && (
                  <p className="table-note">No matching rows found.</p>
                )}
              </div>
            ) : (
              <div className="empty-table">
                <div className="database-illustration">
                  <Database size={35} />
                </div>
                <strong>No data to display</strong>
                <p>Upload a CSV file to see your dataset preview here.</p>
              </div>
            )}
          </article>
        </section>

              <DatasetCharts headers={headers} rows={rows} />

        <section className="panel causal-results-panel" id="analysis">
          <div className="causal-results-heading">
            <div className="panel-title-icon">
              <Activity size={23} />
            </div>
            <div>
              <h2>Causal Results</h2>
              <p>
                Review treatment effects and model diagnostics when the
                causal analysis pipeline is connected.
              </p>
            </div>
            <span className="step-badge">STEP 03</span>
          </div>

          
<CausalAnalysisPanel
  headers={headers}
  rows={rows}
  apiStatus={apiStatus}
/>


          <div className="causal-results-notice">
            <Activity size={18} />
            <p>
              No causal estimates are available yet. Actual results will
              appear after the causal model is connected and validated.
            </p>
          </div>
        </section>
       

<section className="panel" id="budget" style={{ marginTop: 20 }}>
  <div className="panel-heading">
    <div className="panel-title-icon">
      <BarChart3 size={23} />
    </div>

    <div className="panel-title-copy">
      <h2>Budget Allocation</h2>
      <p>
        Enter a marketing budget to prepare an allocation scenario.
        Actual recommendations require the connected optimization model.
      </p>
    </div>

    <span className="step-badge">UI PREVIEW</span>
  </div>

  <BudgetAllocationPreview />
</section>


        <section className="panel" id="settings" style={{ marginTop: 20 }}>
          <div className="panel-heading">
            <div className="panel-title-icon">
              <Settings size={23} />
            </div>
            <div className="panel-title-copy">
              <h2>Workspace Settings</h2>
              <p>Project interface and workspace information.</p>
            </div>
          </div>
          <p className="privacy-note">
            EconoCausal · Smart Automation · Team 27
          </p>
        </section>

        <p className="privacy-note">
          <ShieldCheck size={15} />
          Decision-support outputs depend on data quality, model assumptions
          and validation. This dashboard does not present placeholder content
          as verified causal findings.
        </p>

        <footer className="footer">
          <span>© 2026 EconoCausal <i /> 27</span>
          <span>
            Smart Automation <i /> Causal Intelligence <i /> Better Decisions
          </span>
        </footer>
      </main>
    </div>
  )
}

export default App
