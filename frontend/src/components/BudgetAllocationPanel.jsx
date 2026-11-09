<<<<<<< HEAD
import { useState } from 'react'
import { runBudgetOptimization } from '../services/api'

=======
import { useState, useMemo, lazy, Suspense } from 'react'
import { runBudgetOptimization } from '../services/api'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  DollarSign,
  Info,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  X
} from 'lucide-react'

const Plot = lazy(() => import('react-plotly.js'))

const ALLOWED_DISCOUNTS = [5, 10, 20]
>>>>>>> origin/khushi-work
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
<<<<<<< HEAD
    value === 'success'
=======
    value === 'success' ||
    value.includes('optimal')
>>>>>>> origin/khushi-work
  ) {
    return 'success'
  }

<<<<<<< HEAD
  if (value.includes('fail') || value.includes('error')) {
=======
  if (value.includes('fail') || value.includes('error') || value.includes('infeasible')) {
>>>>>>> origin/khushi-work
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
<<<<<<< HEAD
  const [budget, setBudget] = useState('50000')
  const [discounts, setDiscounts] = useState('10,20,30')
=======
  const [budget, setBudget] = useState('1000')
  const [discounts, setDiscounts] = useState('5,10,20')
>>>>>>> origin/khushi-work
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

<<<<<<< HEAD
  const tabs = ['Configure', 'Results', 'Customer Allocation']
=======
  // Allocation table filters
  const [customerSearch, setCustomerSearch] = useState('')
  const [discountFilter, setDiscountFilter] = useState('all')

  const tabs = [
    { id: 'Configure', label: 'Configure Spend', icon: DollarSign },
    { id: 'Results', label: 'Optimization Summary', icon: TrendingUp },
    { id: 'Customer Allocation', label: 'Customer Assignments', icon: Users }
  ]

  // Parse active discount numbers
  const currentDiscountArray = useMemo(() => {
    return discounts
      .split(',')
      .map((d) => Number(d.trim()))
      .filter((n) => Number.isFinite(n))
  }, [discounts])

  const toggleDiscount = (val) => {
    const exists = currentDiscountArray.includes(val)
    let next = exists
      ? currentDiscountArray.filter((x) => x !== val)
      : [...currentDiscountArray, val].sort((a, b) => a - b)
    if (next.length === 0) next = [val] // keep at least one
    setDiscounts(next.join(','))
  }
>>>>>>> origin/khushi-work

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
<<<<<<< HEAD
      setError('Marketing budget must be a positive number.')
=======
      setError('Budget must be a positive number.')
>>>>>>> origin/khushi-work
      return
    }

    if (
      discountValues.length === 0 ||
<<<<<<< HEAD
      discountValues.some((value) => !Number.isFinite(value) || value <= 0)
    ) {
      setError('Please provide valid positive discount values (e.g. 10, 20, 30).')
=======
      discountValues.some(
        (value) =>
          !Number.isFinite(value) ||
          !ALLOWED_DISCOUNTS.includes(value),
      )
    ) {
      setError('Allowed discounts are 5, 10, and 20 only.')
>>>>>>> origin/khushi-work
      return
    }

    if (new Set(discountValues).size !== discountValues.length) {
      setError('Duplicate discount values are not allowed.')
      return
    }

<<<<<<< HEAD
=======
    // Find customer_id column in uploaded CSV
>>>>>>> origin/khushi-work
    if (!Array.isArray(headers) || !Array.isArray(rows) || rows.length === 0) {
      setError('Please upload a valid CSV dataset first.')
      return
    }

<<<<<<< HEAD
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
=======
    const customerIdIndex = headers.findIndex(
      (header) =>
        String(header).trim().toLowerCase() === 'customer_id',
    )

    if (customerIdIndex === -1) {
      setError('The uploaded CSV does not contain a customer_id column.')
      return
    }

    // Extract customer IDs from every uploaded row
    const customerIds = rows.map((row) =>
      String(row[customerIdIndex] ?? '').trim(),
    )

    if (customerIds.some((id) => !id)) {
      setError('The uploaded CSV contains missing or empty customer IDs.')
      return
    }

    // Prevent duplicate customer IDs
    if (new Set(customerIds).size !== customerIds.length) {
      setError('The uploaded CSV contains duplicate customer IDs.')
      return
    }
>>>>>>> origin/khushi-work

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
<<<<<<< HEAD
        throw new Error('Backend did not return a valid optimization response.')
      }

      if (!data.optimization_id || !data.status) {
        throw new Error('Optimization response is missing required fields.')
=======
        throw new Error(
          'The backend did not return a valid optimization response.',
        )
      }

      if (!data.optimization_id || !data.status) {
        throw new Error(
          'Required fields are missing from the optimization response.',
        )
>>>>>>> origin/khushi-work
      }

      const allocations = data.allocation ?? data.allocations ?? []

      if (!Array.isArray(allocations)) {
<<<<<<< HEAD
        throw new Error('Backend allocation format is invalid.')
=======
        throw new Error('The backend allocation format is invalid.')
>>>>>>> origin/khushi-work
      }

      setResult({
        ...data,
        allocation: allocations,
        submitted_customer_count: customerIds.length,
      })

      setActiveTab('Results')
    } catch (err) {
<<<<<<< HEAD
      setError(err.message || 'Failed to complete budget optimization.')
=======
      setError(
        err.message || 'Budget optimization could not be completed.',
      )
>>>>>>> origin/khushi-work
    } finally {
      setLoading(false)
    }
  }

