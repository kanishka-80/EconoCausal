const API_BASE_URL = '/api'

export async function checkApiHealth() {
  const response = await fetch(`${API_BASE_URL}/health`)

  if (!response.ok) {
    throw new Error(`API health check failed (${response.status})`)
  }

  return response.json()
}
