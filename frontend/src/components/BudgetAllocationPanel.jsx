
import { useState } from 'react'
import { runBudgetOptimization } from '../services/api'

const ALLOWED_DISCOUNTS = [0, 5, 10, 20]

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Not provided'
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    return 'Not available'
  }

  return String(value)
}

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
        (value) =>
          !Number.isFinite(value) ||
          !ALLOWED_DISCOUNTS.includes(value),
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
    } catch (err) {
      setError(err.message || 'Budget optimization run nahi ho paya.')
    } finally {
      setLoading(false)
    }
  }

  const allocations = result?.allocation ?? []

  return (
    <div className="panel-content">
      <p>
        Budget aur discount options select karke backend optimization
        endpoint run karo. Results backend response par depend karenge.
      </p>

      <label htmlFor="marketing-budget">Marketing Budget</label>
      <input
        id="marketing-budget"
        type="number"
        min="0.01"
        step="any"
        value={budget}
        onChange={(event) => setBudget(event.target.value)}
      />

      <label htmlFor="discount-options">
        Available Discounts (comma-separated)
      </label>
      <input
        id="discount-options"
        value={discounts}
        onChange={(event) => setDiscounts(event.target.value)}
        placeholder="5,10,20"
      />
      <small>Allowed values: 0, 5, 10, 20</small>

      <label htmlFor="optimization-objective">
        Optimization Objective
      </label>
      <select
        id="optimization-objective"
        value={objective}
        onChange={(event) => setObjective(event.target.value)}
      >
        <option value="MAXIMIZE_UPLIFT">Maximize Uplift</option>
        <option value="MAXIMIZE_REVENUE">Maximize Revenue</option>
      </select>

      <label htmlFor="customer-id-column">Customer ID Column</label>
      <select
        id="customer-id-column"
        value={customerColumn}
        onChange={(event) => setCustomerColumn(event.target.value)}
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
        {loading ? 'Optimizing...' : 'Run Budget Optimization'}
      </button>

      {rows.length === 0 && (
        <p role="status">Upload a dataset before running optimization.</p>
      )}

      {error && (
        <p role="alert" style={{ color: '#ef7777', marginTop: 12 }}>
          {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Optimization Results</h3>

          {result.is_mock === true && (
            <p role="status">
              Mock/scaffold output — not a validated budget recommendation.
            </p>
          )}

          <p>
            <strong>Status:</strong> {formatValue(result.status)}
          </p>
          <p>
            <strong>Optimization ID:</strong>{' '}
            {formatValue(result.optimization_id)}
          </p>
          <p>
            <strong>Result type:</strong>{' '}
            {result.is_mock === true ? 'Mock' : 'Backend response'}
          </p>
          <p>
            <strong>Total Spend:</strong>{' '}
            {formatValue(result.total_spend)}
          </p>
          <p>
            <strong>Unused Budget:</strong>{' '}
            {formatValue(result.unused_budget)}
          </p>
          <p>
            <strong>Objective Value:</strong>{' '}
            {formatValue(result.objective_value)}
          </p>
          <p>
            <strong>Allocated Customers:</strong>{' '}
            {formatValue(result.allocated_customers_count)}
          </p>

          {allocations.length > 0 ? (
            <>
              <h4>Customer Allocations</h4>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Assigned Discount</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((item, index) => (
                      <tr key={`${item.customer_id}-${index}`}>
                        <td>{formatValue(item.customer_id)}</td>
                        <td>{formatValue(item.assigned_discount)}</td>
                        <td>{formatValue(item.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p role="status">
              Allocation details are not included in the current API response
              schema. The backend currently exposes optimization metadata only.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
