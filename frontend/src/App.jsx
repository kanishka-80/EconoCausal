import { useState } from 'react'
import './App.css'

function App() {
  const [fileName, setFileName] = useState('')

  function handleFileChange(event) {
    const file = event.target.files[0]
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      setFileName(file.name)
    } else if (file) {
      alert('Please select a CSV file.')
      event.target.value = ''
      setFileName('')
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>EconoCausal</h2>
        <p className="side-label">WORKSPACE</p>
        <nav>
          <a className="active" href="#dashboard">▦ Dashboard</a>
          <a href="#upload">↑ Upload Dataset</a>
          <a href="#analysis">⌁ Causal Analysis</a>
          <a href="#results">▤ Results</a>
          <a href="#settings">⚙ Settings</a>
        </nav>
        <div className="sidebar-footer">Brainbyte · Frontend</div>
      </aside>

      <main className="main" id="dashboard">
        <header className="topbar">
          <span>Smart Automation / EconoCausal</span>
          <span className="status">● Week 1 · Development</span>
        </header>

        <section className="welcome">
          <p className="eyebrow">CAUSAL INTELLIGENCE PLATFORM</p>
          <h1>Welcome to EconoCausal</h1>
          <p>Explore your data and prepare it for causal analysis.</p>
        </section>

        <section className="stats">
          <article className="stat-card">
            <span>Dataset</span>
            <h2>{fileName ? 'Selected' : 'Not uploaded'}</h2>
            <p>{fileName || 'Upload a CSV to get started'}</p>
          </article>
          <article className="stat-card">
            <span>Data validation</span>
            <h2>Pending</h2>
            <p>Waiting for dataset</p>
          </article>
          <article className="stat-card">
            <span>Causal analysis</span>
            <h2>Not started</h2>
            <p>Available after data preparation</p>
          </article>
        </section>

        <section className="panel" id="upload">
          <div className="panel-heading">
            <div>
              <h2>Upload your dataset</h2>
              <p>Select a CSV file to begin data preparation.</p>
            </div>
            <span className="step-badge">STEP 01</span>
          </div>

          <label className="upload-area">
            <span className="upload-icon">↑</span>
            <strong>Choose a CSV file</strong>
            <span>Click here to browse files on your computer</span>
            <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
          </label>

          {fileName && <p className="file-success">✓ Selected: {fileName}</p>}
        </section>

        <section className="panel" id="analysis">
          <h2>Analysis workspace</h2>
          <p className="muted">Your data summary, causal results and charts will appear here when the analysis features are connected.</p>
          <div className="empty-state">📊<br />Your analysis workspace is ready</div>
        </section>

        <footer>© 2026 EconoCausal · Brainbyte Team</footer>
      </main>
    </div>
  )
}

export default App