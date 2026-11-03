import { useState } from 'react'
import { runBudgetOptimization } from '../services/api'

const ALLOWED_DISCOUNTS = [5, 10, 20]
const DISPLAY_LIMIT = 100

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return 'Not provided'
  if (typeof value === 'number' && !Number.isFinite(value)) return 'Not available'

  return typeof value === 'number' ? value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  }) : String(value)
}

const getStatusClass = (status) => {
  const value = String(status || '').toLowerCase()

  if (value.includes('feasible') || value.includes('complete') || value === 'success') {
    return 'success'
  }
  if (value.includes('fail') || value.includes('error')) return 'danger'
  if (value.includes('warning')) return 'warning'
  return 'pending'
}

export default function BudgetAllocationPanel({ apiStatus }) {
  const [activeTab, setActiveTab] = useState('Configure')
  const [budget, setBudget] = useState('1000')
  const [discounts, setDiscounts] = useState('5,10,20')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const tabs = ['Configure', 'Results', 'Customer Allocation']

  const optimize = async () => {
    if (loading) return

    setError('')
    setResult(null)

    const budgetValue = Number(budget)
    const discountValues = discounts
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map(Number)

    if (apiStatus !== 'Connected') {
      setError('Backend connected nahi hai. Pehle backend start karo.')
      return
    }

    if (!Number.isFinite(budgetValue) || budgetValue <= 0) {
      setError('Budget positive number hona chahiye.')
      return
    }

    if (
      discountValues.length === 0 ||
      discountValues.some(
        (value) => !Number.isFinite(value) || !ALLOWED_DISCOUNTS.includes(value),
      )
    ) {
      setError('Allowed discounts sirf 5, 10, 20 hain.')
      return
    }

    if (new Set(discountValues).size !== discountValues.length) {
      setError('Duplicate discount values allowed nahi hain.')
      return
    }

    setLoading(true)

    try {
      const response = await runBudgetOptimization({
        budget: budgetValue,
        available_discounts: discountValues,
        objective: 'MAXIMIZE_UPLIFT',
      })

      const data = response?.data

      if (!data || typeof data !== 'object') {
        throw new Error('Backend ne valid optimization response nahi diya.')
      }

      if (!data.optimization_id || !data.status) {
        throw new Error('Optimization response mein required fields missing hain.')
      }

      const allocations = data.allocation ?? data.allocations ?? []

      if (!Array.isArray(allocations)) {
        throw new Error('Backend allocation format valid nahi hai.')
      }

      setResult({ ...data, allocation: allocations })
      setActiveTab('Results')
    } catch (err) {
      setError(err.message || 'Budget optimization run nahi ho paya.')
    } finally {
      setLoading(false)
    }
  }

  const allocations = result?.allocation ?? []
  const treatedAllocations = allocations.filter(
    (item) => Number(item.assigned_discount) > 0,
  )
  const visibleAllocations = treatedAllocations.slice(0, DISPLAY_LIMIT)

  const limitations = [
    ...(Array.isArray(result?.limitations) ? result.limitations : []),
    ...(typeof result?.limitations === 'string' ? [result.limitations] : []),
    ...(Array.isArray(result?.metadata?.limitations) ? result.metadata.limitations : []),
  ]

  return (
    <div className="ec-panel">
      <div className="ec-panel-intro">
        <div>
          <span className="ec-eyebrow">BUDGET OPTIMIZATION</span>
          <h3>Allocation Workspace</h3>
          <p>Configure marketing spend and review backend optimization results.</p>
        </div>

        <span className={`ec-connection ${apiStatus === 'Connected' ? 'online' : 'offline'}`}>
          <span />
          {apiStatus === 'Connected' ? 'Backend connected' : 'Backend unavailable'}
        </span>
      </div>

      <div className="ec-tabs" role="tablist" aria-label="Budget allocation sections">
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
              <h4>Optimization settings</h4>
              <p>Choose the marketing budget and available discount levels.</p>
            </div>
            <span className="ec-step-label">STEP 01</span>
          </div>

          <div className="ec-alert info">
            <strong>Customer data source</strong>
            <p>
              The current backend optimizer uses a separate precomputed uplift
              matrix containing 20,000 customers. The uploaded CSV has different
              customer IDs and is not currently used in this optimization run.
            </p>
          </div>

          <div className="ec-form-grid">
            <label className="ec-field">
              <span>Marketing budget</span>
              <input
                type="number"
                min="0.01"
                step="any"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Enter budget"
              />
              <small>Enter a positive budget amount.</small>
            </label>

            <label className="ec-field">
              <span>Available discounts</span>
              <input
                value={discounts}
                onChange={(e) => setDiscounts(e.target.value)}
                placeholder="5,10,20"
              />
              <small>Allowed values: 5, 10, 20. Separate with commas.</small>
            </label>
          </div>

          <div className="ec-alert info">
            <strong>Optimization objective: Maximize Uplift</strong>
            <p>
              The current backend optimizer supports uplift maximization.
              Revenue maximization is not available in the current implementation.
            </p>
          </div>

          <div className="ec-action-row">
            <span className="ec-muted-text">
              {apiStatus === 'Connected' ? 'Ready to submit' : 'Backend connection required'}
            </span>
            <button
              type="button"
              className="ec-primary-button"
              onClick={optimize}
              disabled={loading || apiStatus !== 'Connected'}
            >
              {loading ? 'Optimizing...' : 'Run budget optimization'}
            </button>
          </div>

          {loading && (
            <p className="ec-loading" role="status" aria-live="polite">
              Optimization is running. Processing the backend customer dataset may
              take around 1–2 minutes. Please wait.
            </p>
          )}
        </div>
      )}

      {activeTab === 'Results' && (
        <div className="ec-tab-content">
          {!result ? (
            <div className="ec-empty-state">
              <h4>No optimization results yet</h4>
              <p>Configure your budget and run optimization to view results.</p>
              <button className="ec-secondary-button" onClick={() => setActiveTab('Configure')}>
                Configure optimization
              </button>
            </div>
          ) : (
            <>
              {result.is_mock === true && (
                <div className="ec-alert warning" role="status">
                  <strong>Mock / scaffold output</strong>
                  <p>This result should not be treated as a validated recommendation.</p>
                </div>
              )}

              <div className="ec-result-heading">
                <div>
                  <h4>Optimization results</h4>
                  <p>Summary of the optimization response returned by the backend.</p>
                </div>
                <span className={`ec-status ${getStatusClass(result.status)}`}>
                  {result.status}
                </span>
              </div>

              <div className="ec-metric-grid">
                <div className="ec-metric-card">
                  <span>Total spend</span>
                  <strong>{formatValue(result.total_spend)}</strong>
                  <small>Backend-reported spend</small>
                </div>

                <div className="ec-metric-card">
                  <span>Unused budget</span>
                  <strong>{formatValue(result.unused_budget)}</strong>
                  <small>Remaining budget</small>
                </div>

                <div className="ec-metric-card">
                  <span>Expected uplift</span>
                  <strong>
                    {formatValue(result.total_expected_uplift ?? result.objective_value)}
                  </strong>
                  <small>Backend-reported objective value</small>
                </div>
              </div>

              <div className="ec-detail-grid">
                <div className="ec-detail-card">
                  <span>Optimization ID</span>
                  <strong>{result.optimization_id}</strong>
                </div>
                <div className="ec-detail-card">
                  <span>Result type</span>
                  <strong>{result.is_mock === true ? 'Mock output' : 'Backend solver response'}</strong>
                </div>
                <div className="ec-detail-card">
                  <span>Total customers</span>
                  <strong>
                    {formatValue(result.summary?.total_customers ?? allocations.length)}
                  </strong>
                </div>
                <div className="ec-detail-card">
                  <span>Treated customers</span>
                  <strong>
                    {formatValue(
                      result.summary?.treated_customers ??
                      result.allocated_customers_count ??
                      treatedAllocations.length,
                    )}
                  </strong>
                </div>
              </div>

              <div className="ec-alert info">
                <strong>Interpretation note</strong>
                <p>
                  Expected uplift is a backend-reported estimate, not a guarantee
                  of actual business outcomes. The optimizer currently uses a
                  separate precomputed uplift matrix rather than the uploaded CSV.
                </p>
              </div>

              {limitations.length > 0 && (
                <div className="ec-warning-list">
                  <h4>Backend limitations</h4>
                  {limitations.map((item, index) => (
                    <p key={index}>{String(item)}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'Customer Allocation' && (
        <div className="ec-tab-content">
          <div className="ec-section-heading">
            <div>
              <h4>Customer allocation</h4>
              <p>Customer-level assignments returned by the backend.</p>
            </div>
          </div>

          {!result ? (
            <div className="ec-empty-state">
              <h4>Allocation not available</h4>
              <p>Run budget optimization first to view customer assignments.</p>
            </div>
          ) : treatedAllocations.length > 0 ? (
            <>
              <div className="ec-allocation-summary">
                <strong>{treatedAllocations.length.toLocaleString()}</strong>
                <span>customers with a positive assigned discount</span>
              </div>

              <p className="ec-muted-text">
                Showing {visibleAllocations.length} of {treatedAllocations.length} treated customers.
              </p>

              <div className="ec-table-wrap">
                <table className="ec-table">
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Assigned discount</th>
                      <th>Cost</th>
                      <th>Expected uplift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAllocations.map((item, index) => (
                      <tr key={`${item.customer_id}-${index}`}>
                        <td>{formatValue(item.customer_id)}</td>
                        <td>{formatValue(item.assigned_discount)}</td>
                        <td>{formatValue(item.cost)}</td>
                        <td>{formatValue(item.expected_uplift)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {treatedAllocations.length > DISPLAY_LIMIT && (
                <p className="ec-footnote">
                  The table is limited to the first {DISPLAY_LIMIT} treated customers
                  for display. The backend response contains {treatedAllocations.length} treated records.
                </p>
              )}
            </>
          ) : (
            <div className="ec-empty-state">
              <h4>No treated customers returned</h4>
              <p>The backend did not return any customer with a positive assigned discount.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}