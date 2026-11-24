import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Register.css'
import './Login.css'

const invalidCredentials = 'invalid email or password'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
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
    if (!event.currentTarget.checkValidity()) {
      setError(invalidCredentials)
      return
    }

    if (!onLogin) {
      setMessage('Sign-in will be available when the server is connected.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await onLogin({ email: email.trim(), password })
      if (result === false) {
        setError(invalidCredentials)
        return
      }
      setPassword('')
      setShowPassword(false)
      setMessage('You are signed in.')
    } catch (failure) {
      const status = failure?.response?.status ?? failure?.status
      setError(status === 401 ? invalidCredentials : 'Sign-in is unavailable. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="register-page login-page">
      <section className="register-card login-card" aria-labelledby="login-heading">
        <header className="register-header">
          <h1 id="login-heading">Login</h1>
          <p>Use the demo account you registered in this tab.</p>
        </header>

        <form noValidate onSubmit={handleSubmit} onChange={clearFeedback}>
          <fieldset className="register-fields" disabled={isSubmitting}>
            <div className="register-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
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
              <button
                type="button"
                className="login-forgot"
                onClick={() => {
                  setError('')
                  setMessage('Password reset is not available yet.')
                }}
              >
                Forgot password?
              </button>
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
