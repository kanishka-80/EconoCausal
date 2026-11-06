import { useState } from 'react'
import { runBudgetOptimization } from '../services/api'

const DISPLAY_LIMIT = 100

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Not provided'
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    return 'Not available'
  }

  return typeof value === 'number'
    ? value.toLocaleString(undefined, { maximumFractionDigits: 4 })
    : String(value)
}

const getStatusClass = (status) => {
  const value = String(status || '').toLowerCase()

  if (
    value.includes('feasible') ||
    value.includes('complete') ||
    value === 'success'
  ) {
    return 'success'
  }

  if (value.includes('fail') || value.includes('error')) {
    return 'danger'
  }

  if (value.includes('warning')) {
    return 'warning'
  }

  return 'pending'
}

export default function BudgetAllocationPanel({
  headers = [],
  rows = [],
  apiStatus,
}) {
  const [activeTab, setActiveTab] = useState('Configure')
  const [budget, setBudget] = useState('50000')
  const [discounts, setDiscounts] = useState('10,20,30')
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
      setError('Backend is not connected. Please ensure the backend server is running.')
      return
    }

    if (!Number.isFinite(budgetValue) || budgetValue <= 0) {
      setError('Marketing budget must be a positive number.')
      return
    }

    if (
      discountValues.length === 0 ||
      discountValues.some((value) => !Number.isFinite(value) || value <= 0)
    ) {
      setError('Please provide valid positive discount values (e.g. 10, 20, 30).')
      return
    }

    if (new Set(discountValues).size !== discountValues.length) {
      setError('Duplicate discount values are not allowed.')
      return
    }

    if (!Array.isArray(headers) || !Array.isArray(rows) || rows.length === 0) {
      setError('Please upload a valid CSV dataset first.')
      return
    }

    // Flexible customer ID column detection across arbitrary datasets
    const standardIdNames = ['customer_id', 'user_id', 'id', 'cust_id', 'client_id']
    let customerIdIndex = headers.findIndex((header) =>
      standardIdNames.includes(String(header).trim().toLowerCase()),
    )

    // Fallback: check if any column contains 'id'
    if (customerIdIndex === -1) {
      customerIdIndex = headers.findIndex((header) =>
        String(header).trim().toLowerCase().includes('id'),
      )
    }

    // Fallback: default to the first column if no explicit ID column is present
    if (customerIdIndex === -1) {
      customerIdIndex = 0
    }

    // Extract customer IDs
    const rawCustomerIds = rows
      .map((row) => String(row[customerIdIndex] ?? '').trim())
      .filter((id) => id.length > 0)

    if (rawCustomerIds.length === 0) {
      setError('No valid customer IDs could be extracted from the uploaded dataset.')
      return
    }

    // Deduplicate customer IDs while preserving row order
    const customerIds = Array.from(new Set(rawCustomerIds))

    setLoading(true)

    try {
      const response = await runBudgetOptimization({
        budget: budgetValue,
        available_discounts: discountValues,
        customer_ids: customerIds,
        objective: 'MAXIMIZE_UPLIFT',
      })

      const data = response?.data

      if (!data || typeof data !== 'object') {
        throw new Error('Backend did not return a valid optimization response.')
      }

      if (!data.optimization_id || !data.status) {
        throw new Error('Optimization response is missing required fields.')
      }

      const allocations = data.allocation ?? data.allocations ?? []

      if (!Array.isArray(allocations)) {
        throw new Error('Backend allocation format is invalid.')
      }

      setResult({
        ...data,
        allocation: allocations,
        submitted_customer_count: customerIds.length,
      })

      setActiveTab('Results')
    } catch (err) {
      setError(err.message || 'Failed to complete budget optimization.')
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
    ...(Array.isArray(result?.metadata?.limitations)
      ? result.metadata.limitations
      : []),
  ]

  return (
    <div className="ec-panel">
      {/* Panel Header */}
      <div className="ec-panel-intro">
        <div>
          <span className="ec-eyebrow">BUDGET OPTIMIZATION</span>
          <h3>Allocation Workspace</h3>
          <p>
            Configure marketing spend and review backend optimization results.
          </p>
        </div>

        <span
          className={`ec-connection ${
            apiStatus === 'Connected' ? 'online' : 'offline'
          }`}
        >
          <span />
          {apiStatus === 'Connected'
            ? 'Backend connected'
            : 'Backend unavailable'}
        </span>
      </div>

      {/* Tabs */}
      <div
        className="ec-tabs"
        role="tablist"
        aria-label="Budget allocation sections"
      >
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

      {error && (
        <div className="ec-alert error" role="alert">
          {error}
        </div>
      )}

      {/* Configure Tab */}
      {activeTab === 'Configure' && (
        <div className="ec-tab-content">
          <div className="ec-section-heading">
            <div>
              <h4>Optimization settings</h4>
              <p>
                Choose the marketing budget and target discount tiers.
              </p>
            </div>
            <span className="ec-step-label">STEP 01</span>
          </div>

          <div className="ec-alert info">
            <strong>Customer data source</strong>
            <p>
              Customer IDs are dynamically extracted from the uploaded CSV and matched against
              causal treatment-effect estimates.
            </p>
            <p>
              Uploaded customer records: {rows.length.toLocaleString()}
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
                placeholder="Enter budget (e.g. 50000)"
              />
              <small>Enter a positive budget amount.</small>
            </label>

            <label className="ec-field">
              <span>Available discounts</span>
              <input
                value={discounts}
                onChange={(e) => setDiscounts(e.target.value)}
                placeholder="10,20,30"
              />
              <small>
                Enter positive numeric discounts separated by commas (e.g. 10, 20, 30).
              </small>
            </label>
          </div>

          <div className="ec-alert info">
            <strong>Optimization objective: Maximize Uplift</strong>
            <p>
              The optimizer solves a constrained knapsack MILP to maximize incremental conversion
              uplift within the approved budget.
            </p>
          </div>

          <div className="ec-action-row">
            <span className="ec-muted-text">
              {apiStatus === 'Connected'
                ? 'Ready to submit'
                : 'Backend connection required'}
            </span>

            <button
              type="button"
              className="ec-primary-button"
              onClick={optimize}
              disabled={
                loading ||
                apiStatus !== 'Connected' ||
                rows.length === 0
              }
            >
              {loading ? 'Optimizing...' : 'Run budget optimization'}
            </button>
          </div>

          {loading && (
            <p className="ec-loading" role="status" aria-live="polite">
              Optimization is running. Processing the dataset and solving allocation constraints may
              take around 30–60 seconds. Please wait.
            </p>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'Results' && (
        <div className="ec-tab-content">
          {!result ? (
            <div className="ec-empty-state">
              <h4>No optimization results yet</h4>
              <p>
                Configure your budget and run optimization to view results.
              </p>
              <button
                className="ec-secondary-button"
                onClick={() => setActiveTab('Configure')}
              >
                Configure optimization
              </button>
            </div>
          ) : (
            <>
              {result.is_mock === true && (
                <div className="ec-alert warning" role="status">
                  <strong>Mock / scaffold output</strong>
                  <p>
                    This result should not be treated as a validated recommendation.
                  </p>
                </div>
              )}

              <div className="ec-result-heading">
                <div>
                  <h4>Optimization results</h4>
                  <p>
                    Summary of the optimization response returned by the backend solver.
                  </p>
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
                    {formatValue(
                      result.total_expected_uplift ?? result.objective_value,
                    )}
                  </strong>
                  <small>Cumulative incremental conversions</small>
                </div>
              </div>

              <div className="ec-detail-grid">
                <div className="ec-detail-card">
                  <span>Optimization ID</span>
                  <strong>{result.optimization_id}</strong>
                </div>

                <div className="ec-detail-card">
                  <span>Result type</span>
                  <strong>
                    {result.is_mock === true
                      ? 'Mock output'
                      : 'Backend solver response'}
                  </strong>
                </div>

                <div className="ec-detail-card">
                  <span>Target cohort size</span>
                  <strong>
                    {formatValue(result.submitted_customer_count)}
                  </strong>
                </div>

                <div className="ec-detail-card">
                  <span>Total customers evaluated</span>
                  <strong>
                    {formatValue(
                      result.summary?.total_customers ?? allocations.length,
                    )}
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
                  Expected uplift represents model-guided incremental estimates under the specified
                  budget constraints. It is not an unconditional guarantee of commercial outcomes.
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

      {/* Customer Allocation Tab */}
      {activeTab === 'Customer Allocation' && (
        <div className="ec-tab-content">
          <div className="ec-section-heading">
            <div>
              <h4>Customer allocation</h4>
              <p>
                Customer-level assignments returned by the backend optimizer.
              </p>
            </div>
          </div>

          {!result ? (
            <div className="ec-empty-state">
              <h4>Allocation not available</h4>
              <p>
                Run budget optimization first to view customer assignments.
              </p>
            </div>
          ) : treatedAllocations.length > 0 ? (
            <>
              <div className="ec-allocation-summary">
                <strong>
                  {treatedAllocations.length.toLocaleString()}
                </strong>
                <span>
                  customers assigned a positive discount subsidy
                </span>
              </div>

              <p className="ec-muted-text">
                Showing {visibleAllocations.length} of{' '}
                {treatedAllocations.length} treated customers.
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
                  Display limited to the first {DISPLAY_LIMIT} treated customers for responsiveness.
                  The full solution contains {treatedAllocations.length} treated individuals.
                </p>
              )}
            </>
          ) : (
            <div className="ec-empty-state">
              <h4>No treated customers returned</h4>
              <p>
                The solver allocated all budget to control ($0.0) based on non-positive uplift or
                budget limits.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}