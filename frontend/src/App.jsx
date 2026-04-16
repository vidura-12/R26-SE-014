import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import RoleRedirect from './pages/RoleRedirect'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AdminDashboard from './pages/admin/Dashboard'
import Farmers from './pages/admin/Farmers'
import Peelers from './pages/admin/Peelers'
import Harvests from './pages/admin/Harvests'
import Optimization from './pages/admin/Optimization'
import Schedules from './pages/admin/Schedules'
import AdminProfile from './pages/admin/Profile'
import AdminUsers from './pages/admin/Users'
import FarmerHome from './pages/farmer/FarmerHome'
import FarmerHarvestRequests from './pages/farmer/HarvestRequests'
import FarmerProfile from './pages/farmer/Profile'
import PeelerHome from './pages/peeler/PeelerHome'
import PeelerRoutes from './pages/peeler/PeelerRoutes'
import MyGroup from './pages/peeler/MyGroup'
import PeelerAccount from './pages/peeler/Account'

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        gap={8}
        toastOptions={{
          classNames: {
            toast: 'cs-toast',
            success: 'cs-toast--success',
            error: 'cs-toast--error',
            warning: 'cs-toast--warning',
            info: 'cs-toast--info',
            title: 'cs-toast__title',
            description: 'cs-toast__desc',
            actionButton: 'cs-toast__action',
            closeButton: 'cs-toast__close',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin routes */}
        <Route element={<ProtectedRoute roles={['ADMIN']}><Layout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/farmers" element={<Farmers />} />
          <Route path="/admin/peelers" element={<Peelers />} />
          <Route path="/admin/harvests" element={<Harvests />} />
          <Route path="/admin/optimization" element={<Optimization />} />
          <Route path="/admin/schedules" element={<Schedules />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>

        {/* Farmer routes */}
        <Route element={<ProtectedRoute roles={['FARMER']}><Layout /></ProtectedRoute>}>
          <Route path="/farmer" element={<FarmerHome />} />
          <Route path="/farmer/harvests" element={<FarmerHarvestRequests />} />
          <Route path="/farmer/profile" element={<FarmerProfile />} />
        </Route>

        {/* Peeler routes */}
        <Route element={<ProtectedRoute roles={['PEELER']}><Layout /></ProtectedRoute>}>
          <Route path="/peeler" element={<PeelerHome />} />
          <Route path="/peeler/routes" element={<PeelerRoutes />} />
          <Route path="/peeler/group" element={<MyGroup />} />
          <Route path="/peeler/account" element={<PeelerAccount />} />
        </Route>

        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center bg-cinnamon-50">
            <div className="text-center">
              <p className="text-6xl font-display font-bold text-cinnamon-300 mb-4">403</p>
              <p className="text-gray-500">You don't have permission to access this page.</p>
              <a href="/login" className="btn-primary mt-4 inline-block">Go to login</a>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
