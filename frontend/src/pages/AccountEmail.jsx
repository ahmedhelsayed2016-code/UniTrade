import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import api from '../services/api.js'
import { apiMessage, passwordError, passwordHint } from '../services/authForm.js'
import './Register.css'
import './Login.css'

const pages = {
  forgot: { title: 'Forgot password', endpoint: '/forgot-password', action: 'Send reset code' },
  code: { title: 'Enter reset code', endpoint: '/verify-reset-code', action: 'Verify code' },
  reset: { title: 'Reset password', endpoint: '/reset-password', action: 'Save new password' },
}

export default function AccountEmail({ onReset }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [step, setStep] = useState('forgot')
  const [email, setEmail] = useState(state?.email ?? '')
  const [resetToken, setResetToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { title, endpoint, action } = pages[step]

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const password = form.get('password')
    if (step === 'reset') {
      const validation = passwordError(password)
      if (validation || password !== form.get('confirmPassword')) {
        setError(validation || 'Passwords don’t match.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      let body = { email: form.get('email') }
      if (step === 'code') body = { email, code: form.get('code') }
      if (step === 'reset') body = { token: resetToken, password }
      const { data } = await api.post(endpoint, body)

      if (step === 'forgot') {
        setEmail(body.email)
        setStep('code')
      }
      if (step === 'code') {
        // Keep the reset token out of the URL and browser storage.
        setResetToken(data.resetToken)
        setStep('reset')
      }
      if (step === 'reset') {
        onReset()
        navigate('/login', { replace: true, state: { message: data.message } })
      } else {
        setMessage(data.message ?? '')
      }
    } catch (failure) {
      setError(apiMessage(failure, 'The request failed. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function startAgain() {
    setStep('forgot')
    setResetToken('')
    setError('')
    setMessage('')
  }

  return (
    <main className="register-page login-page">
      <section className="register-card login-card" aria-labelledby="account-email-heading">
        <header className="register-header">
          <Brand className="account-brand" />
          <h1 id="account-email-heading">{title}</h1>
          {step === 'forgot' && <p>Enter the email address you use for UniTrade.</p>}
          {step === 'code' && <p>Enter the code sent to {email}. It expires in 10 minutes.</p>}
        </header>

        <form key={step} onSubmit={handleSubmit}>
          <fieldset className="register-fields" disabled={isSubmitting}>
            {step === 'forgot' && (
              <div className="register-field">
                <label htmlFor="account-email">Email</label>
                <input id="account-email" name="email" type="email" maxLength={254} autoComplete="email"
                  defaultValue={email} required />
              </div>
            )}
            {step === 'code' && (
              <div className="register-field">
                <label htmlFor="account-code">Six-digit code</label>
                <input id="account-code" name="code" inputMode="numeric" autoComplete="one-time-code"
                  maxLength={6} pattern="[0-9]{6}" required />
              </div>
            )}
            {step === 'reset' && (
              <>
                <div className="register-field">
                  <label htmlFor="account-password">Choose a strong password</label>
                  <input id="account-password" name="password" type="password" required
                    autoComplete="new-password" aria-describedby="reset-password-hint" />
                  <small id="reset-password-hint">{passwordHint}</small>
                </div>
                <div className="register-field">
                  <label htmlFor="account-confirm-password">Confirm new password</label>
                  <input id="account-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required />
                </div>
              </>
            )}
            <button className="register-submit" type="submit">{isSubmitting ? 'Please wait…' : action}</button>
          </fieldset>
        </form>

        {error && <p role="alert" className="register-status login-error">{error}</p>}
        <p role="status" className="register-status">{message}</p>
        <footer className="register-footer">
          <Link to="/login">Back to login</Link>
          {(step === 'code' || step === 'reset') && <> {' · '}<button type="button" disabled={isSubmitting} onClick={startAgain}>Request a new code</button></>}
        </footer>
      </section>
    </main>
  )
}
