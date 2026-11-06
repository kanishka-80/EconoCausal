const API_BASE_URL = '/api'

async function handleResponse(response) {
  const result = await response.json().catch(() => ({}))

  if (!response.ok || result.status === 'error') {
    throw new Error(
      result.error?.message ||
        `API request failed (${response.status})`
    )
  }

  return result
}

export async function checkApiHealth() {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/health`)
  } catch {
    throw new Error(
      'Backend API is unreachable. Please check whether the server is running.'
    )
  }

  if (!response.ok) {
    throw new Error(`API health check failed (${response.status})`)
  }

  return response.json()
}

export async function uploadDataset(file) {
  const formData = new FormData()
  formData.append('file', file)

  let response

  try {
    response = await fetch(`${API_BASE_URL}/data/upload`, {
      method: 'POST',
      body: formData,
    })
  } catch {
    throw new Error(
      'Dataset upload failed because the backend API is unreachable.'
    )
  }

  return handleResponse(response)
}

export async function getDatasetSummary() {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/data/summary`)
  } catch {
    throw new Error(
      'Dataset summary is unavailable because the backend API is unreachable.'
    )
  }

  return handleResponse(response)
}

export async function runCausalAnalysis(payload) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/causal/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Causal analysis failed: backend API is unreachable.')
  }

  return handleResponse(response)
}

export async function getCausalResults(runId) {
  let response

  try {
    response = await fetch(
      `${API_BASE_URL}/causal/results/${encodeURIComponent(runId)}`
    )
  } catch {
    throw new Error('Causal results are unavailable: backend API is unreachable.')
  }

  return handleResponse(response)
}

export async function runBudgetOptimization(payload) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/optimization/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Budget optimization failed: backend API is unreachable.')
  }

  return handleResponse(response)
}
