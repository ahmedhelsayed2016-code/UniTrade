import { useState } from 'react'
import { Link } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import PhotoUpload from '../components/PhotoUpload.jsx'
import { apiMessage, passwordError, passwordHint, photoError, universities } from '../services/authForm.js'
import './Register.css'

const initialForm = {
  firstName: '', lastName: '', username: '', email: '', birthDate: '',
  password: '', university: '', otherUniversity: '', major: '', gender: '',
}

function Field({ name, label, children }) {
  return (
    <div className="register-field">
      <label htmlFor={name}>{label}</label>
      {children}
    </div>
  )
}

export default function Register({ onRegister }) {
  const [form, setForm] = useState(initialForm)
  const [photo, setPhoto] = useState(null)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const passwordsMismatch = confirmPassword !== '' && confirmPassword !== form.password

  function handlePhotoChange(event) {
    const input = event.currentTarget
    const file = input.files[0]
    const error = file ? photoError(file) : ''
    input.setCustomValidity(error)
    if (error) input.reportValidity()
    setPhoto(error ? null : file ?? null)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm(previous => {
      const updated = { ...previous, [name]: value }
      if (name === 'university' && value !== 'other') updated.otherUniversity = ''
      return updated
    })
    setMessage('')
  }

  function inputProps(name) {
    return { id: name, name, value: form[name], onChange: handleChange, required: true }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return
    if (confirmPassword !== form.password) {
      event.currentTarget.elements.confirmPassword.focus()
      return
    }
    const validation = passwordError(form.password)
    if (validation) {
      setMessage(validation)
      return
    }
    setIsSubmitting(true)
    setMessage('')
    try {
      await onRegister({ ...form, photo })
    } catch (error) {
      setMessage(apiMessage(error, 'We couldn’t create your account. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="register-page signup-page">
      <section className="register-card" aria-labelledby="register-heading">
        <header className="register-header">
          <Brand className="account-brand" />
          <h1 id="register-heading">Create Account</h1>
          <p>Create an account to sign in and view your profile.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <fieldset className="register-fields" disabled={isSubmitting}>
            <div className="register-names">
              <Field name="firstName" label="First Name">
                <input {...inputProps('firstName')} maxLength={60} autoComplete="given-name" placeholder="First name" pattern={'.*\\S.*'} />
              </Field>
              <Field name="lastName" label="Last Name">
                <input {...inputProps('lastName')} maxLength={60} autoComplete="family-name" placeholder="Last name" pattern={'.*\\S.*'} />
              </Field>
            </div>
            <Field name="username" label="Username">
              <input {...inputProps('username')} autoComplete="username" placeholder="Enter your username"
                maxLength={30} pattern={'[A-Za-z0-9_.\\-]{3,30}'} title="Use 3 to 30 letters, numbers, dots, underscores, or dashes." />
            </Field>
            <Field name="email" label="Email">
              <input {...inputProps('email')} type="email" maxLength={254} autoComplete="email" placeholder="Your email address" />
            </Field>
            <Field name="birthDate" label="Birth Date">
              <div className="register-date">
                <input {...inputProps('birthDate')} type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} />
                {!form.birthDate && <span aria-hidden="true">Select your birth date</span>}
              </div>
            </Field>
            <Field name="university" label="University">
              <select {...inputProps('university')}>
                <option value="" disabled>Select your university</option>
                {universities.map(university => <option key={university}>{university}</option>)}
                <option value="other">Other</option>
              </select>
            </Field>
            {form.university === 'other' && (
              <Field name="otherUniversity" label="University Name">
                <input {...inputProps('otherUniversity')} maxLength={120} placeholder="Enter your university name"
                  pattern={'.*\\S.*'} title="Enter your university name." />
              </Field>
            )}
            <Field name="major" label="Major">
              <input {...inputProps('major')} maxLength={120} placeholder="Enter your major" pattern={'.*\\S.*'} />
            </Field>
            <Field name="gender" label="Gender">
              <select {...inputProps('gender')}>
                <option value="" disabled>Select your gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </Field>
            <div className="register-names">
              <Field name="password" label="Choose a strong password">
                <div className="register-password">
                  <input {...inputProps('password')} type={showPassword ? 'text' : 'password'}
                    aria-invalid={passwordsMismatch}
                    aria-describedby={passwordsMismatch ? 'password-error password-hint' : 'password-hint'}
                    autoComplete="new-password" placeholder="Enter your password" />
                  <button type="button" aria-controls="password" aria-pressed={showPassword}
                    aria-label="Show password" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <small id="password-hint">{passwordHint}</small>
              </Field>
              <Field name="confirmPassword" label="Confirm Password">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  aria-invalid={passwordsMismatch}
                  aria-describedby={passwordsMismatch ? 'password-error' : undefined}
                  required
                  onChange={event => {
                    setConfirmPassword(event.target.value)
                    setMessage('')
                  }}
                />
                {passwordsMismatch && (
                  <p id="password-error" className="password-error" role="alert">Passwords don’t match</p>
                )}
              </Field>
            </div>
            <PhotoUpload name="photo" label="Profile photo" onChange={handlePhotoChange} />
            <button className="register-submit" type="submit">
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </fieldset>
        </form>
        <p className="register-status" role="status">{message}</p>
        <footer className="register-footer">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
          {' · '}<Link to="/">Home</Link>
        </footer>
      </section>
    </main>
  )
}
