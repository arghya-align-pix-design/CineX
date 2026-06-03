import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './existing/context/AuthContext'
import { ProtectedRoute, RoleRoute } from './existing/components/ProtectedRoute'
//import { Toaster } from './components/ui/toaster'

import LoginPage    from './existing/pages/LoginPage'
import RegisterPage from './existing/pages/RegisterPage'

// Vendor pages — lazy loaded
import { lazy, Suspense } from 'react'
// const VendorDashboard    = lazy(() => import('./pages/vendor/VendorDashboardPage'))
// const CreateTheatre      = lazy(() => import('./pages/vendor/CreateTheatrePage'))
// const LayoutBuilder      = lazy(() => import('./pages/vendor/LayoutBuilderPage'))
// const ScheduleShow       = lazy(() => import('./pages/vendor/ScheduleShowPage'))

// Consumer pages — lazy loaded
// const BrowseShows        = lazy(() => import('./pages/consumer/BrowseShowsPage'))
// const ShowDetail         = lazy(() => import('./pages/consumer/ShowDetailPage'))
// const BookingConfirm     = lazy(() => import('./pages/consumer/BookingConfirmPage'))
// const MyBookings         = lazy(() => import('./pages/consumer/MyBookingsPage'))

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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
        {/* <Toaster /> */}
          <Routes>
            {/* Public */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Vendor */}
            {/* <Route path="/vendor/dashboard" element={
              <RoleRoute role="VENDOR"><VendorDashboard /></RoleRoute>
            }/>
            <Route path="/vendor/theatres/new" element={
              <RoleRoute role="VENDOR"><CreateTheatre /></RoleRoute>
            }/>
            <Route path="/vendor/theatres/:theatreId/layout" element={
              <RoleRoute role="VENDOR"><LayoutBuilder /></RoleRoute>
            }/>
            <Route path="/vendor/shows/new" element={
              <RoleRoute role="VENDOR"><ScheduleShow /></RoleRoute>
            }/> */}

            {/* Consumer */}
            {/* <Route path="/shows" element={
              <ProtectedRoute><BrowseShows /></ProtectedRoute>
            }/>
            <Route path="/shows/:showId" element={
              <ProtectedRoute><ShowDetail /></ProtectedRoute>
            }/>
            <Route path="/bookings/:bookingRef" element={
              <ProtectedRoute><BookingConfirm /></ProtectedRoute>
            }/>
            <Route path="/bookings" element={
              <ProtectedRoute><MyBookings /></ProtectedRoute>
            }/> */}

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
