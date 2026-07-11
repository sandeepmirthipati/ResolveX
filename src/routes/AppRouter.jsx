import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Layouts
import PublicLayout from '@/layouts/PublicLayout'
import CustomerDashboardLayout from '@/layouts/CustomerDashboardLayout'
import AdminDashboardLayout from '@/layouts/AdminDashboardLayout'

// Public
import LandingPage from '@/pages/LandingPage'

// Auth helpers (still used by LandingPage inline card)
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'

// Customer
import CustomerDashboard from '@/pages/customer/CustomerDashboard'
import RaiseComplaint from '@/pages/customer/RaiseComplaint'
import ComplaintHistory from '@/pages/customer/ComplaintHistory'
import TrackComplaint from '@/pages/customer/TrackComplaint'
import Profile from '@/pages/customer/Profile'

// Admin
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminComplaints from '@/pages/admin/AdminComplaints'
import AdminComplaintDetails from '@/pages/admin/AdminComplaintDetails'
import Analytics from '@/pages/admin/Analytics'
import NotificationLogs from '@/pages/admin/NotificationLogs'
import AdminSettings from '@/pages/admin/AdminSettings'

// 404
import NotFound from '@/pages/NotFound'

// Route guards
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Password reset flows (standalone, no layout wrapper) */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Customer Dashboard Routes */}
        <Route element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/dashboard/raise" element={<RaiseComplaint />} />
          <Route path="/dashboard/history" element={<ComplaintHistory />} />
          <Route path="/dashboard/track" element={<TrackComplaint />} />
          <Route path="/dashboard/profile" element={<Profile />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <AdminDashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/complaints" element={<AdminComplaints />} />
          <Route path="/admin/complaints/:id" element={<AdminComplaintDetails />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/notifications" element={<NotificationLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