<<<<<<< HEAD
  const allocations = result?.allocation ?? []

  const treatedAllocations = allocations.filter(
    (item) => Number(item.assigned_discount) > 0,
  )

  const visibleAllocations = treatedAllocations.slice(0, DISPLAY_LIMIT)
=======
  const allocations = useMemo(() => result?.allocation ?? [], [result])

  const treatedAllocations = useMemo(() => {
    return allocations.filter((item) => Number(item.assigned_discount) > 0)
  }, [allocations])

  // Filtered customer list
  const filteredAllocations = useMemo(() => {
    return treatedAllocations.filter((item) => {
      const matchesSearch = customerSearch.trim() === '' ||
        String(item.customer_id).toLowerCase().includes(customerSearch.toLowerCase())
      const matchesDiscount = discountFilter === 'all' ||
        String(item.assigned_discount) === String(discountFilter)
      return matchesSearch && matchesDiscount
    })
  }, [treatedAllocations, customerSearch, discountFilter])

  const visibleAllocations = filteredAllocations.slice(0, DISPLAY_LIMIT)

  // Aggregate breakdown for Plotly charts
  const discountBreakdown = useMemo(() => {
    if (!allocations.length) return null
    const counts = { '0%': 0, '5%': 0, '10%': 0, '20%': 0 }
    let spend5 = 0, spend10 = 0, spend20 = 0

    allocations.forEach((item) => {
      const d = Number(item.assigned_discount)
      const cost = Number(item.cost) || 0
      if (d === 5) { counts['5%']++; spend5 += cost }
      else if (d === 10) { counts['10%']++; spend10 += cost }
      else if (d === 20) { counts['20%']++; spend20 += cost }
      else { counts['0%']++ }
    })

    return {
      labels: ['No Discount', '5% Discount', '10% Discount', '20% Discount'],
      counts: [counts['0%'], counts['5%'], counts['10%'], counts['20%']],
      spends: [0, spend5, spend10, spend20]
    }
  }, [allocations])
