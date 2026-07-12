import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin h-8 w-8 text-primary border-4 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user is a customer, redirect to customer dashboard
    if (user.role === 'customer') {
      return <Navigate to="/dashboard" replace />
    }
    // If user is admin/super_admin, redirect to admin dashboard
    if (user.role === 'admin' || user.role === 'super_admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    return <Navigate to="/" replace />
  }

  return children
}
