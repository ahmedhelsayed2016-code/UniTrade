import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Profile from './pages/Profile.jsx'
import Register from './pages/Register.jsx'
import AccountEmail from './pages/AccountEmail.jsx'
import api from './services/api.js'
import { readPhoto } from './services/authForm.js'

function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()
  const navigationType = useNavigationType()
  const previousIndex = useRef(null)
  const logoutPending = useRef(false)
  const [user, setUser] = useState(undefined)
  const [logoutError, setLogoutError] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
    const { data } = await api.post('/register', { ...profile, photo: photo ? await readPhoto(photo) : null })
    navigate('/login', { replace: true, state: { message: data.message, email: profile.email } })
  }

  async function login(credentials) {
    const { data: { student } } = await api.post('/login', credentials)
    setUser(student)
    setLogoutError('')
    navigate('/profile')
  }

  async function updateProfile({ photo, ...profile }) {
    try {
      const { data } = await api.patch('/me', { ...profile, photo: photo ? await readPhoto(photo) : null })
      setUser(data.student)
    } catch (error) {
      if (error.response?.status === 401) setUser(null)
      throw error
    }
  }

  async function logout(clearImmediately = false) {
    if (logoutPending.current) return
    logoutPending.current = true
    setIsLoggingOut(true)
    if (clearImmediately) setUser(null)
    try {
      await api.post('/logout')
      setUser(null)
      setLogoutError('')
      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Log out is unavailable. Please try again.')
      if (clearImmediately) navigate('/login', { replace: true })
    } finally {
      logoutPending.current = false
      setIsLoggingOut(false)
    }
  }

  const logoutOnBack = useEffectEvent(() => {
    if (user) void logout(true)
  })

  useLayoutEffect(() => {
    // React Router's history index distinguishes Back from Forward and a fresh page load.
    const index = window.history.state?.idx
    const lastIndex = previousIndex.current
    previousIndex.current = index
    if (navigationType === 'POP' && Number.isInteger(lastIndex) && index < lastIndex) logoutOnBack()
  }, [location, navigationType])

  if (isLoggingOut) return <p role="status">Logging out…</p>
  if (user === undefined) return <p role="status">Checking your session…</p>

  return (
    <>
      {logoutError && <p role="alert">{logoutError}</p>}
      <Routes>
        <Route path="/" element={<Home user={user} onLogout={() => logout()} />} />
        <Route path="/register" element={<Register onRegister={register} />} />
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/forgot-password" element={<AccountEmail onReset={() => setUser(null)} />} />
        <Route path="/profile" element={user
          ? <Profile user={user} onLogout={() => logout()} onSave={updateProfile} />
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
