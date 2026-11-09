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


export async function resetDataset() {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/data/reset`, {
      method: 'POST',
    })
  } catch {
    throw new Error('Dataset reset failed: backend API is unreachable.')
  }

  return handleResponse(response)
}

// Analysis History API
export async function getAnalysisHistory(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.analysis_type) query.set('analysis_type', params.analysis_type)

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return handleResponse(await fetch(`${API_BASE_URL}/history${suffix}`))
}

export async function getAnalysisHistoryDetail(id) {
  return handleResponse(
    await fetch(`${API_BASE_URL}/history/${encodeURIComponent(id)}`)
  )
}

export async function createAnalysisHistory(payload) {
  return handleResponse(await fetch(`${API_BASE_URL}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }))
}

export async function updateAnalysisHistory(id, payload) {
  return handleResponse(await fetch(
    `${API_BASE_URL}/history/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  ))
}

export async function deleteAnalysisHistory(id) {
  return handleResponse(await fetch(
    `${API_BASE_URL}/history/${encodeURIComponent(id)}`,
    { method: 'DELETE' }
  ))
}

export async function clearAllAnalysisHistory() {
  return handleResponse(await fetch(
    `${API_BASE_URL}/history`,
    { method: 'DELETE' }
  ))
}
