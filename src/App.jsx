import { NavLink, Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './components/Dashboard'
import ProgressChart from './components/ProgressChart'
import './App.css'

function Header() {
  const { user, signOut } = useAuth()
  if (!user) return null

  return (
    <header className="app-header">
      <nav>
        <NavLink to="/">Log</NavLink>
        <NavLink to="/progress">Progress</NavLink>
      </nav>
      <button type="button" onClick={signOut}>
        Sign out
      </button>
    </header>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <ProgressChart />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main className="app-main">
          <AppRoutes />
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}