>>>>>>> origin/khushi-work

  const limitations = [
    ...(Array.isArray(result?.limitations) ? result.limitations : []),
    ...(typeof result?.limitations === 'string' ? [result.limitations] : []),
<<<<<<< HEAD
    ...(Array.isArray(result?.metadata?.limitations)
      ? result.metadata.limitations
      : []),
=======
    ...(Array.isArray(result?.metadata?.limitations) ? result.metadata.limitations : []),
>>>>>>> origin/khushi-work
  ]

  return (
    <div className="ec-panel">
<<<<<<< HEAD
      {/* Panel Header */}
      <div className="ec-panel-intro">
        <div>
          <span className="ec-eyebrow">BUDGET OPTIMIZATION</span>
          <h3>Allocation Workspace</h3>
          <p>
            Configure marketing spend and review backend optimization results.
=======
      {/* Intro Header */}
      <div className="ec-panel-intro">
        <div>
          <span className="ec-eyebrow">CONSTRAINED REVENUE OPTIMIZATION</span>
          <h3>Marketing Budget Allocator</h3>
          <p>
            Allocate dynamic discount treatments across eligible customer segments to maximize aggregate causal uplift.
>>>>>>> origin/khushi-work
          </p>
        </div>

        <span
          className={`ec-connection ${
            apiStatus === 'Connected' ? 'online' : 'offline'
          }`}
        >
          <span />
<<<<<<< HEAD
          {apiStatus === 'Connected'
            ? 'Backend connected'
            : 'Backend unavailable'}
=======
          {apiStatus === 'Connected' ? 'Optimizer Connected' : 'Optimizer Offline'}
>>>>>>> origin/khushi-work
        </span>
      </div>

      {/* Tabs */}
<<<<<<< HEAD
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
=======
      <div className="ec-tabs" role="tablist" aria-label="Budget allocation sections">
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
>>>>>>> origin/khushi-work
      {activeTab === 'Configure' && (
        <div className="ec-tab-content">
          <div className="ec-section-heading">
            <div>
<<<<<<< HEAD
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
=======
              <h4>Budget &amp; Discount Configuration</h4>
              <p>Specify overall marketing capital and available promotional tiers.</p>
            </div>
            <span className="ec-step-label">BUDGET SETUP</span>
          </div>

          <div className="ec-alert info">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Customer Matching Pipeline</strong>
                <p>
                  Customer IDs are parsed directly from your uploaded CSV ({rows.length.toLocaleString()} records).
                  The optimizer evaluates individual-level treatment effects from the precomputed Double ML uplift model.
                </p>
              </div>
            </div>
          </div>

          <div className="ec-form-grid">
            <div className="ec-field">
              <span>Marketing Budget ($ USD)</span>
              <input
                type="number"
                min="1"
                step="any"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 1000"
              />
              {/* Preset quick budget chips */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {[500, 1000, 5000, 10000, 25000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="ec-secondary-button"
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      background: budget === String(preset) ? 'rgba(56, 189, 248, 0.2)' : undefined,
                      borderColor: budget === String(preset) ? 'var(--accent-blue)' : undefined
                    }}
                    onClick={() => setBudget(String(preset))}
                  >
                    ${preset.toLocaleString()}
                  </button>
                ))}
              </div>
              <small>Total spend upper bound across all treatments.</small>
            </div>

            <div className="ec-field">
              <span>Available Discount Tiers</span>
              <div className="discount-chip-group" style={{ marginTop: '2px', marginBottom: '8px' }}>
                {[5, 10, 20].map((tier) => {
                  const isSelected = currentDiscountArray.includes(tier)
                  return (
                    <button
                      key={tier}
                      type="button"
                      className={`discount-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleDiscount(tier)}
                    >
                      {tier}% Discount
                    </button>
                  )
                })}
              </div>
              <input
                value={discounts}
                onChange={(e) => setDiscounts(e.target.value)}
                placeholder="5,10,20"
                style={{ fontSize: '12px', height: '36px' }}
              />
              <small>Allowed discount rates are 5%, 10%, and 20%.</small>
            </div>
          </div>

          <div className="ec-alert info" style={{ background: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={18} style={{ color: '#a5b4fc', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#e0e7ff' }}>Optimization Objective: Maximize Aggregate Causal Uplift</strong>
                <p style={{ color: '#c7d2fe', fontSize: '12px', marginTop: '2px' }}>
                  The integer programming solver allocates discounts to the customers with the highest incremental uplift per dollar spent, subject to the total budget limit.
                </p>
              </div>
            </div>
>>>>>>> origin/khushi-work
          </div>

          <div className="ec-action-row">
            <span className="ec-muted-text">
              {apiStatus === 'Connected'
<<<<<<< HEAD
                ? 'Ready to submit'
                : 'Backend connection required'}
=======
                ? `Ready to evaluate ${rows.length.toLocaleString()} uploaded customer records`
                : 'Connect backend API to enable optimization'}
>>>>>>> origin/khushi-work
            </span>

            <button
              type="button"
              className="ec-primary-button"
              onClick={optimize}
<<<<<<< HEAD
              disabled={
                loading ||
                apiStatus !== 'Connected' ||
                rows.length === 0
              }
            >
              {loading ? 'Optimizing...' : 'Run budget optimization'}
=======
              disabled={loading || apiStatus !== 'Connected' || rows.length === 0}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Solving Optimal Policy...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Run Budget Optimization</span>
                </>
              )}
>>>>>>> origin/khushi-work
            </button>
          </div>

          {loading && (
<<<<<<< HEAD
            <p className="ec-loading" role="status" aria-live="polite">
              Optimization is running. Processing the dataset and solving allocation constraints may
              take around 30–60 seconds. Please wait.
            </p>
=======
            <div className="ec-loading" role="status" aria-live="polite">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong style={{ color: '#ffffff' }}>Executing Budget Solver</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Loading uplift matrices, formulating knapsack constraints, and computing optimal policy assignments...
                </span>
              </div>
            </div>
>>>>>>> origin/khushi-work
          )}
        </div>
      )}

<<<<<<< HEAD
      {/* Results Tab */}
=======
      {/* Tab: RESULTS */}
>>>>>>> origin/khushi-work
      {activeTab === 'Results' && (
        <div className="ec-tab-content">
          {!result ? (
            <div className="ec-empty-state">
<<<<<<< HEAD
              <h4>No optimization results yet</h4>
              <p>
                Configure your budget and run optimization to view results.
              </p>
              <button
                className="ec-secondary-button"
                onClick={() => setActiveTab('Configure')}
              >
                Configure optimization
=======
              <BarChart3 size={36} />
              <h4>No Optimization Results Yet</h4>
              <p>Configure marketing budget and discount tiers, then run optimization to inspect allocations.</p>
              <button
                type="button"
                className="ec-primary-button"
                style={{ marginTop: '16px' }}
                onClick={() => setActiveTab('Configure')}
              >
                Configure Budget
>>>>>>> origin/khushi-work
              </button>
            </div>
          ) : (
            <>
              {result.is_mock === true && (
                <div className="ec-alert warning" role="status">
<<<<<<< HEAD
                  <strong>Mock / scaffold output</strong>
                  <p>
                    This result should not be treated as a validated recommendation.
                  </p>
=======
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Scaffold / Mock Output Active</strong>
                      <p>This response was generated by the backend demonstration solver.</p>
                    </div>
                  </div>
>>>>>>> origin/khushi-work
                </div>
              )}

              <div className="ec-result-heading">
                <div>
<<<<<<< HEAD
                  <h4>Optimization results</h4>
                  <p>
                    Summary of the optimization response returned by the backend solver.
                  </p>
                </div>

=======
                  <h4>Optimization Policy Results</h4>
                  <p>Aggregated spend and expected uplift computed by the backend optimizer.</p>
                </div>
>>>>>>> origin/khushi-work
                <span className={`ec-status ${getStatusClass(result.status)}`}>
                  {result.status}
                </span>
              </div>

<<<<<<< HEAD
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

=======
              {/* KPI Cards */}
              <div className="ec-metric-grid">
                <div className="ec-metric-card">
                  <span>Total Allocated Spend</span>
                  <strong>${formatValue(result.total_spend)}</strong>
                  <small>
                    Budget utilization: {result.total_spend && budget ? ((Number(result.total_spend) / Number(budget)) * 100).toFixed(1) + '%' : '100%'}
                  </small>
                </div>

                <div className="ec-metric-card">
                  <span>Unused Budget</span>
                  <strong>${formatValue(result.unused_budget)}</strong>
                  <small>Surplus unallocated</small>
                </div>

                <div className="ec-metric-card">
                  <span>Total Expected Uplift</span>
                  <strong>
                    {formatValue(result.total_expected_uplift ?? result.objective_value)}
                  </strong>
                  <small>Cumulative incremental outcome</small>
                </div>
              </div>

              {/* Plotly Chart: Discount Breakdown */}
              {discountBreakdown && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '16px',
                    marginTop: '4px'
                  }}
                >
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                      Customer Distribution by Discount
                    </h5>
                    <Suspense fallback={<div className="ec-muted-text">Loading chart...</div>}>
                      <Plot
                        data={[
                          {
                            labels: discountBreakdown.labels,
                            values: discountBreakdown.counts,
                            type: 'pie',
                            hole: 0.55,
                            marker: {
                              colors: ['#475569', '#38bdf8', '#818cf8', '#c084fc']
                            },
                            textinfo: 'percent',
                            hoverinfo: 'label+value+percent'
                          }
                        ]}
                        layout={{
                          autosize: true,
                          height: 220,
                          paper_bgcolor: 'transparent',
                          plot_bgcolor: 'transparent',
                          margin: { l: 20, r: 20, t: 10, b: 20 },
                          showlegend: true,
                          legend: {
                            font: { color: '#94a3b8', size: 10 },
                            orientation: 'h',
                            y: -0.2
                          }
                        }}
                        config={{ responsive: true, displayModeBar: false }}
                        style={{ width: '100%', height: 220 }}
                        useResizeHandler
                      />
                    </Suspense>
                  </div>

                  <div
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                      Spend Breakdown by Discount Tier
                    </h5>
                    <Suspense fallback={<div className="ec-muted-text">Loading chart...</div>}>
                      <Plot
                        data={[
                          {
                            x: ['5% Tier', '10% Tier', '20% Tier'],
                            y: [discountBreakdown.spends[1], discountBreakdown.spends[2], discountBreakdown.spends[3]],
                            type: 'bar',
                            marker: {
                              color: ['#38bdf8', '#818cf8', '#c084fc']
                            }
                          }
                        ]}
                        layout={{
                          autosize: true,
                          height: 220,
                          paper_bgcolor: 'transparent',
                          plot_bgcolor: 'transparent',
                          margin: { l: 50, r: 20, t: 10, b: 40 },
                          xaxis: { tickfont: { color: '#94a3b8' } },
                          yaxis: {
                            title: { text: 'Spend ($)', font: { color: '#94a3b8', size: 11 } },
                            tickfont: { color: '#64748b' },
                            gridcolor: 'rgba(255, 255, 255, 0.05)'
                          },
                          showlegend: false
                        }}
                        config={{ responsive: true, displayModeBar: false }}
                        style={{ width: '100%', height: 220 }}
                        useResizeHandler
                      />
                    </Suspense>
                  </div>
                </div>
              )}

              {/* Detail Breakdown Cards */}
>>>>>>> origin/khushi-work
              <div className="ec-detail-grid">
                <div className="ec-detail-card">
                  <span>Optimization ID</span>
                  <strong>{result.optimization_id}</strong>
                </div>

                <div className="ec-detail-card">
<<<<<<< HEAD
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
=======
                  <span>Solver Type</span>
                  <strong>{result.is_mock === true ? 'Demo Solver' : 'Linear Programming Optimizer'}</strong>
                </div>

                <div className="ec-detail-card">
                  <span>Submitted Customers</span>
                  <strong>{formatValue(result.submitted_customer_count)}</strong>
                </div>

                <div className="ec-detail-card">
                  <span>Treated Customers</span>
                  <strong style={{ color: '#38bdf8' }}>
                    {formatValue(
                      result.summary?.treated_customers ??
                      result.allocated_customers_count ??
                      treatedAllocations.length,
>>>>>>> origin/khushi-work
                    )}
                  </strong>
                </div>
              </div>

<<<<<<< HEAD
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
=======
              {limitations.length > 0 && (
                <div className="ec-warning-list">
                  <h4>Backend Optimization Limitations</h4>
                  {limitations.map((item, index) => (
                    <p key={index}>• {String(item)}</p>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setActiveTab('Customer Allocation')}
                >
                  <span>View Customer Level Assignments</span>
                  <ArrowRight size={15} />
                </button>
              </div>
>>>>>>> origin/khushi-work
            </>
          )}
        </div>
      )}

<<<<<<< HEAD
      {/* Customer Allocation Tab */}
=======
      {/* Tab: CUSTOMER ALLOCATION */}
>>>>>>> origin/khushi-work
      {activeTab === 'Customer Allocation' && (
        <div className="ec-tab-content">
          <div className="ec-section-heading">
            <div>
<<<<<<< HEAD
              <h4>Customer allocation</h4>
              <p>
                Customer-level assignments returned by the backend optimizer.
              </p>
=======
              <h4>Targeted Customer Policy Assignments</h4>
              <p>Individualized discount allocations produced by the optimization solver.</p>
>>>>>>> origin/khushi-work
            </div>
          </div>

          {!result ? (
            <div className="ec-empty-state">
<<<<<<< HEAD
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
=======
              <Users size={36} />
              <h4>Allocations Unavailable</h4>
              <p>Execute budget optimization to inspect individual customer discount recommendations.</p>
            </div>
          ) : treatedAllocations.length > 0 ? (
            <>
              {/* Search & Filter Toolbar */}
              <div className="table-toolbar">
                <div className="search-box">
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="Search by Customer ID..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  {customerSearch && (
                    <button type="button" onClick={() => setCustomerSearch('')} style={{ color: 'var(--text-muted)' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Discount:</span>
                  {['all', '5', '10', '20'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className="ec-secondary-button"
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        background: discountFilter === val ? 'rgba(56, 189, 248, 0.2)' : undefined,
                        borderColor: discountFilter === val ? 'var(--accent-blue)' : undefined
                      }}
                      onClick={() => setDiscountFilter(val)}
                    >
                      {val === 'all' ? 'All' : `${val}%`}
                    </button>
                  ))}
                </div>

                <span className="row-count">
                  {filteredAllocations.length.toLocaleString()} matching of {treatedAllocations.length.toLocaleString()} treated
                </span>
              </div>

              {/* Allocation Table */}
              <div className="table-scroll">
>>>>>>> origin/khushi-work
                <table className="ec-table">
                  <thead>
                    <tr>
                      <th>Customer ID</th>
<<<<<<< HEAD
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
=======
                      <th>Assigned Discount</th>
                      <th>Treatment Cost ($)</th>
                      <th>Expected Uplift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAllocations.map((item, index) => {
                      const discount = Number(item.assigned_discount)
                      return (
                        <tr key={`${item.customer_id}-${index}`}>
                          <td style={{ fontWeight: 600, color: '#ffffff' }}>
                            {formatValue(item.customer_id)}
                          </td>
                          <td>
                            <span
                              className="step-badge"
                              style={{
                                background:
                                  discount === 20
                                    ? 'rgba(168, 85, 247, 0.2)'
                                    : discount === 10
                                    ? 'rgba(99, 102, 241, 0.2)'
                                    : 'rgba(56, 189, 248, 0.2)',
                                color:
                                  discount === 20
                                    ? '#c084fc'
                                    : discount === 10
                                    ? '#818cf8'
                                    : '#38bdf8',
                                borderColor: 'transparent'
                              }}
                            >
                              {formatValue(item.assigned_discount)}% OFF
                            </span>
                          </td>
                          <td style={{ color: '#cbd5e1' }}>
                            ${formatValue(item.cost)}
                          </td>
                          <td style={{ color: '#34d399', fontWeight: 600 }}>
                            +{formatValue(item.expected_uplift)}
                          </td>
                        </tr>
                      )
                    })}
>>>>>>> origin/khushi-work
                  </tbody>
                </table>
              </div>

<<<<<<< HEAD
              {treatedAllocations.length > DISPLAY_LIMIT && (
                <p className="ec-footnote">
                  Display limited to the first {DISPLAY_LIMIT} treated customers for responsiveness.
                  The full solution contains {treatedAllocations.length} treated individuals.
=======
              {filteredAllocations.length > DISPLAY_LIMIT && (
                <p className="table-note">
                  Displaying the top {DISPLAY_LIMIT} customer allocations. Full policy of {filteredAllocations.length.toLocaleString()} records evaluated by solver.
>>>>>>> origin/khushi-work
                </p>
              )}
            </>
          ) : (
            <div className="ec-empty-state">
<<<<<<< HEAD
              <h4>No treated customers returned</h4>
              <p>
                The solver allocated all budget to control ($0.0) based on non-positive uplift or
                budget limits.
              </p>
=======
              <Users size={30} />
              <h4>No Treated Customers Returned</h4>
              <p>The solver determined that with the specified budget and discount levels, no customers qualified for positive discount assignment.</p>
>>>>>>> origin/khushi-work
            </div>
          )}
        </div>
      )}
    </div>
  )
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/khushi-work
