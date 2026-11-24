import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Register.css'

const universities = [
  'Cairo University', 'Alexandria University', 'Ain Shams University',
  'Al-Azhar University', 'Assiut University', 'Tanta University',
  'Mansoura University', 'Zagazig University', 'Helwan University',
  'Minia University', 'Menoufia University', 'Suez Canal University',
  'South Valley University', 'Benha University', 'Fayoum University',
  'Beni Suef University', 'Kafrelsheikh University', 'Sohag University',
  'Port Said University', 'Damanhour University', 'Aswan University',
  'Damietta University', 'Suez University', 'Arish University',
  'New Valley University', 'Matrouh University', 'Luxor University',
  'Hurghada University', 'Capital University', 'Sadat City University',
]

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

export default function Register({ onRegister, loginUrl }) {
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
    const allowed = !file || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    input.setCustomValidity(allowed ? '' : 'Choose a JPG, PNG, or WebP image.')
    if (!allowed) input.reportValidity()
    setPhoto(allowed && file ? file : null)
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
    if (!onRegister) {
      setMessage('Form checked. Registration will be available when the server is connected.')
      return
    }

    setIsSubmitting(true)
    setMessage('')
    try {
      const photoInput = event.currentTarget.elements.photo
      await onRegister({ ...form, photo })
      photoInput.value = ''
      setPhoto(null)
      setForm(initialForm)
      setConfirmPassword('')
      setShowPassword(false)
      setMessage('Your account has been created.')
    } catch {
      setMessage('We couldn’t create your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="register-page signup-page">
      <section className="register-card" aria-labelledby="register-heading">
        <header className="register-header">
          <svg width="44" height="44" viewBox="0 0 32 32" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"
            strokeLinecap="round" aria-hidden="true">
            <path d="m2 12 14-7 14 7-14 7z M7 15v6c5 6 13 6 18 0v-6 M29 13v7" />
          </svg>
          <h1 id="register-heading">Create Account</h1>
          <p>Demo account for this tab. Use test details.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <fieldset className="register-fields" disabled={isSubmitting}>
            <div className="register-names">
              <Field name="firstName" label="First Name">
                <input {...inputProps('firstName')} autoComplete="given-name" placeholder="First name" pattern={'.*\\S.*'} />
              </Field>
              <Field name="lastName" label="Last Name">
                <input {...inputProps('lastName')} autoComplete="family-name" placeholder="Last name" pattern={'.*\\S.*'} />
              </Field>
            </div>
            <Field name="photo" label="Profile photo (optional)">
              <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange} />
            </Field>
            <Field name="username" label="Username">
              <input {...inputProps('username')} autoComplete="username" placeholder="Enter your username" pattern={'.*\\S.*'} />
            </Field>
            <Field name="email" label="Email">
              <input {...inputProps('email')} type="email" autoComplete="email" placeholder="example@email.com" />
            </Field>
            <Field name="birthDate" label="Birth Date">
              <div className="register-date">
                <input {...inputProps('birthDate')} type="date" autoComplete="bday" />
                {!form.birthDate && <span aria-hidden="true">Select your birth date</span>}
              </div>
            </Field>
            <Field name="password" label="Password">
              <div className="register-password">
                <input {...inputProps('password')} type={showPassword ? 'text' : 'password'}
                  aria-invalid={passwordsMismatch}
                  aria-describedby={passwordsMismatch ? 'password-error' : undefined}
                  autoComplete="new-password" placeholder="Enter your password" />
                <button type="button" aria-controls="password" aria-pressed={showPassword}
                  aria-label="Show password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
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
            <Field name="university" label="University">
              <select {...inputProps('university')}>
                <option value="" disabled>Select your university</option>
                {universities.map(university => <option key={university}>{university}</option>)}
                <option value="other">other</option>
              </select>
            </Field>
            {form.university === 'other' && (
              <Field name="otherUniversity" label="University Name">
                <input {...inputProps('otherUniversity')} placeholder="Enter your university name"
                  pattern={'.*\\S.*'} title="Enter your university name."
                  aria-describedby="university-hint" />
                <small id="university-hint">Enter the name of your university manually.</small>
              </Field>
            )}
            <Field name="major" label="Major">
              <input {...inputProps('major')} placeholder="Enter your major" pattern={'.*\\S.*'} />
            </Field>
            <Field name="gender" label="Gender">
              <select {...inputProps('gender')}>
                <option value="" disabled>Select your gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </Field>
            <button className="register-submit" type="submit">
              {isSubmitting ? 'Registering…' : 'Register'}
            </button>
          </fieldset>
        </form>
        <p className="register-status" role="status">{message}</p>
        <footer className="register-footer">
          Already have an account?{' '}
          {loginUrl ? <a href={loginUrl}>Login</a> : (
            <button type="button" onClick={() => setMessage('The login page is not available yet.')}>Login</button>
          )}
          {' · '}<Link to="/">Home</Link>
        </footer>
      </section>
    </main>
  )
}
