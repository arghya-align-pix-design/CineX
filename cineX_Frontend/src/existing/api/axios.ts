import axios from 'axios'

// ---------------------------------------------------------------------------
// Axios instance with HttpOnly cookie support
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9090',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ---------------------------------------------------------------------------
// Request Queue for Silent Refresh (prevents multiple parallel refresh calls)
// ---------------------------------------------------------------------------
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

// ---------------------------------------------------------------------------
// Response Interceptor — Silent Token Refresh
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config

    if (err.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || ''
      if (
        url.includes('/auth/refresh') ||
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/demo-login') ||
        url.includes('/auth/logout')
      ) {
        return Promise.reject(err)
      }

      const isDemo = localStorage.getItem('cinex_demo_mode') === 'true'
      if (isDemo) {
        console.warn('Backend 401 in Demo Mode — preserving session state.')
        return Promise.reject(err)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch((e) => Promise.reject(e))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await api.post('/auth/refresh')
        processQueue(null)
        return api(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr as Error)
        localStorage.removeItem('cinex_user')
        localStorage.removeItem('cinex_demo_mode')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

// Deprecated stubs kept for backward compatibility with legacy pages
export function setToken(_token: string | null): void {}
export function setAuthToken(_token: string | null): void {}

export async function setupAdmin(email: string, password: string): Promise<string> {
  const { data } = await api.post<string>('/admin/setup', { email, password })
  return data
}

export async function verifyTotp(email: string, code: string) {
  const { data } = await api.post('/admin/verify-totp', { email, code })
  return data
}

export async function loginAdmin(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export default api
