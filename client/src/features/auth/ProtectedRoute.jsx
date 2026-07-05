import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { isRoleAllowed, shouldRedirectUnauthenticated } from './authUtils'

export default function ProtectedRoute({ allowedRoles }) {
  const { token, user } = useAuth()
  const location = useLocation()

  if (shouldRedirectUnauthenticated({ token, pathname: location.pathname })) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!isRoleAllowed(user, allowedRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
