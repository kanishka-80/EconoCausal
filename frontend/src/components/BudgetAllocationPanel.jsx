
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
      .filter((value) => value !== '')
      .map(Number)

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
      discountValues.some(
        (value) =>
          !Number.isFinite(value) || !ALLOWED_DISCOUNTS.includes(value),
      )
    ) {
      setError('Sirf allowed discounts enter karo: 0, 5, 10, 20.')
      return
    }

    if (new Set(discountValues).size !== discountValues.length) {
      setError('Har discount sirf ek baar enter karo.')
      return
    }

    if (!customerColumn) {
      setError('Customer ID column select karo.')
      return
    }

    const columnIndex = headers.indexOf(customerColumn)
    const customerIds = [
      ...new Set(
        rows
          .map((row) => String(row[columnIndex] ?? '').trim())
          .filter(Boolean),
      ),
    ]

    if (columnIndex < 0 || customerIds.length === 0) {
      setError('Selected column mein customer IDs nahi mile.')
      return
    }

    setLoading(true)

    try {
      const response = await runBudgetOptimization({
        budget: budgetValue,
        available_discounts: discountValues,
        customer_ids: customerIds,
        objective: 'MAXIMIZE_REVENUE',
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

  return (
    <div className="panel-content">
      <p>
        Budget aur allowed discount options enter karke backend optimization
        endpoint test karo. Mock output ko validated recommendation mat samajhna.
      </p>

      <label htmlFor="marketing-budget">Marketing budget</label>
      <input
        id="marketing-budget"
        type="number"
        min="0.01"
        step="any"
        value={budget}
        onChange={(event) => setBudget(event.target.value)}
      />

      <label htmlFor="discount-options">
        Available discounts (comma-separated)
      </label>
      <input
        id="discount-options"
        value={discounts}
        onChange={(event) => setDiscounts(event.target.value)}
        placeholder="5,10,20"
        aria-describedby="discount-help"
      />
      <small id="discount-help">
        Allowed values: 0, 5, 10, 20
      </small>

      <label htmlFor="customer-id-column">Customer ID column</label>
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

      <button onClick={optimize} disabled={loading || rows.length === 0}>
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

          <p><strong>Status:</strong> {result.status ?? 'Not provided'}</p>
          <p>
            <strong>Optimization ID:</strong>{' '}
            {result.optimization_id ?? 'Not provided'}
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
            <ul>
              {allocations.map((item, index) => (
                <li key={`${item.customer_id}-${index}`}>
                  {item.customer_id}: discount {item.assigned_discount},
                  {' '}subsidy cost {item.subsidy_cost ?? 'Not provided'},
                  {' '}expected uplift {item.expected_uplift ?? 'Not provided'}
                </li>
              ))}
            </ul>
          ) : (
            <p>No allocation rows returned.</p>
          )}

          {result.limitations?.length > 0 && (
            <>
              <h4>Limitations</h4>
              <ul>
                {result.limitations.map((limitation, index) => (
                  <li key={index}>{limitation}</li>
                ))}
              </ul>
            </>
          )}

          {result.warnings?.length > 0 && (
            <>
              <h4>Warnings</h4>
              <ul>
                {result.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
