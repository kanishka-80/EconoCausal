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
    value === 'success' ||
    value.includes('optimal')
  ) {
    return 'success'
  }

  if (value.includes('fail') || value.includes('error') || value.includes('infeasible')) {
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
  const [budget, setBudget] = useState('1000')
  const [discounts, setDiscounts] = useState('5,10,20')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

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
      setError('Budget must be a positive number.')
      return
    }

    if (
      discountValues.length === 0 ||
      discountValues.some(
        (value) =>
          !Number.isFinite(value) ||
          !ALLOWED_DISCOUNTS.includes(value),
      )
    ) {
      setError('Allowed discounts are 5, 10, and 20 only.')
      return
    }

    if (new Set(discountValues).size !== discountValues.length) {
      setError('Duplicate discount values are not allowed.')
      return
    }

    // Find customer_id column in uploaded CSV
    if (!Array.isArray(headers) || !Array.isArray(rows) || rows.length === 0) {
      setError('Please upload a valid CSV dataset first.')
      return
    }

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
        throw new Error(
          'The backend did not return a valid optimization response.',
        )
      }

      if (!data.optimization_id || !data.status) {
        throw new Error(
          'Required fields are missing from the optimization response.',
        )
      }

      const allocations = data.allocation ?? data.allocations ?? []

      if (!Array.isArray(allocations)) {
        throw new Error('The backend allocation format is invalid.')
      }

      setResult({
        ...data,
        allocation: allocations,
        submitted_customer_count: customerIds.length,
      })

      setActiveTab('Results')
    } catch (err) {
      setError(
        err.message || 'Budget optimization could not be completed.',
      )
    } finally {
      setLoading(false)
    }
  }

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

  const limitations = [
    ...(Array.isArray(result?.limitations) ? result.limitations : []),
    ...(typeof result?.limitations === 'string' ? [result.limitations] : []),
    ...(Array.isArray(result?.metadata?.limitations) ? result.metadata.limitations : []),
  ]

  return (
    <div className="ec-panel">
      {/* Intro Header */}
      <div className="ec-panel-intro">
        <div>
          <span className="ec-eyebrow">CONSTRAINED REVENUE OPTIMIZATION</span>
          <h3>Marketing Budget Allocator</h3>
          <p>
            Allocate dynamic discount treatments across eligible customer segments to maximize aggregate causal uplift.
          </p>
        </div>

        <span
          className={`ec-connection ${
            apiStatus === 'Connected' ? 'online' : 'offline'
          }`}
        >
          <span />
          {apiStatus === 'Connected' ? 'Optimizer Connected' : 'Optimizer Offline'}
        </span>
      </div>

      {/* Tabs */}
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
      {activeTab === 'Configure' && (
        <div className="ec-tab-content">
          <div className="ec-section-heading">
            <div>
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
          </div>

          <div className="ec-action-row">
            <span className="ec-muted-text">
              {apiStatus === 'Connected'
                ? `Ready to evaluate ${rows.length.toLocaleString()} uploaded customer records`
                : 'Connect backend API to enable optimization'}
            </span>

            <button
              type="button"
              className="ec-primary-button"
              onClick={optimize}
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
            </button>
          </div>

          {loading && (
            <div className="ec-loading" role="status" aria-live="polite">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong style={{ color: '#ffffff' }}>Executing Budget Solver</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Loading uplift matrices, formulating knapsack constraints, and computing optimal policy assignments...
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: RESULTS */}
      {activeTab === 'Results' && (
        <div className="ec-tab-content">
          {!result ? (
            <div className="ec-empty-state">
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
              </button>
            </div>
          ) : (
            <>
              {result.is_mock === true && (
                <div className="ec-alert warning" role="status">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Scaffold / Mock Output Active</strong>
                      <p>This response was generated by the backend demonstration solver.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="ec-result-heading">
                <div>
                  <h4>Optimization Policy Results</h4>
                  <p>Aggregated spend and expected uplift computed by the backend optimizer.</p>
                </div>
                <span className={`ec-status ${getStatusClass(result.status)}`}>
                  {result.status}
                </span>
              </div>

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
              <div className="ec-detail-grid">
                <div className="ec-detail-card">
                  <span>Optimization ID</span>
                  <strong>{result.optimization_id}</strong>
                </div>

                <div className="ec-detail-card">
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
                    )}
                  </strong>
                </div>
              </div>

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
            </>
          )}
        </div>
      )}

      {/* Tab: CUSTOMER ALLOCATION */}
      {activeTab === 'Customer Allocation' && (
        <div className="ec-tab-content">
          <div className="ec-section-heading">
            <div>
              <h4>Targeted Customer Policy Assignments</h4>
              <p>Individualized discount allocations produced by the optimization solver.</p>
            </div>
          </div>

          {!result ? (
            <div className="ec-empty-state">
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
                <table className="ec-table">
                  <thead>
                    <tr>
                      <th>Customer ID</th>
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
                  </tbody>
                </table>
              </div>

              {filteredAllocations.length > DISPLAY_LIMIT && (
                <p className="table-note">
                  Displaying the top {DISPLAY_LIMIT} customer allocations. Full policy of {filteredAllocations.length.toLocaleString()} records evaluated by solver.
                </p>
              )}
            </>
          ) : (
            <div className="ec-empty-state">
              <Users size={30} />
              <h4>No Treated Customers Returned</h4>
              <p>The solver determined that with the specified budget and discount levels, no customers qualified for positive discount assignment.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
