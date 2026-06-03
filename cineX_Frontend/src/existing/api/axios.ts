import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:9000',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT from whatever mechanism calls setAuthToken(token)
let _token = null
export const setAuthToken = (t) => { _token = t }

api.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Trigger logout — components listen to AuthContext for this
      window.dispatchEvent(new Event('cinex:unauthorized'))
    }
    return Promise.reject(err)
  }
)

export default api
