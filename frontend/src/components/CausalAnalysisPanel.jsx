
import { useState } from 'react'
import { runCausalAnalysis } from '../services/api'

export default function CausalAnalysisPanel({ headers = [], rows = [], apiStatus }) {
  const [treatment, setTreatment] = useState('')
  const [outcome, setOutcome] = useState('')
  const [confounders, setConfounders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const toggleConfounder = (column) => {
    setConfounders((current) =>
      current.includes(column)
        ? current.filter((item) => item !== column)
        : [...current, column]
    )
  }

  const analyze = async () => {
    setError('')
    setResult(null)

    if (apiStatus !== 'Connected') {
      setError('Backend connected nahi hai. Pehle backend server start karo.')
      return
    }

    if (!treatment || !outcome || treatment === outcome) {
      setError('Alag treatment aur outcome columns select karo.')
      return
    }

    if (confounders.length === 0) {
      setError('Kam se kam ek confounder select karo.')
      return
    }

    setLoading(true)

    try {
      const response = await runCausalAnalysis({
        treatment_column: treatment,
        outcome_column: outcome,
        confounders,
      })

      setResult(response.data)
    } catch (err) {
      setError(err.message || 'Analysis run nahi ho paya.')
    } finally {
      setLoading(false)
    }
  }

  const ate = result?.ate_summary

  return (
    <div className="panel-content">
      <p>
        Dataset se treatment effect estimate karo. Results backend ke
        response par depend karenge.
      </p>

      {headers.length === 0 ? (
        <p>Analysis ke liye pehle CSV upload karo.</p>
      ) : (
        <>
          <label htmlFor="treatment-column">Treatment column</label>
          <select
            id="treatment-column"
            value={treatment}
            onChange={(event) => setTreatment(event.target.value)}
          >
            <option value="">Select treatment</option>
            {headers.map((column) => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>

          <label htmlFor="outcome-column">Outcome column</label>
          <select
            id="outcome-column"
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
          >
            <option value="">Select outcome</option>
            {headers.map((column) => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>

          <p>Confounder columns (kam se kam ek):</p>
          <div>
            {headers
              .filter((column) => column !== treatment && column !== outcome)
              .map((column) => (
                <label key={column} style={{ display: 'block', margin: '8px 0' }}>
                  <input
                    type="checkbox"
                    checked={confounders.includes(column)}
                    onChange={() => toggleConfounder(column)}
                  />
                  {' '}{column}
                </label>
              ))}
          </div>

          <button onClick={analyze} disabled={loading || rows.length === 0}>
            {loading ? 'Running analysis...' : 'Run causal analysis'}
          </button>
        </>
      )}

      {error && (
        <p role="alert" style={{ color: '#ef7777', marginTop: 12 }}>
          {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Analysis results</h3>

          {result.is_mock && (
            <p role="status">
              Demo/mock result — not validated causal evidence.
            </p>
          )}

          <p><strong>Run ID:</strong> {result.run_id}</p>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Estimator:</strong> {result.estimator_used}</p>

          <p>
            <strong>Average treatment effect:</strong>{' '}
            {ate?.average_treatment_effect ?? 'Not provided'}{' '}
            {ate?.unit || ''}
          </p>

          {ate?.confidence_interval_lower != null &&
            ate?.confidence_interval_upper != null && (
              <p>
                <strong>Confidence interval:</strong>{' '}
                {ate.confidence_interval_lower} to {ate.confidence_interval_upper}
              </p>
            )}

          <p><strong>Sample size:</strong> {result.metadata?.sample_size ?? 'N/A'}</p>

          <h4>Segment effects</h4>
          {result.segment_effects?.length ? (
            <ul>
              {result.segment_effects.map((segment, index) => (
                <li key={`${segment.segment_name}-${index}`}>
                  {segment.segment_name}: {segment.estimated_effect}
                  {' '} (n={segment.sample_size})
                </li>
              ))}
            </ul>
          ) : (
            <p>No segment effects returned.</p>
          )}

          <h4>Diagnostics</h4>
          <p>
            Refutation status:{' '}
            {result.diagnostics?.refutation_status || 'Not provided'}
          </p>
          {result.diagnostics?.checks?.length ? (
            <ul>
              {result.diagnostics.checks.map((check, index) => (
                <li key={`${check.check_name}-${index}`}>
                  {check.check_name}: {check.status}
                  {check.details ? ` — ${check.details}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p>Diagnostics checks are not available yet.</p>
          )}

          {result.diagnostics?.warnings?.map((warning, index) => (
            <p key={index}>{warning}</p>
          ))}
        </div>
      )}
    </div>
  )
}
