import { lazy, Suspense, useEffect, useState } from 'react'
import { parseCSVContent } from './utils/csv'
import {
  checkApiHealth,
  uploadDataset,
  getDatasetSummary,
  resetDataset
} from './services/api'
import CausalAnalysisPanel from './components/CausalAnalysisPanel'
import BudgetAllocationPanel from './components/BudgetAllocationPanel'

const DatasetInsights = lazy(() => import('./components/DatasetInsights'))
const Plot = lazy(() => import('react-plotly.js'))

import {
  Activity,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  CloudUpload,
  Cpu,
  Database,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
  Workflow,
  X
} from 'lucide-react'

import './App.css'

function DatasetCharts({ headers, rows }) {
  const numericColumns = headers
    .map((name, index) => ({
      name,
      index,
      values: rows.map((row) => String(row[index] ?? '').trim()),
    }))
    .filter((column) => {
      const valid = column.values.filter(
        (value) => value !== '' && Number.isFinite(Number(value))
      )
      return valid.length >= 2
    })
    .slice(0, 3)

  if (!rows.length) return null

  const chartColors = ['#38bdf8', '#818cf8', '#c084fc']

  return (
    <section className="panel" id="visualizations">
      <div className="panel-heading">
        <div className="panel-title-icon">
          <BarChart3 size={22} />
        </div>

        <div className="panel-title-copy">
          <h2>Dataset Feature Visualizations</h2>
          <p>Interactive exploratory distributions sampled from your uploaded CSV features.</p>
        </div>

        <span className="step-badge">LIVE METRICS</span>
      </div>

      {numericColumns.length === 0 ? (
        <div className="empty-table">
          <BarChart3 size={32} />
          <strong>No Numeric Features Found</strong>
          <p>Upload a CSV file containing numeric columns to generate distribution charts.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}
        >
          {numericColumns.map((column, idx) => {
            const points = rows
              .map((row, index) => ({
                x: index + 1,
                y: String(row[column.index] ?? '').trim(),
              }))
              .filter(
                (point) => point.y !== '' && Number.isFinite(Number(point.y))
              )
              .slice(0, 100)

            const accentColor = chartColors[idx % chartColors.length]

            return (
              <div
                key={column.index}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px',
                  minWidth: 0
                }}
              >
                <Suspense
                  fallback={
                    <div
                      role="status"
                      style={{
                        minHeight: 280,
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Rendering feature model...
                    </div>
                  }
                >
                  <Plot
                    data={[
                      {
                        x: points.map((p) => p.x),
                        y: points.map((p) => Number(p.y)),
                        type: 'bar',
                        marker: {
                          color: accentColor,
                          opacity: 0.85
                        },
                        name: column.name,
                      }
                    ]}
                    layout={{
                      title: {
                        text: column.name.toUpperCase(),
                        font: { size: 13, color: '#f8fafc', family: 'Inter, sans-serif' }
                      },
                      autosize: true,
                      paper_bgcolor: 'transparent',
                      plot_bgcolor: 'transparent',
                      margin: { l: 45, r: 15, t: 40, b: 35 },
                      xaxis: {
                        title: { text: 'Sample Index', font: { color: '#94a3b8', size: 11 } },
                        tickfont: { color: '#64748b' },
                        gridcolor: 'rgba(255, 255, 255, 0.04)'
                      },
                      yaxis: {
                        title: { text: column.name, font: { color: '#94a3b8', size: 11 } },
                        tickfont: { color: '#64748b' },
                        gridcolor: 'rgba(255, 255, 255, 0.04)'
                      },
                    }}
                    config={{
                      responsive: true,
                      displayModeBar: false
                    }}
                    style={{ width: '100%', height: 280 }}
                    useResizeHandler
                  />
                </Suspense>
              </div>
            )
          })}
        </div>
      )}

      <p className="privacy-note">
        <Sparkles size={14} style={{ color: 'var(--accent-blue)' }} />
        Showing dynamic feature distributions across up to 100 sample records.
      </p>
    </section>
  )
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [uploadTab, setUploadTab] = useState('preview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
  const [apiLatency, setApiLatency] = useState(null)

  const pageTitles = {
    dashboard: 'Dashboard',
    upload: 'Upload & Preview',
    analysis: 'Causal Results',
    budget: 'Budget Allocation',
    settings: 'Settings'
  }

  async function checkApi() {
    const start = performance.now()
    try {
      setApiStatus('Checking')
      await checkApiHealth()
      setApiStatus('Connected')
      setApiLatency(Math.round(performance.now() - start))
    } catch {
      setApiStatus('Offline')
      setApiLatency(null)
    }
  }

  useEffect(() => {
    let active = true

    async function initialCheck() {
      const start = performance.now()
      try {
        await checkApiHealth()
        if (active) {
          setApiStatus('Connected')
          setApiLatency(Math.round(performance.now() - start))
        }
      } catch {
        if (active) {
          setApiStatus('Offline')
          setApiLatency(null)
        }
      }
    }

    initialCheck()

    return () => {
      active = false
    }
  }, [])

  function processFile(file) {
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please choose a valid CSV file (.csv).')
      return
    }

    setError('')
    setIsLoading(true)
    setFileName('')
    setHeaders([])
    setRows([])
    setSearch('')
    setUploadTab('preview')
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
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
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

  async function removeFile() {
    setFileName('')
    setHeaders([])
    setRows([])
    setSearch('')
    setError('')
    setIsLoading(false)
    setBackendSummary(null)

    if (apiStatus !== 'Connected') {
      setUploadStatus('Local file removed; backend reset not confirmed')
      setSummaryStatus('Backend may still retain the previous dataset')
      return
    }

    setUploadStatus('Removing backend dataset...')

    try {
      await resetDataset()
      setUploadStatus('File removed; backend dataset reset')
      setSummaryStatus('Waiting for dataset')
    } catch {
      setUploadStatus('Local file removed; backend reset failed')
      setSummaryStatus('Backend may still retain the previous dataset')
      setError(
        'Local preview cleared, but backend reset failed. The backend may still retain the previous dataset.'
      )
    }
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

  const filteredRows = rows.filter((row) =>
    row.some((cell) =>
      String(cell ?? '').toLowerCase().includes(search.toLowerCase())
    )
  )

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload & Preview', icon: CloudUpload },
    { id: 'analysis', label: 'Causal Results', icon: Workflow },
    { id: 'budget', label: 'Budget Allocation', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const handleNavClick = (pageId) => {
    setActivePage(pageId)
    setMobileMenuOpen(false)
  }

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <button
          className="brand"
          type="button"
          onClick={() => handleNavClick('dashboard')}
        >
          <span className="brand-mark">
            <Activity size={24} />
          </span>
          <span>
            <strong>EconoCausal</strong>
            <small>Causal Intelligence Platform</small>
          </span>
        </button>

        <div className="nav-section-label">PLATFORM</div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Sidebar Pipeline Card */}
        <div className="sidebar-pipeline-card">
          <div className="pipeline-status-title">
            <span>PIPELINE ENGINE</span>
            <span
              className="online-dot"
              style={{
                background: apiStatus === 'Connected' ? '#10b981' : '#f43f5e'
              }}
            />
          </div>
          <div className="pipeline-steps">
            <div className="pipeline-step-item">
              <span className={`step-indicator-dot ${fileName ? 'success' : ''}`} />
              <span>1. Ingestion: {fileName ? 'Ready' : 'Pending'}</span>
            </div>
            <div className="pipeline-step-item">
              <span className={`step-indicator-dot ${fileName && apiStatus === 'Connected' ? 'active' : ''}`} />
              <span>2. Double ML: {apiStatus === 'Connected' ? 'Active' : 'Offline'}</span>
            </div>
            <div className="pipeline-step-item">
              <span className={`step-indicator-dot ${apiStatus === 'Connected' ? 'active' : ''}`} />
              <span>3. Optimizer: Knapsack</span>
            </div>
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="team-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <strong>Workspace 27</strong>
            <small>Enterprise Environment</small>
          </div>
          <span
            className={`online-dot ${
              apiStatus === 'Connected'
                ? 'api-connected'
                : apiStatus === 'Checking'
                ? 'api-checking'
                : 'api-offline'
            }`}
            title={`Backend API ${apiStatus}`}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>{pageTitles[activePage]}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <div className="system-status" title="Backend API status">
              <span
                className={`online-dot ${
                  apiStatus === 'Connected'
                    ? 'api-connected'
                    : apiStatus === 'Checking'
                    ? 'api-checking'
                    : 'api-offline'
                }`}
              />
              <span>API: <strong>{apiStatus}</strong></span>
              {apiLatency && <small style={{ color: 'var(--text-muted)' }}>({apiLatency}ms)</small>}
            </div>

            <div className="system-status" title={`Dataset status: ${uploadStatus}`}>
              <Database size={13} style={{ color: fileName ? '#38bdf8' : 'var(--text-muted)' }} />
              <span>Dataset: <strong>{fileName ? 'Loaded' : 'None'}</strong></span>
            </div>

            <button
              className="icon-button"
              aria-label="Help"
              title="Documentation &amp; Help"
              type="button"
              onClick={() => handleNavClick('settings')}
            >
              <CircleHelp size={18} />
            </button>

            <button
              className="icon-button"
              aria-label="Notifications"
              title="Notifications"
              type="button"
            >
              <Bell size={18} />
            </button>

            <div className="profile">
              <div className="avatar">EC</div>
              <div className="profile-text">
                <strong>EconoCausal</strong>
                <small>Team 27 Platform</small>
              </div>
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------------------
            PAGE 1: DASHBOARD
            ------------------------------------------------------------------ */}
        {activePage === 'dashboard' && (
          <div className="page-view">
            {/* Hero Section */}
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span />
                  DOUBLE MACHINE LEARNING &amp; DYNAMIC PRICING
                </div>

                <h1>
                  Welcome to <span>EconoCausal</span>
                </h1>

                <p>
                  Harness the power of orthogonalized Double Machine Learning (EconML) to estimate causal customer uplift, eliminate confounding bias, and optimize dynamic discount pricing under budget constraints.
                </p>

                <div className="hero-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleNavClick('upload')}
                  >
                    <CloudUpload size={16} />
                    <span>Upload CSV Dataset</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleNavClick('analysis')}
                  >
                    <Workflow size={16} />
                    <span>Run Causal Inference</span>
                  </button>
                </div>
              </div>

              <div className="hero-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <div className="hero-glow" />
                <div className="hero-message">
                  <span>Causal Estimation.</span>
                  <span>Heterogeneous Uplift.</span>
                  <span>Constrained Policy.</span>
                </div>
              </div>
            </section>

            {/* Primary Stats Grid */}
            <section className="stats-grid">
              <article
                className="stat-card blue"
                onClick={() => handleNavClick('upload')}
                style={{ cursor: 'pointer' }}
              >
                <div className="stat-top">
                  <span className="stat-icon">
                    <FileSpreadsheet size={22} />
                  </span>
                  <span className="stat-arrow">
                    <ChevronRight size={16} />
                  </span>
                </div>
                <p>Active Dataset</p>
                <h2>{fileName ? 'Loaded' : 'Not uploaded'}</h2>
                <small>{fileName || 'Upload CSV to initialize pipeline'}</small>
              </article>

              <article
                className="stat-card cyan"
                onClick={() => handleNavClick('upload')}
                style={{ cursor: 'pointer' }}
              >
                <div className="stat-top">
                  <span className="stat-icon">
                    <ShieldCheck size={22} />
                  </span>
                  <span className="stat-arrow">
                    <ChevronRight size={16} />
                  </span>
                </div>
                <p>Schema &amp; Health</p>
                <h2>{headers.length ? `${headers.length} Features` : 'Pending'}</h2>
                <small>
                  {headers.length
                    ? `${totalRows.toLocaleString()} rows verified`
                    : 'Awaiting CSV dataset'}
                </small>
              </article>

              <article
                className="stat-card purple"
                onClick={() => handleNavClick('analysis')}
                style={{ cursor: 'pointer' }}
              >
                <div className="stat-top">
                  <span className="stat-icon">
                    <Workflow size={22} />
                  </span>
                  <span className="stat-arrow">
                    <ChevronRight size={16} />
                  </span>
                </div>
                <p>Causal DML Engine</p>
                <h2>{apiStatus === 'Connected' ? 'Operational' : 'Offline'}</h2>
                <small>
                  {apiStatus === 'Connected'
                    ? 'Cross-fitting orthogonalization ready'
                    : 'Connect backend server to activate'}
                </small>
              </article>

              <article
                className="stat-card amber"
                onClick={() => handleNavClick('budget')}
                style={{ cursor: 'pointer' }}
              >
                <div className="stat-top">
                  <span className="stat-icon">
                    <BarChart3 size={22} />
                  </span>
                  <span className="stat-arrow">
                    <ChevronRight size={16} />
                  </span>
                </div>
                <p>Budget Allocation</p>
                <h2>{apiStatus === 'Connected' ? 'Ready' : 'Offline'}</h2>
                <small>
                  {apiStatus === 'Connected'
                    ? 'Knapsack uplift solver connected'
                    : 'Awaiting backend optimization engine'}
                </small>
              </article>
            </section>

            {/* Secondary Metric Cards */}
            <section className="micro-stats-grid">
              <div className="stat-card">
                <p>Total Sample Records</p>
                <h2>{totalRows.toLocaleString()}</h2>
                <small>Ingested into runtime memory</small>
              </div>

              <div className="stat-card">
                <p>Available Feature Columns</p>
                <h2>{totalColumns}</h2>
                <small>Detected from CSV schema</small>
              </div>

              <div className="stat-card">
                <p>Data Integrity Status</p>
                <h2>{displayedMissingValues === 0 ? 'Clean (0)' : `${displayedMissingValues.toLocaleString()} nulls`}</h2>
                <small>{summaryStatus}</small>
              </div>
            </section>

            {/* Dashboard Analytics Section */}
            <div className="dashboard-visuals-grid">
              {/* Left Column: Visual Model / Architecture Flow */}
              <div className="dashboard-pipeline-card">
                <div className="panel-heading" style={{ marginBottom: '16px' }}>
                  <div className="panel-title-icon">
                    <TrendingUp size={22} />
                  </div>
                  <div className="panel-title-copy">
                    <h2>Causal Pipeline Architecture</h2>
                    <p>End-to-end econometric estimation and constrained optimization workflow.</p>
                  </div>
                  <span className="step-badge">DML WORKFLOW</span>
                </div>

                <div className="architecture-steps-flow">
                  <div className="arch-step-box">
                    <span className="arch-step-number">STEP 01</span>
                    <strong>Data Ingestion</strong>
                    <p>CSV parsing, null imputation, confounder schema profiling.</p>
                  </div>

                  <div className="arch-step-box">
                    <span className="arch-step-number">STEP 02</span>
                    <strong>Double Machine Learning</strong>
                    <p>Orthogonal residuals via Cross-fitting nuisance models.</p>
                  </div>

                  <div className="arch-step-box">
                    <span className="arch-step-number">STEP 03</span>
                    <strong>Heterogeneous Uplift</strong>
                    <p>Individualized treatment effect scoring across discount tiers.</p>
                  </div>

                  <div className="arch-step-box">
                    <span className="arch-step-number">STEP 04</span>
                    <strong>Budget Solver</strong>
                    <p>Knapsack integer optimization for maximum aggregate return.</p>
                  </div>
                </div>

                {rows.length > 0 && headers.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Active Dataset Preview Snapshot</h4>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '4px 12px', fontSize: '11px' }}
                        onClick={() => handleNavClick('upload')}
                      >
                        Full Table View
                      </button>
                    </div>
                    <div className="table-scroll" style={{ maxHeight: '200px' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            {headers.slice(0, 6).map((h, i) => (
                              <th key={i}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, 5).map((row, rIdx) => (
                            <tr key={rIdx}>
                              <td className="row-number">{rIdx + 1}</td>
                              {headers.slice(0, 6).map((_, cIdx) => (
                                <td key={cIdx}>{row[cIdx] ?? ''}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: System Telemetry */}
              <div className="telemetry-card">
                <div className="panel-heading" style={{ marginBottom: '8px' }}>
                  <div className="panel-title-icon cyan-icon">
                    <Server size={22} />
                  </div>
                  <div className="panel-title-copy">
                    <h2>System Telemetry</h2>
                    <p>Connection &amp; engine health.</p>
                  </div>
                </div>

                <div className="telemetry-row">
                  <span className="telemetry-label">Backend API Status</span>
                  <span className="telemetry-value">
                    <span
                      className="online-dot"
                      style={{
                        background: apiStatus === 'Connected' ? '#10b981' : '#f43f5e'
                      }}
                    />
                    {apiStatus}
                  </span>
                </div>

                <div className="telemetry-row">
                  <span className="telemetry-label">API Health Latency</span>
                  <span className="telemetry-value">
                    {apiLatency ? `${apiLatency} ms` : 'N/A'}
                  </span>
                </div>

                <div className="telemetry-row">
                  <span className="telemetry-label">Causal Estimator</span>
                  <span className="telemetry-value">LinearDML (EconML)</span>
                </div>

                <div className="telemetry-row">
                  <span className="telemetry-label">Optimization Method</span>
                  <span className="telemetry-value">Greedy Uplift Knapsack</span>
                </div>

                <div className="telemetry-row">
                  <span className="telemetry-label">Active Workspace</span>
                  <span className="telemetry-value">Team 27 Platform</span>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={checkApi}
                  >
                    <RefreshCw size={14} />
                    <span>Ping Backend Health</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            PAGE 2: UPLOAD & PREVIEW
            ------------------------------------------------------------------ */}
        {activePage === 'upload' && (
          <div className="page-view">
            <div className="page-header">
              <span className="page-kicker">DATA INGESTION &amp; EXPLORATION</span>
              <h1 className="page-title">Upload &amp; Preview Dataset</h1>
              <p className="page-description">
                Upload your customer transaction CSV file to prepare features, inspect column distributions, and initialize causal analysis.
              </p>
            </div>

            <section className="work-grid" id="upload">
              {/* Upload Card */}
              <article className="panel upload-panel">
                <div className="panel-heading">
                  <div className="panel-title-icon">
                    <UploadCloud size={22} />
                  </div>
                  <div className="panel-title-copy">
                    <h2>Upload CSV Dataset</h2>
                    <p>Select your customer record CSV file to begin econometric processing.</p>
                  </div>
                  <span className="step-badge">INGESTION</span>
                </div>

                <label
                  className={`dropzone ${dragging ? 'dragging' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragging(false)
                    processFile(e.dataTransfer.files[0])
                  }}
                >
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      processFile(e.target.files[0])
                      e.target.value = ''
                    }}
                  />

                  <span className="drop-icon">
                    <UploadCloud size={32} />
                  </span>
                  <strong>Choose a CSV file or drag &amp; drop here</strong>
                  <span className="drop-description">
                    Supports high-dimensional datasets with customer ID, treatment flags, and confounding features
                  </span>
                  <span className="file-rules">
                    <FileText size={14} /> CSV UTF-8 <i /> In-browser Parsing <i /> Fast Memory Loading
                  </span>
                </label>

                {/* Selected File Card */}
                {fileName && (
                  <div className="file-selected">
                    <CheckCircle2 size={20} />
                    <span>
                      <strong>{fileName}</strong>
                      <small>
                        {totalRows.toLocaleString()} rows · {headers.length} columns detected ·{' '}
                        {isSyntheticDataset ? 'Synthetic Evaluation Dataset' : 'Verified Dataset'}
                      </small>
                    </span>
                    <button
                      className="remove-file"
                      onClick={removeFile}
                      aria-label="Remove selected file"
                      title="Clear dataset"
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {error && (
                  <p className="error-message" role="alert">
                    {error}
                  </p>
                )}

                {isLoading && (
                  <div className="ec-loading" role="status" style={{ marginTop: '16px' }}>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Parsing CSV and transmitting to backend memory cache...</span>
                  </div>
                )}

                <p className="privacy-note">
                  <ShieldCheck size={15} style={{ color: 'var(--accent-emerald)' }} />
                  Data is processed strictly in your local sandbox session. Do not upload sensitive PII without compliance approval.
                </p>
              </article>

              {/* Tabs Navigation for Preview, Graphs, Insights */}
              <div className="explore-tabs" role="tablist" aria-label="Dataset exploration sections">
                <button
                  type="button"
                  className={`explore-tab ${uploadTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setUploadTab('preview')}
                >
                  Data Preview
                </button>

                <button
                  type="button"
                  className={`explore-tab ${uploadTab === 'graphs' ? 'active' : ''}`}
                  onClick={() => setUploadTab('graphs')}
                >
                  Feature Graphs
                </button>

                <button
                  type="button"
                  className={`explore-tab ${uploadTab === 'insights' ? 'active' : ''}`}
                  onClick={() => setUploadTab('insights')}
                >
                  Automated Insights
                </button>
              </div>

              {/* Tab 1: Preview */}
              {uploadTab === 'preview' && (
                <article className="panel preview-panel" id="preview">
                  <div className="panel-heading">
                    <div className="panel-title-icon cyan-icon">
                      <Database size={22} />
                    </div>
                    <div className="panel-title-copy">
                      <h2>Dataset Spreadsheet Preview</h2>
                      <p>Inspect raw observations, search across features, and verify column types.</p>
                    </div>
                    <span className="step-badge">SCHEMA VERIFIED</span>
                  </div>

                  <div className="table-toolbar">
                    <div className="search-box">
                      <Search size={16} />
                      <input
                        type="search"
                        placeholder="Search in dataset records..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search dataset"
                      />
                      {search && (
                        <button type="button" onClick={() => setSearch('')} style={{ color: 'var(--text-muted)' }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <span className="row-count">
                      {filteredRows.length.toLocaleString()} of {rows.length.toLocaleString()} rows
                    </span>
                  </div>

                  {headers.length ? (
                    <div className="table-scroll">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            {headers.map((header, index) => (
                              <th key={index}>{header || `Col ${index + 1}`}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRows.slice(0, 100).map((row, index) => (
                            <tr key={index}>
                              <td className="row-number">{index + 1}</td>
                              {headers.map((_, colIndex) => (
                                <td key={colIndex}>{row[colIndex] ?? ''}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {filteredRows.length > 100 && (
                        <p className="table-note">
                          Displaying first 100 matching rows. {filteredRows.length.toLocaleString()} records available in active session.
                        </p>
                      )}

                      {filteredRows.length === 0 && (
                        <p className="table-note">No matching rows found for "{search}".</p>
                      )}
                    </div>
                  ) : (
                    <div className="empty-table">
                      <Database size={36} />
                      <strong>No Data to Display</strong>
                      <p>Upload a CSV dataset above to render the spreadsheet preview.</p>
                    </div>
                  )}
                </article>
              )}

              {/* Tab 2: Graphs */}
              {uploadTab === 'graphs' && (
                <div className="explore-content">
                  <DatasetCharts headers={headers} rows={rows} />
                </div>
              )}

              {/* Tab 3: Insights */}
              {uploadTab === 'insights' && (
                <div className="explore-content">
                  <Suspense
                    fallback={
                      <div className="panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Computing automated dataset insights...
                      </div>
                    }
                  >
                    <DatasetInsights headers={headers} rows={rows} />
                  </Suspense>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ------------------------------------------------------------------
            PAGE 3: CAUSAL RESULTS
            ------------------------------------------------------------------ */}
        {activePage === 'analysis' && (
          <div className="page-view">
            <div className="page-header">
              <span className="page-kicker">ECONOMETRIC INFERENCE</span>
              <h1 className="page-title">Causal Results &amp; Treatment Effects</h1>
              <p className="page-description">
                Estimate the unbiased Average Treatment Effect (ATE), segment heterogeneous uplifts (CATE), and execute refutation diagnostics using Double Machine Learning.
              </p>
            </div>

            <section className="panel" id="analysis">
              <CausalAnalysisPanel
                key={fileName}
                headers={headers}
                rows={rows}
                apiStatus={apiStatus}
              />
            </section>
          </div>
        )}

        {/* ------------------------------------------------------------------
            PAGE 4: BUDGET ALLOCATION
            ------------------------------------------------------------------ */}
        {activePage === 'budget' && (
          <div className="page-view">
            <div className="page-header">
              <span className="page-kicker">PORTFOLIO OPTIMIZATION</span>
              <h1 className="page-title">Dynamic Budget &amp; Discount Allocation</h1>
              <p className="page-description">
                Solve the integer programming knapsack problem to assign personalized discounts to the customers with the highest predicted causal uplift subject to your total budget constraint.
              </p>
            </div>

            <section className="panel" id="budget">
              <BudgetAllocationPanel
                key={fileName}
                headers={headers}
                rows={rows}
                apiStatus={apiStatus}
              />
            </section>
          </div>
        )}

        {/* ------------------------------------------------------------------
            PAGE 5: SETTINGS
            ------------------------------------------------------------------ */}
        {activePage === 'settings' && (
          <div className="page-view">
            <div className="page-header">
              <span className="page-kicker">CONFIGURATION</span>
              <h1 className="page-title">Platform &amp; Engine Settings</h1>
              <p className="page-description">
                Configure your API endpoints, DML solver parameters, dataset runtime cache, and application preferences.
              </p>
            </div>

            <div className="settings-grid">
              {/* Card 1: API & Server Diagnostics */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon">
                    <Server size={20} />
                  </div>
                  <div>
                    <h3>Backend API &amp; Server Connection</h3>
                    <p>Network connectivity to the Python FastAPI backend service.</p>
                  </div>
                </div>

                <div className="settings-card-body">
                  <div className="settings-row">
                    <span className="settings-row-label">Base API Endpoint</span>
                    <span className="settings-row-value">/api</span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">Health Status</span>
                    <span className="settings-row-value">
                      <span className={`ec-status ${apiStatus === 'Connected' ? 'success' : 'danger'}`}>
                        {apiStatus}
                      </span>
                    </span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">Round-trip Ping Latency</span>
                    <span className="settings-row-value">{apiLatency ? `${apiLatency} ms` : 'N/A'}</span>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={checkApi}
                  >
                    <RefreshCw size={14} />
                    <span>Test API Connection</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Dataset Cache Management */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.12)' }}>
                    <Database size={20} />
                  </div>
                  <div>
                    <h3>Dataset Runtime Memory</h3>
                    <p>Active dataset in-browser state and backend cache.</p>
                  </div>
                </div>

                <div className="settings-card-body">
                  <div className="settings-row">
                    <span className="settings-row-label">Active File</span>
                    <span className="settings-row-value">{fileName || 'None'}</span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">Upload State</span>
                    <span className="settings-row-value">{uploadStatus}</span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">Cached Records</span>
                    <span className="settings-row-value">{totalRows.toLocaleString()}</span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">Schema Columns</span>
                    <span className="settings-row-value">{totalColumns}</span>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', color: '#fda4af', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                    onClick={removeFile}
                    disabled={!fileName}
                  >
                    <X size={14} />
                    <span>Reset Dataset &amp; Cache</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Causal Inference Model Settings */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon" style={{ color: '#c084fc', background: 'rgba(168, 85, 247, 0.12)' }}>
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3>Causal Model Specifications</h3>
                    <p>Algorithmic parameters used for Double Machine Learning.</p>
                  </div>
                </div>

                <div className="settings-card-body">
                  <div className="settings-row">
                    <span className="settings-row-label">Primary Estimator</span>
                    <span className="settings-row-value">EconML LinearDML</span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">Cross-Fitting Folds</span>
                    <span className="settings-row-value">5 Folds (CV)</span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">Confidence Interval Level</span>
                    <span className="settings-row-value">95% (Two-sided)</span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">Nuisance Models</span>
                    <span className="settings-row-value">LassoCV / Random Forest</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Platform Credits & Architecture */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon" style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.12)' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3>Platform &amp; Architecture</h3>
                    <p>System details, library dependencies, and workspace info.</p>
                  </div>
                </div>

                <div className="settings-card-body">
                  <div className="settings-row">
                    <span className="settings-row-label">Platform Version</span>
                    <span className="settings-row-value">v1.0.0 Enterprise</span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">Frontend Framework</span>
                    <span className="settings-row-value">React 19 + Vite 8</span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">Visual Engine</span>
                    <span className="settings-row-value">Plotly.js WebGL</span>
                  </div>
                  <div className="settings-row">
                    <span className="settings-row-label">Engineering Workspace</span>
                    <span className="settings-row-value">Team 27</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Footer Note */}
        <p className="privacy-note" style={{ marginTop: '30px' }}>
          <ShieldCheck size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
          Decision-support outputs depend on unconfoundedness assumptions, data quality, and model validation. EconoCausal provides rigorous econometric estimates to empower data-driven pricing strategies.
        </p>

        <footer className="footer">
          <span>© 2026 EconoCausal Platform <i /> Team 27</span>
          <span>
            Smart Automation <i /> Double Machine Learning <i /> Causal Uplift Optimization
          </span>
        </footer>
      </main>
    </div>
  )
}

export default App
