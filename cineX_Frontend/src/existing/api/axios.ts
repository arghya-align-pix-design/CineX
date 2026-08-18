import axios from 'axios'

// ---------------------------------------------------------------------------
// Module-level token store — never touches localStorage/sessionStorage
// ---------------------------------------------------------------------------
let _token: string | null = localStorage.getItem('cinex_token')

export function setToken(token: string | null): void {
  _token = token
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9090',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach Bearer token if present
api.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`
  }
  return config
})

// Response interceptor — on 401 clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      setToken(null)
      localStorage.removeItem('cinex_token')
      localStorage.removeItem('cinex_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ---------------------------------------------------------------------------
// Named API helpers — used by legacy AdminPages and available for new pages
// ---------------------------------------------------------------------------

/**
 * POST /admin/setup  { email, password }
 * Backend returns a plain string: "Admin created. TOTP Secret: XXXXXXXX"
 */
export async function setupAdmin(email: string, password: string): Promise<string> {
  const { data } = await api.post<string>('/admin/setup', { email, password })
  return data
}

/**
 * POST /admin/verify-totp  { email, code }
 * Backend returns a plain JWT string
 */
export async function verifyTotp(email: string, code: string): Promise<string> {
  const { data } = await api.post<string>('/admin/verify-totp', { email, code })
  return data
}

/**
 * POST /auth/login  { email, password }
 * Backend returns { token, role, firstLogin }
 */
export async function loginAdmin(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

/**
 * Set the Authorization token on the Axios instance.
 * Alias for setToken — kept for backward compatibility with legacy pages.
 */
export function setAuthToken(token: string | null): void {
  setToken(token)
}

export default api
