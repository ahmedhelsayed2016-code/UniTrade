import { useState } from 'react'
import { Link } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import PhotoUpload from '../components/PhotoUpload.jsx'
import { apiMessage, photoError, universities } from '../services/authForm.js'
import './Register.css'
import './Profile.css'

function ProfileDetails({ title, fields, className = '' }) {
  return (
    <section className={`profile-section profile-details ${className}`}>
      <h2>{title}</h2>
      <dl>
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function ProfileEditor({ user, onSave, onClose }) {
  const [university, setUniversity] = useState(user.university ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  async function save(event) {
    event.preventDefault()
    if (isSaving) return
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const photo = event.currentTarget.elements.photo.files[0]
    const validation = photo ? photoError(photo) : ''
    if (validation) return setError(validation)
    setIsSaving(true)
    setError('')
    try {
      await onSave({ ...values, photo })
      onClose('Your profile was saved.')
    } catch (failure) {
      setError(apiMessage(failure, 'We couldn’t save your profile. Please try again.'))
      setIsSaving(false)
    }
  }

  return (
    <form className="profile-section" onSubmit={save}>
      <h2>Edit profile</h2>
      <fieldset className="register-fields profile-fields" disabled={isSaving}>
        <div className="register-names">
          <label className="register-field">First name<input name="firstName" defaultValue={user.firstName} maxLength={60} required /></label>
          <label className="register-field">Last name<input name="lastName" defaultValue={user.lastName} maxLength={60} required /></label>
        </div>
        <label className="register-field">Username<input name="username" defaultValue={user.username} maxLength={30}
          pattern={'[A-Za-z0-9_.\\-]{3,30}'} title="Use 3 to 30 letters, numbers, dots, underscores, or dashes." required /></label>
        <div className="register-names">
          <label className="register-field">University
            <select name="university" value={university} onChange={event => setUniversity(event.target.value)} required>
              <option value="" disabled>Select your university</option>
              {user.university && user.university !== 'other' && !universities.includes(user.university) && <option>{user.university}</option>}
              {universities.map(name => <option key={name}>{name}</option>)}
              <option value="other">Other</option>
            </select>
          </label>
          <label className="register-field">Major<input name="major" defaultValue={user.major} maxLength={120} required /></label>
        </div>
        {university === 'other' && <label className="register-field">University name
          <input name="otherUniversity" defaultValue={user.otherUniversity} maxLength={120} required />
        </label>}
        <PhotoUpload name="photo" label="Replace profile photo" />
        <div className="profile-actions">
          <button className="register-submit" type="submit">{isSaving ? 'Saving…' : 'Save changes'}</button>
          <button className="profile-secondary" type="button" onClick={() => onClose('')}>Cancel</button>
        </div>
      </fieldset>
      {error && <p role="alert" className="register-status password-error">{error}</p>}
    </form>
  )
}

export default function Profile({ user, onLogout, onSave }) {
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  const initials = [user?.firstName, user?.lastName]
    .map(name => name?.trim().charAt(0)).join('').toUpperCase()
  const university = user?.university === 'other' ? user.otherUniversity : user?.university

  return (
    <main className="register-page profile-page">
      <div className="profile-navigation">
        <Brand className="profile-brand" />
        <Link to="/" className="profile-home"><span aria-hidden="true">←</span> Home</Link>
      </div>
      <article className="register-card profile-card">
        <header className="profile-header">
          <span className="profile-avatar" aria-hidden="true">
            {initials || (
              <svg viewBox="0 0 32 32" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="16" cy="10" r="5" />
                <path d="M5 28a11 11 0 0 1 22 0" />
              </svg>
            )}
            {user?.photoUrl && <img key={user.photoUrl} src={user.photoUrl} alt="" onError={event => { event.currentTarget.hidden = true }} />}
          </span>
          <div className="profile-identity">
            <h1>{fullName || 'My Profile'}</h1>
            {user?.username && <p>@{user.username}</p>}
            {!user && <p>Sign in to see your profile details.</p>}
          </div>
          {user
            ? <div className="profile-menu">
              {!editing && <button className="profile-secondary" type="button" onClick={() => { setMessage(''); setEditing(true) }}>Edit profile</button>}
              <button className="profile-login" type="button" onClick={onLogout}>Log out</button>
            </div>
            : <Link className="profile-login" to="/login">Login</Link>}
        </header>
        {message && <p role="status" className="profile-notice">{message}</p>}
        {editing && <ProfileEditor user={user} onSave={onSave} onClose={notice => { setEditing(false); setMessage(notice) }} />}
        <div className="profile-overview">
          <ProfileDetails title="Personal information" fields={[
            ['First name', user?.firstName], ['Last name', user?.lastName],
            ['Email', user?.email], ['Username', user?.username],
            ['Birth date', user?.birthDate?.split('T')[0]], ['Gender', user?.gender],
          ]} />
          <ProfileDetails title="Education" className="profile-education" fields={[
            ['University', university], ['Major', user?.major],
          ]} />
        </div>
      </article>
    </main>
  )
}
