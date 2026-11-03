import test from 'node:test'
import assert from 'node:assert/strict'
import {
  checkApiHealth,
  getDatasetSummary,
  getCausalResults,
  runCausalAnalysis,
  runBudgetOptimization,
  resetDataset,
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


test('getCausalResults encodes the run ID in the request URL', async (t) => {
  let requestedUrl

  t.mock.method(globalThis, 'fetch', async (url) => {
    requestedUrl = url
    return new Response(
      JSON.stringify({
        status: 'success',
        data: { run_id: 'run/one', status: 'completed' },
      }),
      { status: 200 },
    )
  })

  const result = await getCausalResults('run/one')

  assert.equal(requestedUrl, '/api/causal/results/run%2Fone')
  assert.equal(result.data.status, 'completed')
})

test('API service reports a useful error for a non-JSON server response', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    new Response('Server unavailable', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    }),
  )

  await assert.rejects(
    getDatasetSummary,
    /API request failed \(500\)/,
  )
})


test('resetDataset sends POST to the dataset reset endpoint', async (t) => {
  let request

  t.mock.method(globalThis, 'fetch', async (url, options) => {
    request = { url, options }
    return new Response(
      JSON.stringify({
        status: 'success',
        data: { message: 'Dataset cleared successfully.' },
      }),
      { status: 200 },
    )
  })

  const result = await resetDataset()

  assert.equal(request.url, '/api/data/reset')
  assert.equal(request.options.method, 'POST')
  assert.equal(result.status, 'success')
})

test('resetDataset reports backend reset errors', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    new Response(
      JSON.stringify({
        status: 'error',
        error: { message: 'Reset failed' },
      }),
      { status: 400 },
    ),
  )

  await assert.rejects(resetDataset, /Reset failed/)
})
