import { Link } from 'react-router-dom'
import './Register.css'
import './Home.css'

export default function Home({ user, onLogout }) {
  return (
    <main className="register-page home-page">
      <section className="register-card home-card" aria-labelledby="home-heading">
        <header className="register-header">
          <h1 id="home-heading">
            {user ? `Welcome back, ${user.firstName || user.username}!` : 'Welcome'}
          </h1>
          <p>{user ? 'View your personal and university details.' : 'Create an account or log in to view your profile.'}</p>
        </header>
        <div className="home-actions">
          {user ? (
            <>
              <Link className="home-primary" to="/profile">My Profile</Link>
              <button type="button" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link className="home-primary" to="/register">Create Account</Link>
              <Link to="/login">Login</Link>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
