import test from 'node:test'
import assert from 'node:assert/strict'
import {
  checkApiHealth,
  getDatasetSummary,
  runCausalAnalysis,
  runBudgetOptimization,
} from '../src/services/api.js'

test('checkApiHealth returns the backend health response', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    new Response(
      JSON.stringify({
        status: 'ok',
        service: 'EconoCausal API',
        version: '0.1.0',
      }),
      { status: 200 },
    ),
  )

  const result = await checkApiHealth()
  assert.equal(result.status, 'ok')
  assert.equal(result.service, 'EconoCausal API')
})

test('checkApiHealth reports an unsuccessful HTTP response', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    new Response('{}', { status: 503 }),
  )

  await assert.rejects(checkApiHealth, /health check failed \(503\)/)
})

test('getDatasetSummary returns the API response envelope', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    new Response(
      JSON.stringify({
        status: 'success',
        data: { row_count: 25, column_count: 4 },
      }),
      { status: 200 },
    ),
  )

  const result = await getDatasetSummary()
  assert.equal(result.data.row_count, 25)
  assert.equal(result.data.column_count, 4)
})

test('runCausalAnalysis sends the selected analysis payload', async (t) => {
  const payload = {
    treatment_column: 'discount_offered',
    outcome_column: 'purchased',
    confounders: ['age', 'tenure_months'],
  }

  let requestOptions

  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requestOptions = { url, options }

    return new Response(
      JSON.stringify({
        status: 'success',
        data: { run_id: 'test-run-1' },
      }),
      { status: 200 },
    )
  })

  const result = await runCausalAnalysis(payload)

  assert.equal(requestOptions.url, '/api/causal/analyze')
  assert.equal(requestOptions.options.method, 'POST')
  assert.deepEqual(JSON.parse(requestOptions.options.body), payload)
  assert.equal(result.data.run_id, 'test-run-1')
})

test('runBudgetOptimization reports backend error messages', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    new Response(
      JSON.stringify({
        status: 'error',
        error: { code: 'INVALID_REQUEST', message: 'Invalid budget value' },
      }),
      { status: 400 },
    ),
  )

  await assert.rejects(
    runBudgetOptimization({
      budget: 1000,
      available_discounts: [5, 10],
      objective: 'MAXIMIZE_UPLIFT',
    }),
    /Invalid budget value/,
  )
})

test('API service reports network failures clearly', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Network unavailable')
  })

  await assert.rejects(
    runCausalAnalysis({ treatment_column: 'discount' }),
    /backend API is unreachable/,
  )
})
