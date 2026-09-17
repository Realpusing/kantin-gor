import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import StockIn from './pages/StockIn'
import Sales from './pages/Sales'
import StockCheck from './pages/StockCheck'
import SalesReport from './pages/SalesReport'
import Comparison from './pages/Comparison'

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stock-in" element={<StockIn />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/stock-check" element={<StockCheck />} />
        <Route path="/sales-report" element={<SalesReport />} />
        <Route path="/products" element={<ProtectedRoute adminOnly><Products /></ProtectedRoute>} />
        <Route path="/comparison" element={<ProtectedRoute adminOnly><Comparison /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' }
        }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}