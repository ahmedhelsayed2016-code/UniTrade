import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import { apiMessage } from '../services/authForm.js'
import './Register.css'
import './Login.css'

const invalidCredentials = 'Check your email and password, then try again.'

export default function Login({ onLogin }) {
  const { state } = useLocation()
  const [email, setEmail] = useState(state?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState(state?.message ?? '')
  const [error, setError] = useState('')
  const hasInvalidCredentials = error === invalidCredentials

  function clearFeedback() {
    setError('')
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return

    clearFeedback()
    if (!event.currentTarget.checkValidity() || new TextEncoder().encode(password).length > 72) {
      setError(invalidCredentials)
      return
    }

    setIsSubmitting(true)
    try {
      await onLogin({ email: email.trim(), password })
    } catch (failure) {
      const status = failure?.response?.status ?? failure?.status
      setError(status === 401 ? invalidCredentials : apiMessage(failure, 'Sign-in is unavailable. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="register-page login-page">
      <section className="register-card login-card" aria-labelledby="login-heading">
        <header className="register-header">
          <Brand className="account-brand" />
          <h1 id="login-heading">Login</h1>
          <p>Use the email and password you registered with.</p>
        </header>

        <form noValidate onSubmit={handleSubmit} onChange={clearFeedback}>
          <fieldset className="register-fields" disabled={isSubmitting}>
            <div className="register-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                maxLength={254}
                autoComplete="username"
                placeholder="example@email.com"
                value={email}
                aria-invalid={hasInvalidCredentials}
                aria-describedby={hasInvalidCredentials ? 'login-error' : undefined}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="login-password">Password</label>
              <div className="register-password">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  aria-invalid={hasInvalidCredentials}
                  aria-describedby={hasInvalidCredentials ? 'login-error' : undefined}
                  onChange={event => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label="Show password"
                  aria-controls="login-password"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <Link className="login-forgot" to="/forgot-password" state={{ email }}>Forgot password?</Link>
            </div>

            <button className="register-submit" type="submit">
              {isSubmitting ? 'Signing in…' : 'Login'}
            </button>
          </fieldset>
        </form>

        {error && <p id="login-error" className="register-status login-error" role="alert">{error}</p>}
        <p className="register-status" role="status">{message}</p>
        <footer className="register-footer">
          Don’t have an account? <Link to="/register">Create Account</Link>
          {' · '}<Link to="/">Home</Link>
        </footer>
      </section>
    </main>
  )
}
