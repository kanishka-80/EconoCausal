import { useState } from 'react'
import { runBudgetOptimization } from '../services/api'

const ALLOWED_DISCOUNTS = [0, 5, 10, 20]

export default function BudgetAllocationPanel({
  headers = [],
  rows = [],
  apiStatus,
}) {
  const [budget, setBudget] = useState('1000')
  const [discounts, setDiscounts] = useState('5,10,20')
  const [customerColumn, setCustomerColumn] = useState('')
  const [objective, setObjective] = useState('MAXIMIZE_UPLIFT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const optimize = async () => {
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
        (value) =>
          !Number.isFinite(value) || !ALLOWED_DISCOUNTS.includes(value),
      )
    ) {
      setError('Allowed discounts sirf 0, 5, 10, 20 hain.')
      return
    }

    if (new Set(discountValues).size !== discountValues.length) {
      setError('Duplicate discount values allowed nahi hain.')
      return
    }

    if (!customerColumn) {
      setError('Customer ID column select karo.')
      return
    }

    const columnIndex = headers.indexOf(customerColumn)
    if (columnIndex < 0) {
      setError('Selected customer column valid nahi hai.')
      return
    }

    const customerIds = [
      ...new Set(
        rows
          .map((row) => String(row[columnIndex] ?? '').trim())
          .filter(Boolean),
      ),
    ]

    if (customerIds.length === 0) {
      setError('Selected column mein customer IDs nahi mile.')
      return
    }

    setLoading(true)

    try {
      const response = await runBudgetOptimization({
        budget: budgetValue,
        available_discounts: discountValues,
        customer_ids: customerIds,
        objective,
      })

      if (!response?.data) {
        throw new Error('Backend se expected optimization data nahi mila.')
      }

      setResult(response.data)
    } catch (err) {
      setError(err.message || 'Optimization run nahi ho paya.')
    } finally {
      setLoading(false)
    }
  }

  const allocations = result?.allocations ?? []
  const summary = result?.summary
  const isInfeasible = result?.status === 'INFEASIBLE_INSUFFICIENT_BUDGET'

  return (
    <div className="panel-content">
      <p>
        Budget aur discount constraints select karke backend optimization
        run karo. Budget ki currency/unit backend confirmation ke bina
        assume nahi ki gayi hai.
      </p>

      <label htmlFor="marketing-budget">Marketing budget amount</label>
      <input
        id="marketing-budget"
        type="number"
        min="0.01"
        step="any"
        value={budget}
        onChange={(event) => setBudget(event.target.value)}
        disabled={loading}
      />

      <label htmlFor="discount-options">
        Available discounts (comma-separated percentages)
      </label>
      <input
        id="discount-options"
        value={discounts}
        onChange={(event) => setDiscounts(event.target.value)}
        placeholder="5,10,20"
        aria-describedby="discount-help"
        disabled={loading}
      />
      <small id="discount-help">Allowed values: 0, 5, 10, 20</small>

      <label htmlFor="optimization-objective">Optimization objective</label>
      <select
        id="optimization-objective"
        value={objective}
        onChange={(event) => setObjective(event.target.value)}
        disabled={loading}
      >
        <option value="MAXIMIZE_UPLIFT">Maximize incremental buyers</option>
        <option value="MAXIMIZE_REVENUE">Maximize revenue</option>
      </select>

      <label htmlFor="customer-id-column">Customer ID column</label>
      <select
        id="customer-id-column"
        value={customerColumn}
        onChange={(event) => setCustomerColumn(event.target.value)}
        disabled={loading}
      >
        <option value="">Select customer ID column</option>
        {headers.map((column) => (
          <option key={column} value={column}>
            {column}
          </option>
        ))}
      </select>

      <button
        onClick={optimize}
        disabled={loading || rows.length === 0}
      >
        {loading ? 'Optimizing...' : 'Run budget optimization'}
      </button>

      {rows.length === 0 && (
        <p role="status">Optimization ke liye pehle CSV upload karo.</p>
      )}

      {error && <p role="alert">{error}</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Optimization results</h3>

          {result.is_mock && (
            <p role="status">
              Mock/scaffold output — this is not a validated budget
              recommendation.
            </p>
          )}

          {isInfeasible && (
            <p role="status">
              Insufficient budget: backend could not find a feasible
              allocation. No discounts were assigned.
            </p>
          )}

          <p><strong>Status:</strong> {result.status ?? 'Not provided'}</p>
          <p>
            <strong>Optimization ID:</strong>{' '}
            {result.optimization_id ?? 'Not provided'}
          </p>
          <p>
            <strong>Objective:</strong> {objective}
          </p>
          <p>
            <strong>Total budget:</strong>{' '}
            {result.total_budget ?? 'Not provided'}
          </p>
          <p>
            <strong>Total spend:</strong>{' '}
            {result.total_spend ?? 'Not provided'}
          </p>
          <p>
            <strong>Unallocated budget:</strong>{' '}
            {result.unallocated_budget ?? 'Not provided'}
          </p>
          <p>
            <strong>Expected uplift:</strong>{' '}
            {result.total_expected_uplift ?? 'Not provided'}
          </p>

          {summary && (
            <>
              <h4>Allocation summary</h4>
              <p>
                <strong>Total customers:</strong>{' '}
                {summary.total_customers ?? 'Not provided'}
              </p>
              <p>
                <strong>Treated customers:</strong>{' '}
                {summary.treated_customers ?? 'Not provided'}
              </p>
              <p>
                <strong>Control customers:</strong>{' '}
                {summary.control_customers ?? 'Not provided'}
              </p>
            </>
          )}

          <h4>Customer allocation</h4>
          {allocations.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>Customer ID</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Discount (%)</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Subsidy cost</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Expected uplift</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((item, index) => (
                    <tr key={`${item.customer_id}-${index}`}>
                      <td style={{ padding: 8 }}>{item.customer_id ?? 'N/A'}</td>
                      <td style={{ padding: 8 }}>{item.assigned_discount ?? 'N/A'}</td>
                      <td style={{ padding: 8 }}>{item.subsidy_cost ?? 'N/A'}</td>
                      <td style={{ padding: 8 }}>{item.expected_uplift ?? 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No allocation rows returned by the backend.</p>
          )}

          {result.limitations?.length > 0 && (
            <>
              <h4>Limitations</h4>
              <ul>
                {result.limitations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </>
          )}

          {result.warnings?.length > 0 && (
            <>
              <h4>Warnings</h4>
              <ul>
                {result.warnings.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
