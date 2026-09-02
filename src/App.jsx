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
      <strong className="app-title">Fitness Tracker</strong>
      <nav className="header-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
          Log
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          Progress
        </NavLink>
      </nav>
      <button type="button" onClick={signOut}>
        Sign out
      </button>
    </header>
  )
}

function BottomNav() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
        <span className="bottom-nav-icon" aria-hidden="true">🏋️</span>
        Log
      </NavLink>
      <NavLink to="/progress" className={({ isActive }) => (isActive ? 'active' : undefined)}>
        <span className="bottom-nav-icon" aria-hidden="true">📈</span>
        Progress
      </NavLink>
    </nav>
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
        <BottomNav />
      </BrowserRouter>
    </AuthProvider>
  )
}
