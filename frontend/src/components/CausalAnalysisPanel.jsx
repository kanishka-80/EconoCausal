import { useState } from 'react'
import { runCausalAnalysis } from '../services/api'

const getStatusClass = (status) => {
  const value = String(status || '').toLowerCase()

  if (value.includes('pass') || value.includes('complete')) return 'success'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const tabs = ['Configure', 'Overview', 'Treatment Effects', 'Diagnostics']

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

  const analyze = async () => {
    if (loading) return
    setError('')
    setResult(null)

    if (apiStatus !== 'Connected') {
      setError('Backend is not connected. Please ensure the backend server is running.')
      return
    }

    if (!treatment || !outcome || treatment === outcome) {
      setError('Please select distinct columns for treatment and outcome.')
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
        throw new Error('Backend did not return a valid analysis response.')
      }

      setResult(response.data)
      setActiveTab('Overview')
    } catch (err) {
      setError(err.message || 'Failed to complete causal analysis.')
    } finally {
      setLoading(false)
    }
  }

  const ate = result?.ate_summary
  const diagnostics = result?.diagnostics
  const checks = Array.isArray(diagnostics?.checks) ? diagnostics.checks : []
  const segments = Array.isArray(result?.segment_effects)
    ? result.segment_effects
    : []
  const warnings = Array.isArray(diagnostics?.warnings)
    ? diagnostics.warnings
    : []

  const availableConfounders = headers.filter(
    (column) =>
      column !== treatment &&
      column !== outcome &&
      !['user_id', 'customer_id', 'id', 'revenue', 'net_profit'].includes(
        column.toLowerCase(),
      ),
  )

  return (
    <div className="ec-panel">
      <div className="ec-panel-intro">
        <div>
          <span className="ec-eyebrow">CAUSAL INFERENCE</span>
          <h3>Analysis Workspace</h3>
          <p>Configure your analysis and explore treatment effects and diagnostics.</p>
        </div>

        <span className={`ec-connection ${apiStatus === 'Connected' ? 'online' : 'offline'}`}>
          <span />
          {apiStatus === 'Connected' ? 'Backend connected' : 'Backend unavailable'}
        </span>
      </div>

      <div className="ec-tabs" role="tablist" aria-label="Causal analysis sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && <div className="ec-alert error" role="alert">{error}</div>}

      {activeTab === 'Configure' && (
        <div className="ec-tab-content">
          <div className="ec-section-heading">
            <div>
              <h4>Configure analysis</h4>
              <p>Select the variables that define your causal analysis.</p>
            </div>
            <span className="ec-step-label">STEP 01</span>
          </div>

          {headers.length === 0 ? (
            <div className="ec-empty-state">
              <h4>No dataset uploaded</h4>
              <p>Upload a CSV dataset first to configure the analysis.</p>
            </div>
          ) : (
            <>
              <div className="ec-form-grid">
                <label className="ec-field">
                  <span>Treatment variable</span>
                  <select value={treatment} onChange={(e) => changeTreatment(e.target.value)}>
                    <option value="">Select treatment column</option>
                    {headers.map((column) => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                  </select>
                  <small>The variable representing the treatment or intervention.</small>
                </label>

                <label className="ec-field">
                  <span>Outcome variable</span>
                  <select value={outcome} onChange={(e) => changeOutcome(e.target.value)}>
                    <option value="">Select outcome column</option>
                    {headers.map((column) => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                  </select>
                  <small>The result whose change you want to estimate.</small>
                </label>
              </div>

              <div className="ec-confounder-section">
                <div className="ec-section-heading">
                  <div>
                    <h4>Confounder variables</h4>
                    <p>Select at least one relevant pre-treatment variable.</p>
                  </div>
                  <span className="ec-count">{confounders.length} selected</span>
                </div>

                {availableConfounders.length > 0 ? (
                  <div className="ec-checkbox-grid">
                    {availableConfounders.map((column) => (
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
                  <p className="ec-muted-text">No additional columns available for selection.</p>
                )}
              </div>

              <div className="ec-action-row">
                <span className="ec-muted-text">
                  {rows.length.toLocaleString()} dataset rows available
                </span>
                <button
                  type="button"
                  className="ec-primary-button"
                  onClick={analyze}
                  disabled={loading || rows.length === 0}
                >
                  {loading ? 'Running analysis...' : 'Run causal analysis'}
                </button>
              </div>

              {loading && (
                <p className="ec-loading" role="status" aria-live="polite">
                  Analysis is running. Please wait for the backend response.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'Overview' && (
        <div className="ec-tab-content">
          {!result ? (
            <div className="ec-empty-state">
              <h4>Analysis not run yet</h4>
              <p>Configure your variables and run an analysis to see the overview.</p>
              <button className="ec-secondary-button" onClick={() => setActiveTab('Configure')}>
                Configure analysis
              </button>
            </div>
          ) : (
            <>
              {result.is_mock === true && (
                <div className="ec-alert warning" role="status">
                  <strong>Demo / baseline output</strong>
                  <p>
                    This is not validated causal evidence. EconML DML integration
                    and diagnostics validation are still pending.
                  </p>
                </div>
              )}

              <div className="ec-result-heading">
                <div>
                  <h4>Analysis overview</h4>
                  <p>Summary of the result returned by the backend.</p>
                </div>
                <span className={`ec-status ${getStatusClass(result.status)}`}>
                  {result.status || 'Status unavailable'}
                </span>
              </div>

              <div className="ec-metric-grid">
                <div className="ec-metric-card">
                  <span>Average treatment effect</span>
                  <strong>{formatNumber(ate?.average_treatment_effect)}</strong>
                  <small>{ate?.unit || 'Unit not provided'}</small>
                </div>

                <div className="ec-metric-card">
                  <span>Confidence interval</span>
                  <strong className="ec-metric-compact">
                    {ate?.confidence_interval_lower != null &&
                    ate?.confidence_interval_upper != null
                      ? `${formatNumber(ate.confidence_interval_lower)} – ${formatNumber(ate.confidence_interval_upper)}`
                      : 'Not provided'}
                  </strong>
                  <small>Backend-reported interval</small>
                </div>

                <div className="ec-metric-card">
                  <span>Sample size</span>
                  <strong>
                    {result.metadata?.sample_size != null
                      ? Number(result.metadata.sample_size).toLocaleString()
                      : 'N/A'}
                  </strong>
                  <small>Observations used</small>
                </div>
              </div>

              <div className="ec-detail-grid">
                <div className="ec-detail-card">
                  <span>Run ID</span>
                  <strong>{result.run_id || 'Not provided'}</strong>
                </div>
                <div className="ec-detail-card">
                  <span>Estimator</span>
                  <strong>{result.estimator_used || 'Not provided by backend'}</strong>
                </div>
                <div className="ec-detail-card">
                  <span>Treatment</span>
                  <strong>{treatment || 'Not available'}</strong>
                </div>
                <div className="ec-detail-card">
                  <span>Outcome</span>
                  <strong>{outcome || 'Not available'}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'Treatment Effects' && (
        <div className="ec-tab-content">
          <div className="ec-section-heading">
            <div>
              <h4>Segment treatment effects</h4>
              <p>Subgroup estimates returned by the analysis backend.</p>
            </div>
          </div>

          {!result ? (
            <div className="ec-empty-state">
              <h4>No treatment effects available</h4>
              <p>Run an analysis first to view segment-level results.</p>
            </div>
          ) : segments.length > 0 ? (
            <div className="ec-table-wrap">
              <table className="ec-table">
                <thead>
                  <tr>
                    <th>Segment</th>
                    <th>Estimated effect</th>
                    <th>Sample size</th>
                  </tr>
                </thead>
                <tbody>
                  {segments.map((segment, index) => (
                    <tr key={`${segment.segment_name}-${index}`}>
                      <td>{segment.segment_name || 'Unnamed segment'}</td>
                      <td>{formatNumber(segment.estimated_effect)}</td>
                      <td>
                        {segment.sample_size != null
                          ? Number(segment.sample_size).toLocaleString()
                          : 'Not provided'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ec-empty-state">
              <h4>No segment effects returned</h4>
              <p>The backend did not provide segment-level estimates for this run.</p>
            </div>
          )}

          {result?.is_mock === true && (
            <p className="ec-footnote">
              These segment effects are demo/baseline outputs, not validated DML estimates.
            </p>
          )}
        </div>
      )}

      {activeTab === 'Diagnostics' && (
        <div className="ec-tab-content">
          <div className="ec-section-heading">
            <div>
              <h4>Model diagnostics</h4>
              <p>Review validation checks and warnings reported by the backend.</p>
            </div>
          </div>

          {!result ? (
            <div className="ec-empty-state">
              <h4>Diagnostics not available</h4>
              <p>Run an analysis to inspect its diagnostic information.</p>
            </div>
          ) : (
            <>
              <div className="ec-detail-card ec-refutation">
                <span>Refutation status</span>
                <strong>
                  {diagnostics?.refutation_status || 'Not provided'}
                </strong>
              </div>

              {checks.length > 0 ? (
                <div className="ec-diagnostic-list">
                  {checks.map((check, index) => (
                    <div className="ec-diagnostic-item" key={`${check.check_name}-${index}`}>
                      <div>
                        <strong>{check.check_name || 'Unnamed check'}</strong>
                        {check.details && <p>{check.details}</p>}
                      </div>
                      <span className={`ec-status ${getStatusClass(check.status)}`}>
                        {check.status || 'Not provided'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ec-empty-state">
                  <p>No individual diagnostic checks were returned.</p>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="ec-warning-list">
                  <h4>Backend warnings</h4>
                  {warnings.map((warning, index) => (
                    <p key={index}>{String(warning)}</p>
                  ))}
                </div>
              )}

              {result.is_mock === true && (
                <div className="ec-alert warning">
                  Diagnostic integration is pending. Do not interpret pending checks
                  as passed validation.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}