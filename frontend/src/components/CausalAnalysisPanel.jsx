import { useState, useMemo, lazy, Suspense } from 'react'
import { runCausalAnalysis } from '../services/api'
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Filter,
  Info,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react'

const Plot = lazy(() => import('react-plotly.js'))

const getStatusClass = (status) => {
  const value = String(status || '').toLowerCase()
  if (value.includes('pass') || value.includes('complete') || value.includes('success')) return 'success'
  if (value.includes('fail') || value.includes('error')) return 'danger'
  if (value.includes('warning')) return 'warning'
  if (value.includes('skip') || value.includes('not_applicable')) return 'muted'
  return 'pending'
}

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return 'Not provided'
  if (typeof value === 'number' && !Number.isFinite(value)) return 'Not available'
  return typeof value === 'number' ? value.toFixed(4) : String(value)
}

export default function CausalAnalysisPanel({ headers = [], rows = [], apiStatus }) {
  const [activeTab, setActiveTab] = useState('Configure')
  const [treatment, setTreatment] = useState('')
  const [outcome, setOutcome] = useState('')
  const [confounders, setConfounders] = useState([])
  const [confounderSearch, setConfounderSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const tabs = [
    { id: 'Configure', label: 'Configure', icon: SlidersIcon },
    { id: 'Overview', label: 'Overview', icon: TrendingUp },
    { id: 'Treatment Effects', label: 'Treatment Effects', icon: BarChart2 },
    { id: 'Diagnostics', label: 'Diagnostics', icon: ShieldCheck }
  ]

  function SlidersIcon(props) {
    return <Filter {...props} />
  }

  const toggleConfounder = (column) => {
    setConfounders((current) =>
      current.includes(column)
        ? current.filter((item) => item !== column)
        : [...current, column],
    )
  }

  const changeTreatment = (value) => {
    setTreatment(value)
    setConfounders((current) => current.filter((item) => item !== value))
  }

  const changeOutcome = (value) => {
    setOutcome(value)
    setConfounders((current) => current.filter((item) => item !== value))
  }

  const availableConfounders = useMemo(() => {
    return headers.filter(
      (column) =>
        column !== treatment &&
        column !== outcome &&
        !['user_id', 'customer_id', 'id'].includes(column.toLowerCase()),
    )
  }, [headers, treatment, outcome])

  const filteredConfounders = useMemo(() => {
    if (!confounderSearch.trim()) return availableConfounders
    return availableConfounders.filter((c) =>
      c.toLowerCase().includes(confounderSearch.toLowerCase()),
    )
  }, [availableConfounders, confounderSearch])

  const selectAllConfounders = () => {
    setConfounders([...availableConfounders])
  }

  const deselectAllConfounders = () => {
    setConfounders([])
  }

  const analyze = async () => {
    if (loading) return
    setError('')
    setResult(null)

    if (apiStatus !== 'Connected') {
      setError('Backend is not connected. Please ensure the backend server is running.')
      return
    }

    if (!treatment || !outcome || treatment === outcome) {
      setError('Please select different treatment and outcome columns.')
      return
    }

    if (confounders.length === 0) {
      setError('Please select at least one confounder variable.')
      return
    }

    setLoading(true)

    try {
      const response = await runCausalAnalysis({
        treatment_column: treatment,
        outcome_column: outcome,
        confounders,
      })

      if (!response?.data || typeof response.data !== 'object') {
        throw new Error('The backend did not return a valid analysis response.')
      }

      setResult(response.data)
      setActiveTab('Overview')
    } catch (err) {
      setError(err.message || 'The causal analysis could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  const ate = result?.ate_summary
  const diagnostics = result?.diagnostics
  const checks = Array.isArray(diagnostics?.checks) ? diagnostics.checks : []
  const segments = Array.isArray(result?.segment_effects) ? result.segment_effects : []
  const warnings = Array.isArray(diagnostics?.warnings) ? diagnostics.warnings : []

  // Check if ATE has valid numerical bounds for Plotly chart
  const ateVal = typeof ate?.average_treatment_effect === 'number' ? ate.average_treatment_effect : null
  const ciLower = typeof ate?.confidence_interval_lower === 'number' ? ate.confidence_interval_lower : null
  const ciUpper = typeof ate?.confidence_interval_upper === 'number' ? ate.confidence_interval_upper : null

  return (
    <div className="ec-panel">
      {/* Intro Header */}
      <div className="ec-panel-intro">
        <div>
          <span className="ec-eyebrow">DOUBLE MACHINE LEARNING (ECONML)</span>
          <h3>Causal Inference Engine</h3>
          <p>Estimate true causal uplift, isolate treatment effects from confounding bias, and inspect robustness tests.</p>
        </div>

        <span className={`ec-connection ${apiStatus === 'Connected' ? 'online' : 'offline'}`}>
          <span />
          {apiStatus === 'Connected' ? 'Backend Connected' : 'Backend Offline'}
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="ec-tabs" role="tablist" aria-label="Causal analysis sections">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="ec-alert error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Tab: CONFIGURE */}
      {activeTab === 'Configure' && (
        <div className="ec-tab-content">
          <div className="ec-section-heading">
            <div>
              <h4>Variable Configuration</h4>
              <p>Assign your intervention, target outcome, and conditioning confounders.</p>
            </div>
            <span className="ec-step-label">SETUP</span>
          </div>

          {headers.length === 0 ? (
            <div className="ec-empty-state">
              <Activity size={36} />
              <h4>No Dataset Uploaded</h4>
              <p>Upload a CSV file in the Upload &amp; Preview tab before configuring causal variables.</p>
            </div>
          ) : (
            <>
              <div className="ec-form-grid">
                <label className="ec-field">
                  <span>Treatment Variable (Intervention)</span>
                  <select value={treatment} onChange={(e) => changeTreatment(e.target.value)}>
                    <option value="">Choose treatment column (e.g. discount_offered)</option>
                    {headers.map((column) => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                  </select>
                  <small>The actionable policy variable or discount rate.</small>
                </label>

                <label className="ec-field">
                  <span>Outcome Variable (Target)</span>
                  <select value={outcome} onChange={(e) => changeOutcome(e.target.value)}>
                    <option value="">Choose outcome column (e.g. purchased, revenue)</option>
                    {headers.map((column) => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                  </select>
                  <small>The business KPI influenced by the treatment.</small>
                </label>
              </div>

              {/* Confounder Section with Search & Select-All */}
              <div className="ec-confounder-section">
                <div className="ec-section-heading">
                  <div>
                    <h4>Confounders &amp; Covariates (Pre-treatment controls)</h4>
                    <p>Features affecting both treatment assignment and the outcome.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="ec-count">{confounders.length} selected</span>
                    <button
                      type="button"
                      className="ec-secondary-button"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={selectAllConfounders}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      className="ec-secondary-button"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={deselectAllConfounders}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {availableConfounders.length > 0 && (
                  <div style={{ marginTop: '10px', marginBottom: '10px', maxWidth: '320px' }}>
                    <div className="search-box" style={{ height: '34px' }}>
                      <Search size={14} />
                      <input
                        type="search"
                        placeholder="Filter confounder columns..."
                        value={confounderSearch}
                        onChange={(e) => setConfounderSearch(e.target.value)}
                      />
                      {confounderSearch && (
                        <button type="button" onClick={() => setConfounderSearch('')} style={{ color: 'var(--text-muted)' }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {filteredConfounders.length > 0 ? (
                  <div className="ec-checkbox-grid">
                    {filteredConfounders.map((column) => (
                      <label className="ec-checkbox" key={column}>
                        <input
                          type="checkbox"
                          checked={confounders.includes(column)}
                          onChange={() => toggleConfounder(column)}
                        />
                        <span>{column}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="ec-muted-text">
                    {availableConfounders.length === 0
                      ? 'Select treatment and outcome variables first.'
                      : 'No matching columns found.'}
                  </p>
                )}
              </div>

              {/* Action Submit Row */}
              <div className="ec-action-row">
                <span className="ec-muted-text">
                  {rows.length.toLocaleString()} observations ready for orthogonalized DML estimation
                </span>
                <button
                  type="button"
                  className="ec-primary-button"
                  onClick={analyze}
                  disabled={loading || rows.length === 0}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Estimating Causal Effects...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Run Causal Analysis</span>
                    </>
                  )}
                </button>
              </div>

              {loading && (
                <div className="ec-loading" role="status" aria-live="polite">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <strong style={{ color: '#ffffff' }}>Executing Double Machine Learning Pipeline</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Fitting first-stage nuisance models, calculating cross-fitting residuals, and evaluating treatment effect estimates...
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: OVERVIEW */}
      {activeTab === 'Overview' && (
        <div className="ec-tab-content">
          {!result ? (
            <div className="ec-empty-state">
              <Activity size={36} />
              <h4>Analysis Not Executed Yet</h4>
              <p>Configure your treatment, outcome, and confounders, then run the estimation to inspect results.</p>
              <button
                type="button"
                className="ec-primary-button"
                style={{ marginTop: '16px' }}
                onClick={() => setActiveTab('Configure')}
              >
                Go to Configure
              </button>
            </div>
          ) : (
            <>
              {result.is_mock === true && (
                <div className="ec-alert warning" role="status">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Demo / Baseline Output Active</strong>
                      <p>
                        This is a baseline response from the backend scaffolding. Full EconML cross-fitted DML estimates will be active once connected to production solver models.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="ec-result-heading">
                <div>
                  <h4>Causal Estimation Overview</h4>
                  <p>Estimated causal impact of {treatment || 'treatment'} on {outcome || 'outcome'}.</p>
                </div>
                <span className={`ec-status ${getStatusClass(result.status)}`}>
                  {result.status || 'Complete'}
                </span>
              </div>

              {/* Primary Metric Grid */}
              <div className="ec-metric-grid">
                <div className="ec-metric-card">
                  <span>Average Treatment Effect (ATE)</span>
                  <strong>{formatNumber(ate?.average_treatment_effect)}</strong>
                  <small>{ate?.unit || 'Expected change per unit increase'}</small>
                </div>

                <div className="ec-metric-card">
                  <span>95% Confidence Interval</span>
                  <strong className="ec-metric-compact">
                    {ciLower != null && ciUpper != null
                      ? `[${formatNumber(ciLower)}, ${formatNumber(ciUpper)}]`
                      : 'Not provided'}
                  </strong>
                  <small>Backend reported interval</small>
                </div>

                <div className="ec-metric-card">
                  <span>Sample Size</span>
                  <strong>
                    {result.metadata?.sample_size != null
                      ? Number(result.metadata.sample_size).toLocaleString()
                      : rows.length.toLocaleString()}
                  </strong>
                  <small>Observations analyzed</small>
                </div>
              </div>

              {/* Effect Confidence Interval Forest Visualization with Plotly */}
              {ateVal !== null && ciLower !== null && ciUpper !== null && (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    marginTop: '4px'
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Treatment Effect Forest Plot</h5>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Point estimate with 95% confidence interval bounds. Dotted vertical line represents zero effect (null hypothesis).
                    </p>
                  </div>
                  <Suspense fallback={<div className="ec-muted-text">Rendering effect diagram...</div>}>
                    <Plot
                      data={[
                        {
                          x: [ateVal],
                          y: ['Estimated ATE'],
                          error_x: {
                            type: 'data',
                            symmetric: false,
                            array: [ciUpper - ateVal],
                            arrayminus: [ateVal - ciLower],
                            color: '#38bdf8',
                            thickness: 2.5,
                            width: 10
                          },
                          type: 'scatter',
                          mode: 'markers',
                          marker: {
                            color: '#38bdf8',
                            size: 14,
                            symbol: 'diamond'
                          },
                          name: 'ATE'
                        }
                      ]}
                      layout={{
                        autosize: true,
                        height: 160,
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent',
                        margin: { l: 120, r: 40, t: 20, b: 40 },
                        xaxis: {
                          title: { text: 'Causal Effect Size', font: { color: '#94a3b8', size: 12 } },
                          tickfont: { color: '#64748b' },
                          gridcolor: 'rgba(255, 255, 255, 0.05)',
                          zeroline: true,
                          zerolinecolor: 'rgba(244, 63, 94, 0.6)',
                          zerolinewidth: 2
                        },
                        yaxis: {
                          tickfont: { color: '#cbd5e1', size: 12 }
                        },
                        showlegend: false
                      }}
                      config={{ responsive: true, displayModeBar: false }}
                      style={{ width: '100%', height: 160 }}
                      useResizeHandler
                    />
                  </Suspense>
                </div>
              )}

              {/* Detail Cards */}
              <div className="ec-detail-grid">
                <div className="ec-detail-card">
                  <span>Run ID</span>
                  <strong>{result.run_id || 'N/A'}</strong>
                </div>
                <div className="ec-detail-card">
                  <span>Estimator Algorithm</span>
                  <strong>{result.estimator_used || 'EconML LinearDML'}</strong>
                </div>
                <div className="ec-detail-card">
                  <span>Treatment Variable</span>
                  <strong>{treatment || 'Not available'}</strong>
                </div>
                <div className="ec-detail-card">
                  <span>Outcome Variable</span>
                  <strong>{outcome || 'Not available'}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: TREATMENT EFFECTS */}
      {activeTab === 'Treatment Effects' && (
        <div className="ec-tab-content">
          <div className="ec-section-heading">
            <div>
              <h4>Heterogeneous &amp; Segment Treatment Effects</h4>
              <p>Subgroup sensitivity and conditional average treatment effects (CATE).</p>
            </div>
          </div>

          {!result ? (
            <div className="ec-empty-state">
              <BarChart2 size={36} />
              <h4>No Treatment Effects Available</h4>
              <p>Run a causal estimation first to view segment-level heterogeneous effects.</p>
            </div>
          ) : segments.length > 0 ? (
            <>
              {/* Plotly Segment Comparison Chart */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                  Segment Effect Comparison
                </h5>
                <Suspense fallback={<div className="ec-muted-text">Rendering segment chart...</div>}>
                  <Plot
                    data={[
                      {
                        x: segments.map((s) => s.segment_name || 'Segment'),
                        y: segments.map((s) => Number(s.estimated_effect) || 0),
                        type: 'bar',
                        marker: {
                          color: segments.map((s) =>
                            (Number(s.estimated_effect) || 0) >= 0 ? '#10b981' : '#f43f5e',
                          ),
                          opacity: 0.85
                        }
                      }
                    ]}
                    layout={{
                      autosize: true,
                      height: 240,
                      paper_bgcolor: 'transparent',
                      plot_bgcolor: 'transparent',
                      margin: { l: 50, r: 20, t: 20, b: 45 },
                      xaxis: {
                        tickfont: { color: '#94a3b8' },
                        gridcolor: 'rgba(255, 255, 255, 0.05)'
                      },
                      yaxis: {
                        title: { text: 'Estimated Uplift Effect', font: { color: '#94a3b8', size: 11 } },
                        tickfont: { color: '#64748b' },
                        gridcolor: 'rgba(255, 255, 255, 0.05)',
                        zeroline: true,
                        zerolinecolor: 'rgba(255, 255, 255, 0.2)'
                      },
                      showlegend: false
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: '100%', height: 240 }}
                    useResizeHandler
                  />
                </Suspense>
              </div>

              {/* Segment Table */}
              <div className="table-scroll">
                <table className="ec-table">
                  <thead>
                    <tr>
                      <th>Segment Name</th>
                      <th>Estimated Effect</th>
                      <th>Sample Size</th>
                      <th>Effect Direction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segments.map((segment, index) => {
                      const eff = Number(segment.estimated_effect)
                      const isPositive = Number.isFinite(eff) && eff >= 0
                      return (
                        <tr key={`${segment.segment_name}-${index}`}>
                          <td style={{ fontWeight: 600, color: '#ffffff' }}>
                            {segment.segment_name || 'Unnamed segment'}
                          </td>
                          <td style={{ color: isPositive ? '#34d399' : '#fda4af', fontWeight: 600 }}>
                            {formatNumber(segment.estimated_effect)}
                          </td>
                          <td>
                            {segment.sample_size != null
                              ? Number(segment.sample_size).toLocaleString()
                              : 'Not provided'}
                          </td>
                          <td>
                            <span className={`ec-status ${isPositive ? 'success' : 'danger'}`}>
                              {isPositive ? 'Positive Uplift' : 'Negative Uplift'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="ec-empty-state">
              <Info size={30} />
              <h4>No Subgroup Effects Reported</h4>
              <p>The backend returned aggregate ATE only. Segment-level effects were not configured for this run.</p>
            </div>
          )}

          {result?.is_mock === true && (
            <p className="ec-footnote">
              Note: Segment effects are demo/baseline outputs until production DML models are fully synchronized.
            </p>
          )}
        </div>
      )}

      {/* Tab: DIAGNOSTICS */}
      {activeTab === 'Diagnostics' && (
        <div className="ec-tab-content">
          <div className="ec-section-heading">
            <div>
              <h4>Model Robustness &amp; Refutation Diagnostics</h4>
              <p>Validate the unconfoundedness assumption with placebos, random common causes, and subset refutations.</p>
            </div>
          </div>

          {!result ? (
            <div className="ec-empty-state">
              <ShieldCheck size={36} />
              <h4>Diagnostics Unavailable</h4>
              <p>Run a causal estimation to inspect refutation checks and model health.</p>
            </div>
          ) : (
            <>
              {/* Refutation Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                    OVERALL REFUTATION STATUS
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
                    {diagnostics?.refutation_status || 'Under Evaluation'}
                  </h3>
                </div>
                <span className={`ec-status ${getStatusClass(diagnostics?.refutation_status)}`}>
                  {diagnostics?.refutation_status || 'Pending'}
                </span>
              </div>

              {/* Individual Checks */}
              {checks.length > 0 ? (
                <div className="ec-diagnostic-list">
                  {checks.map((check, index) => (
                    <div className="ec-diagnostic-item" key={`${check.check_name}-${index}`}>
                      <div>
                        <strong>{check.check_name || 'Validation check'}</strong>
                        {check.details && <p>{check.details}</p>}
                      </div>
                      <span className={`ec-status ${getStatusClass(check.status)}`}>
                        {check.status || 'Complete'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ec-empty-state">
                  <p>No individual diagnostic checks were returned by the backend.</p>
                </div>
              )}

              {/* Warnings List */}
              {warnings.length > 0 && (
                <div className="ec-warning-list">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertTriangle size={16} color="#fbbf24" />
                    <h4>Diagnostics Warnings</h4>
                  </div>
                  {warnings.map((warning, index) => (
                    <p key={index} style={{ marginBottom: '4px' }}>• {String(warning)}</p>
                  ))}
                </div>
              )}

              {result.is_mock === true && (
                <div className="ec-alert warning">
                  Diagnostic pipeline integration is pending. Do not interpret placeholder diagnostic checks as verified causal validity.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
