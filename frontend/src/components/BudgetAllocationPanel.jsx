import { useState } from 'react'
import { runBudgetOptimization } from '../services/api'

const ALLOWED_DISCOUNTS = [5, 10, 20]
const DISPLAY_LIMIT = 100

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Not provided'
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    return 'Not available'
  }

  return String(value)
}

export default function BudgetAllocationPanel({ apiStatus }) {
  const [budget, setBudget] = useState('1000')
  const [discounts, setDiscounts] = useState('5,10,20')
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

  const allocations = result?.allocation ?? result?.allocations ?? []
  const treatedAllocations = allocations.filter(
    (item) => Number(item.assigned_discount) > 0
  )
  const visibleAllocations = treatedAllocations.slice(0, DISPLAY_LIMIT)

  return (
    <div className="panel-content">
      <p>
        Marketing budget aur discount options select karke customer
        allocation optimize karo.
      </p>

      <div
        role="note"
        style={{
          padding: 12,
          margin: '12px 0',
          borderRadius: 8,
          background: 'rgba(59, 130, 246, 0.10)',
        }}
      >
        <strong>Customer data source:</strong>
        <p style={{ marginBottom: 0 }}>
          Optimization backend ki precomputed uplift matrix mein available
          20,000 customers par run hota hai. Uploaded CSV ke customer IDs
          is optimization mein use nahi hote, kyunki dono datasets ke IDs
          match nahi karte.
        </p>
      </div>

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
      <small>Allowed values: 5, 10, 20</small>

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

      <button
        onClick={optimize}
        disabled={loading || apiStatus !== 'Connected'}
      >
        {loading ? 'Optimizing 20,000 customers...' : 'Run Budget Optimization'}
      </button>

      {loading && (
        <p role="status" aria-live="polite">
          Optimization chal raha hai. Full customer dataset process hone mein
          around 1–2 minutes lag sakte hain. Please wait.
        </p>
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
              Mock/scaffold output — validated budget recommendation nahi hai.
            </p>
          )}

          <p><strong>Status:</strong> {formatValue(result.status)}</p>
          <p><strong>Optimization ID:</strong> {formatValue(result.optimization_id)}</p>
          <p>
            <strong>Result type:</strong>{' '}
            {result.is_mock === true ? 'Mock' : 'Backend solver response'}
          </p>
          <p><strong>Total Customers:</strong>{' '}
            {formatValue(result.summary?.total_customers ?? allocations.length)}
          </p>
          <p><strong>Treated Customers:</strong>{' '}
            {formatValue(result.summary?.treated_customers ?? result.allocated_customers_count)}
          </p>
          <p><strong>Total Spend:</strong> {formatValue(result.total_spend)}</p>
          <p><strong>Unused Budget:</strong> {formatValue(result.unused_budget)}</p>
          <p><strong>Expected Uplift:</strong>{' '}
            {formatValue(result.total_expected_uplift ?? result.objective_value)}
          </p>

          {allocations.length > 0 ? (
            <>
              <h4>Customer Allocations</h4>
              <p>
                Showing {visibleAllocations.length} of {treatedAllocations.length} treated customers.
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Assigned Discount</th>
                      <th>Cost</th>
                      <th>Expected Uplift</th>
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
            </>
          ) : (
            <p role="status">No allocation records were returned.</p>
          )}
        </div>
      )}
    </div>
  )
}
