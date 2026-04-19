import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FullPageSpinner } from '../components/Spinner'

export default function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user.role === 'FARMER') return <Navigate to="/farmer" replace />
  return <Navigate to="/peeler" replace />
}
