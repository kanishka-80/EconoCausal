
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
    throw new Error("Backend API is unreachable. Please check whether the server is running.")
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
    throw new Error("Dataset upload failed because the backend API is unreachable.")
  }

  return handleResponse(response)
}

export async function getDatasetSummary() {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/data/summary`)
  } catch {
    throw new Error("Dataset summary is unavailable because the backend API is unreachable.")
  }

  return handleResponse(response)
}
