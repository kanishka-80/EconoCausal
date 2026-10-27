
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
  const response = await fetch(`${API_BASE_URL}/health`)

  if (!response.ok) {
    throw new Error(`API health check failed (${response.status})`)
  }

  return response.json()
}

export async function uploadDataset(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/data/upload`, {
    method: 'POST',
    body: formData,
  })

  return handleResponse(response)
}

export async function getDatasetSummary() {
  const response = await fetch(`${API_BASE_URL}/data/summary`)

  return handleResponse(response)
}
