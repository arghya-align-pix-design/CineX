import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './existing/context/AuthContext'
import { ProtectedRoute, RoleRoute } from './existing/components/ProtectedRoute'
import { CityProvider } from './hooks/useCity'

// ---------------------------------------------------------------------------
// Auth pages — eager loaded (small, always needed)
// ---------------------------------------------------------------------------
import LoginPage        from './existing/pages/LoginPage'
import RegisterPage     from './existing/pages/RegisterPage'
import OAuthCallback    from './pages/OAuthCallback'

// ---------------------------------------------------------------------------
// Vendor auth — lazy
// ---------------------------------------------------------------------------
const VendorLoginPage   = lazy(() => import('./existing/pages/vendor/VendorLoginPage'))
const VendorSetupPage   = lazy(() => import('./existing/pages/vendor/VendorSetupPage'))

// ---------------------------------------------------------------------------
// Admin auth — lazy
// ---------------------------------------------------------------------------
const AdminLoginPage    = lazy(() => import('./existing/pages/admin/AdminLoginPage'))
const AdminSetupPage    = lazy(() => import('./existing/pages/admin/AdminSetupPage'))

// ---------------------------------------------------------------------------
// Vendor dashboard pages — lazy
// ---------------------------------------------------------------------------
const VendorDashboard  = lazy(() => import('./pages/vendor/VendorDashboardPage'))

// ---------------------------------------------------------------------------
// Consumer pages — lazy (commented until built)
// ---------------------------------------------------------------------------
const BrowseShows      = lazy(() => import('./pages/consumer/BrowseShowsPage'))
const ShowDetail       = lazy(() => import('./pages/consumer/ShowDetailPage'))
const BookingConfirm   = lazy(() => import('./pages/consumer/BookingConfirmPage'))
const MyBookings       = lazy(() => import('./pages/consumer/MyBookingsPage'))
const MovieDetail      = lazy(() => import('./pages/consumer/MovieDetailPage'))

// ---------------------------------------------------------------------------
// Admin dashboard pages — lazy (commented until built)
// ---------------------------------------------------------------------------
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboardPage'))

const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))

// ---------------------------------------------------------------------------
// Full-screen loader
// ---------------------------------------------------------------------------
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center">
      <svg className="animate-spin w-6 h-6 text-[#E8B84B]" viewBox="0 0 24 24" fill="none" aria-label="Loading">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  )
}

const DemoHubPage      = lazy(() => import('./pages/demo/DemoHubPage'))

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <AuthProvider>
      <CityProvider>
        <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ── Public auth & Demo Hub ─────────────────────────────────────── */}
            <Route path="/login"          element={<LoginPage />} />
            <Route path="/register"       element={<RegisterPage />} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />
            <Route path="/oauth/callback"  element={<OAuthCallback />} />
            <Route path="/demo"           element={<ProtectedRoute><DemoHubPage /></ProtectedRoute>} />

            {/* ── Vendor auth ──────────────────────────────────────────────  */}
            <Route path="/vendor/login"  element={<VendorLoginPage />} />
            {/* /vendor/setup requires a valid VENDOR token (set during first login) */}
            <Route path="/vendor/setup"  element={
              <RoleRoute role="VENDOR"><VendorSetupPage /></RoleRoute>
            } />

            {/* ── Admin auth ───────────────────────────────────────────────  */}
            <Route path="/admin/login"   element={<AdminLoginPage />} />
            {/* One-time bootstrap — publicly reachable but backend self-guards after first use */}
            <Route path="/admin/setup"   element={<AdminSetupPage />} />

            {/* ── Vendor dashboard ─────────────────────────────────────────  */}
            <Route path="/vendor/dashboard" element={
              <RoleRoute role="VENDOR"><VendorDashboard /></RoleRoute>
            } />

            {/* ── Consumer pages ──────────────────────────────────────────── */}
            <Route path="/consumer/browse" element={
              <ProtectedRoute><BrowseShows /></ProtectedRoute>
            } />
            <Route path="/movies/:movieId" element={
              <ProtectedRoute><MovieDetail /></ProtectedRoute>
            } />
            <Route path="/shows/:showId" element={
              <ProtectedRoute><ShowDetail /></ProtectedRoute>
            } />
            <Route path="/bookings/:bookingRef" element={
              <ProtectedRoute><BookingConfirm /></ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute><MyBookings /></ProtectedRoute>
            } />

            {/* ── Admin dashboard (uncomment as pages are built) ───────────  */}
            <Route path="/admin/dashboard" element={
              <RoleRoute role="ADMIN"><AdminDashboard /></RoleRoute>
            } />

            {/* ── Fallback ─────────────────────────────────────────────────  */}
            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </Suspense>
      </BrowserRouter>
      </CityProvider>
    </AuthProvider>
  )
}
