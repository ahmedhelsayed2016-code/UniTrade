import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Register.css'
import './Profile.css'

function ProfilePhoto({ file }) {
  const image = useRef(null)
  useEffect(() => {
    const url = URL.createObjectURL(file)
    image.current.hidden = false
    image.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  return <img ref={image} alt="" onError={event => { event.currentTarget.hidden = true }} />
}

function ProfileDetails({ title, fields }) {
  return (
    <section className="profile-section">
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

export default function Profile({ user, onLogout }) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  const initials = [user?.firstName, user?.lastName]
    .map(name => name?.trim().charAt(0)).join('').toUpperCase()
  const university = user?.university === 'other' ? user.otherUniversity : user?.university

  return (
    <main className="register-page profile-page">
      <article className="register-card profile-card">
        <header className="profile-header">
          <span className="profile-avatar" aria-hidden="true">
            {initials || (
              <svg viewBox="0 0 32 32" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="16" cy="10" r="5" />
                <path d="M5 28a11 11 0 0 1 22 0" />
              </svg>
            )}
            {user?.photo && <ProfilePhoto file={user.photo} />}
          </span>
          <div>
            <Link to="/" className="profile-home">Home</Link>
            <h1>{fullName || 'My Profile'}</h1>
            {user?.username && <p>@{user.username}</p>}
            {!user && <p>Sign in to see your profile details.</p>}
          </div>
          {user
            ? <button className="profile-login" type="button" onClick={onLogout}>Log out</button>
            : <Link className="profile-login" to="/login">Login</Link>}
        </header>
        <ProfileDetails title="Personal information" fields={[
          ['First name', user?.firstName], ['Last name', user?.lastName],
          ['Email', user?.email], ['Username', user?.username],
          ['Birth date', user?.birthDate?.split('T')[0]], ['Gender', user?.gender],
        ]} />
        <ProfileDetails title="Education" fields={[
          ['University', university], ['Major', user?.major],
        ]} />
      </article>
    </main>
  )
}
