import { useState } from 'react'
import {
  Activity, BarChart3, Bell, CheckCircle2, ChevronRight,
  CircleHelp, CloudUpload, Database, FileSpreadsheet, FileText,
  Gauge, Home, LayoutDashboard, Search, Settings, ShieldCheck,
  Sparkles, UploadCloud, Workflow, X
} from 'lucide-react'
import './App.css'

function App() {
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState([])
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  function parseCSVLine(line) {
    const values = []
    let value = ''
    let quoted = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          value += '"'
          i++
        } else {
          quoted = !quoted
        }
      } else if (char === ',' && !quoted) {
        values.push(value.trim())
        value = ''
      } else {
        value += char
      }
    }

    values.push(value.trim())
    return values
  }

  function processFile(file) {
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please choose a valid CSV file.')
      return
    }

    setError('')
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const content = String(event.target.result || '')
        const lines = content.split(/\r?\n/).filter(line => line.trim())

        if (lines.length < 2) {
          setError('This file is empty or has no data rows.')
          return
        }

        const columns = parseCSVLine(lines[0])
        const data = lines.slice(1).map(parseCSVLine)

        setFileName(file.name)
        setHeaders(columns)
        setRows(data)
        setSearch('')
      } catch {
        setError('Unable to read this CSV file.')
      }
    }

    reader.onerror = () => setError('Unable to read this file.')
    reader.readAsText(file)
  }

  const filteredRows = rows.filter(row =>
    row.some(cell =>
      String(cell ?? '').toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <span className="brand-mark"><Activity size={25} /></span>
          <span>
            <strong>EconoCausal</strong>
            <small>Causal Intelligence Platform</small>
          </span>
        </a>

        <div className="nav-section-label">WORKSPACE</div>
        <nav className="navigation">
          <a className="nav-link active" href="#dashboard">
            <LayoutDashboard size={19} /> <span>Dashboard</span>
          </a>
          <a className="nav-link" href="#upload">
            <CloudUpload size={19} /> <span>Upload Dataset</span>
          </a>
          <a className="nav-link" href="#analysis">
            <Workflow size={19} /> <span>Causal Analysis</span>
          </a>
          <a className="nav-link" href="#results">
            <BarChart3 size={19} /> <span>Results</span>
          </a>
          <a className="nav-link" href="#settings">
            <Settings size={19} /> <span>Settings</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="team-icon"><Sparkles size={20} /></div>
          <div>
            <strong>team 27</strong>
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
            <div className="system-status">
              <span className="online-dot" /> System workspace
            </div>
            <button className="icon-button" aria-label="Help" title="Help">
              <CircleHelp size={19} />
            </button>
            <button className="icon-button" aria-label="Notifications" title="Notifications">
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
            <div className="eyebrow"><span /> CAUSAL INTELLIGENCE PLATFORM</div>
            <h1>Welcome to <span>EconoCausal</span></h1>
            <p>Turn your data into causal insights with modern analytics.</p>
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

        <section className="stats-grid">
          <article className="stat-card blue">
            <div className="stat-top">
              <span className="stat-icon"><FileSpreadsheet size={22} /></span>
              <span className="stat-arrow"><ChevronRight size={17} /></span>
            </div>
            <p>Dataset</p>
            <h2>{fileName ? 'Selected' : 'Not uploaded'}</h2>
            <small>{fileName || 'Upload a CSV to get started'}</small>
          </article>

          <article className="stat-card cyan">
            <div className="stat-top">
              <span className="stat-icon"><ShieldCheck size={22} /></span>
              <span className="stat-arrow"><ChevronRight size={17} /></span>
            </div>
            <p>Data validation</p>
            <h2>{headers.length ? 'Loaded' : 'Pending'}</h2>
            <small>{headers.length ? `${headers.length} columns detected` : 'Waiting for dataset'}</small>
          </article>

          <article className="stat-card purple">
            <div className="stat-top">
              <span className="stat-icon"><Workflow size={22} /></span>
              <span className="stat-arrow"><ChevronRight size={17} /></span>
            </div>
            <p>Causal analysis</p>
            <h2>Not started</h2>
            <small>Available after data preparation</small>
          </article>

          <article className="stat-card amber">
            <div className="stat-top">
              <span className="stat-icon"><BarChart3 size={22} /></span>
              <span className="stat-arrow"><ChevronRight size={17} /></span>
            </div>
            <p>Results</p>
            <h2>Not available</h2>
            <small>Complete analysis to view results</small>
          </article>
        </section>

        <section className="work-grid">
          <article className="panel upload-panel" id="upload">
            <div className="panel-heading">
              <div className="panel-title-icon"><UploadCloud size={23} /></div>
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
                onChange={event => processFile(event.target.files[0])}
              />
              <span className="drop-icon"><UploadCloud size={31} /></span>
              <strong>Choose a CSV file</strong>
              <span className="drop-description">Click to browse or drag and drop your file here</span>
              <span className="file-rules"><FileText size={14} /> CSV format <i /> Local preview</span>
            </label>

            {fileName && (
              <div className="file-selected">
                <CheckCircle2 size={18} />
                <span><strong>{fileName}</strong><small>Ready for preview</small></span>
                <button
                  className="remove-file"
                  onClick={() => {
                    setFileName('')
                    setHeaders([])
                    setRows([])
                    setSearch('')
                    setError('')
                  }}
                  aria-label="Remove selected file"
                ><X size={17} /></button>
              </div>
            )}

            {error && <p className="error-message">{error}</p>}
            <p className="privacy-note"><ShieldCheck size={15} /> Your file is previewed locally in this browser.</p>
          </article>

          <article className="panel preview-panel" id="results">
            <div className="panel-heading">
              <div className="panel-title-icon cyan-icon"><Database size={23} /></div>
              <div className="panel-title-copy">
                <h2>Dataset Preview</h2>
                <p>Review your uploaded CSV data below.</p>
              </div>
              <span className="step-badge">STEP 02</span>
            </div>

            <div className="table-toolbar">
              <div className="search-box">
                <Search size={17} />
                <input
                  type="search"
                  placeholder="Search in dataset..."
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                />
              </div>
              <span className="row-count">{filteredRows.length} of {rows.length} rows</span>
            </div>

            {headers.length ? (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      {headers.map((header, index) => (
                        <th key={index}>{header || `Column ${index + 1}`}</th>
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
                  <p className="table-note">Showing the first 100 matching rows.</p>
                )}
                {filteredRows.length === 0 && <p className="table-note">No matching rows found.</p>}
              </div>
            ) : (
              <div className="empty-table">
                <div className="database-illustration"><Database size={35} /></div>
                <strong>No data to display</strong>
                <p>Upload a CSV file to see your dataset preview here.</p>
              </div>
            )}
          </article>
        </section>

        <section className="panel analysis-panel" id="analysis">
          <div className="analysis-copy">
            <div className="panel-title-icon"><Activity size={23} /></div>
            <div>
              <h2>Analysis workspace</h2>
              <p>Your data summary, causal results and charts will appear here when the analysis features are connected.</p>
            </div>
          </div>
          <div className="analysis-visual" aria-hidden="true">
            <div className="chart-card">
              <div className="mini-bars">
                <i /><i /><i /><i /><i /><i />
              </div>
              <div className="mini-line"><Activity size={50} /></div>
            </div>
            <div className="analysis-caption">
              <strong>From data to decisions</strong>
              <p>Build a clearer understanding of your data and its relationships.</p>
            </div>
          </div>
        </section>

        <footer className="footer">
          <span>© 2026 EconoCausal <i /> Team 27</span>
          <span>Smart Automation <i /> Causal Intelligence <i /> Better Decisions</span>
        </footer>
      </main>
    </div>
  )
}

export default App