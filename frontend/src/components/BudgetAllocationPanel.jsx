
import { useState } from 'react'
import { runBudgetOptimization } from '../services/api'

export default function BudgetAllocationPanel({ headers = [], rows = [], apiStatus }) {
  const [budget, setBudget] = useState('1000')
  const [discounts, setDiscounts] = useState('10,20')
  const [customerColumn, setCustomerColumn] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const optimize = async () => {
    setError('')
    setResult(null)

    const budgetValue = Number(budget)
    const discountValues = discounts
      .split(',')
      .map((value) => Number(value.trim()))

    if (apiStatus !== 'Connected') {
      setError('Backend connected nahi hai.')
      return
    }

    if (!Number.isFinite(budgetValue) || budgetValue <= 0) {
      setError('Budget positive number hona chahiye.')
      return
    }

    if (
      discountValues.length === 0 ||
      discountValues.some((value) => !Number.isFinite(value) || value <= 0)
    ) {
      setError('Discounts comma-separated positive numbers mein enter karo.')
      return
    }

    if (!customerColumn) {
      setError('Customer ID column select karo.')
      return
    }

    const columnIndex = headers.indexOf(customerColumn)
    const customerIds = rows
      .map((row) => String(row[columnIndex] ?? '').trim())
      .filter(Boolean)

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
        objective: 'maximize_revenue',
      })

      setResult(response.data)
    } catch (err) {
      setError(err.message || 'Optimization run nahi ho paya.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel-content">
      <p>
        Budget aur discount options enter karke backend optimization endpoint
        test karo. Mock output ko validated recommendation mat samajhna.
      </p>

      <label htmlFor="marketing-budget">Marketing budget</label>
      <input
        id="marketing-budget"
        type="number"
        min="1"
        value={budget}
        onChange={(event) => setBudget(event.target.value)}
      />

      <label htmlFor="discount-options">Available discounts (comma-separated)</label>
      <input
        id="discount-options"
        value={discounts}
        onChange={(event) => setDiscounts(event.target.value)}
        placeholder="10,20"
      />

      <label htmlFor="customer-id-column">Customer ID column</label>
      <select
        id="customer-id-column"
        value={customerColumn}
        onChange={(event) => setCustomerColumn(event.target.value)}
      >
        <option value="">Select customer ID column</option>
        {headers.map((column) => (
          <option key={column} value={column}>{column}</option>
        ))}
      </select>

      <button
        onClick={optimize}
        disabled={loading || rows.length === 0}
      >
        {loading ? 'Optimizing...' : 'Run budget optimization'}
      </button>

      {error && <p role="alert">{error}</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Optimization results</h3>

          {result.is_mock && (
            <p role="status">
              Mock/scaffold output — not a validated budget recommendation.
            </p>
          )}

          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Optimization ID:</strong> {result.optimization_id}</p>
          <p><strong>Total spend:</strong> {result.total_spend}</p>
          <p><strong>Unused budget:</strong> {result.unused_budget}</p>
          <p><strong>Objective value:</strong> {result.objective_value}</p>
          <p><strong>Customers allocated:</strong> {result.allocated_customers_count}</p>

          <h4>Customer allocation</h4>
          {result.allocation?.length ? (
            <ul>
              {result.allocation.map((item, index) => (
                <li key={`${item.customer_id}-${index}`}>
                  {item.customer_id}: discount {item.assigned_discount},
                  {' '}cost {item.cost}
                </li>
              ))}
            </ul>
          ) : (
            <p>No allocation rows returned.</p>
          )}
        </div>
      )}
    </div>
  )
}
