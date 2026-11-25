import { useEffect, useRef, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Profile from './pages/Profile.jsx'
import Register from './pages/Register.jsx'
import api from './services/api.js'

function AppRoutes() {
  const navigate = useNavigate()
  const [user, setUser] = useState(undefined)
  const [logoutError, setLogoutError] = useState('')
  const registrationPhoto = useRef(null)

  useEffect(() => {
    const controller = new AbortController()

    api.get('/me', { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setUser(data.student ?? null)
      })
      .catch(() => {
        if (!controller.signal.aborted) setUser(null)
      })

    return () => controller.abort()
  }, [])

  async function register({ photo, ...profile }) {
    await api.post('/register', profile)
    registrationPhoto.current = photo ? { email: profile.email.trim().toLowerCase(), file: photo } : null
    navigate('/login', { replace: true })
  }

  async function login(credentials) {
    const { data: { student } } = await api.post('/login', credentials)
    const photo = registrationPhoto.current
    setUser(photo?.email === student.email ? { ...student, photo: photo.file } : student)
    setLogoutError('')
    navigate('/profile', { replace: true })
  }

  async function logout() {
    try {
      await api.post('/logout')
      setUser(null)
      setLogoutError('')
      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Log out is unavailable. Please try again.')
    }
  }

  if (user === undefined) return <p role="status">Checking your session…</p>

  return (
    <>
      {logoutError && <p role="alert">{logoutError}</p>}
      <Routes>
        <Route path="/" element={<Home user={user} onLogout={logout} />} />
        <Route path="/register" element={<Register onRegister={register} loginUrl="#/login" />} />
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/profile" element={user
          ? <Profile user={user} onLogout={logout} />
          : <Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}
