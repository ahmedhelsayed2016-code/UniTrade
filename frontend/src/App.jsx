import { useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Profile from './pages/Profile.jsx'
import Register from './pages/Register.jsx'

async function demoPasswordCheck(password, salt) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256,
  )
  return Array.from(new Uint8Array(bits)).join(',')
}

function DemoRoutes() {
  const navigate = useNavigate()
  const [account, setAccount] = useState(null)
  const [user, setUser] = useState(null)

  async function register({ password, ...profile }) {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const check = await demoPasswordCheck(password, salt)
    setAccount({ profile, salt, check })
    setUser(null)
    navigate('/login', { replace: true })
  }

  async function login({ email, password }) {
    if (!account || email.toLowerCase() !== account.profile.email.trim().toLowerCase()) return false
    if (await demoPasswordCheck(password, account.salt) !== account.check) return false
    setUser(account.profile)
    navigate('/profile', { replace: true })
    return true
  }

  function logout() {
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <Routes>
      <Route path="/" element={<Home user={user} onLogout={logout} />} />
      <Route path="/register" element={<Register onRegister={register} loginUrl="#/login" />} />
      <Route path="/login" element={<Login onLogin={login} />} />
      <Route path="/profile" element={user
        ? <Profile user={user} onLogout={logout} />
        : <Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <DemoRoutes />
    </HashRouter>
  )
}
