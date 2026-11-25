import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import './Home.css'

const listings = [
  { category: 'Textbooks', name: 'Calculus textbook bundle', condition: 'Good condition', price: 'EGP 450', image: '/walnut-books.webp' },
  { category: 'Electronics', name: 'Wireless headphones', condition: 'Like new', price: 'EGP 950', image: '/walnut-headphones.webp' },
  { category: 'University supplies', name: 'Calculator and study kit', condition: 'Good condition', price: 'EGP 320', image: '/walnut-supplies.webp' },
]

const categories = [
  { name: 'Textbooks', description: 'Course books and study guides', icon: 'M12 6c-3-2-6-2-9-1v13c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v13' },
  { name: 'Electronics', description: 'Headphones, laptops, and accessories', icon: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14h2a2 2 0 0 1 2 2v3H6a2 2 0 0 1-2-2v-3Zm16 0h-2a2 2 0 0 0-2 2v3h2a2 2 0 0 0 2-2v-3Z' },
  { name: 'University supplies', description: 'Stationery, calculators, and campus gear', icon: 'm5 17 12-12 3 3L8 20H5v-3Zm8-8 3 3M4 8l4-4 2 2' },
]

function showSection(id) {
  const section = document.getElementById(id)
  section?.focus({ preventScroll: true })
  section?.scrollIntoView({ block: 'start' })
}

export default function Home({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef(null)

  function jumpTo(id) {
    setMenuOpen(false)
    requestAnimationFrame(() => showSection(id))
  }

  function closeOnEscape(event) {
    if (event.key === 'Escape' && menuOpen) {
      setMenuOpen(false)
      menuButton.current?.focus()
    }
  }

  return (
    <div className="market-page">
      <header className="market-header">
        <nav className="market-width market-nav" aria-label="Main navigation" onKeyDown={closeOnEscape}>
          <Brand className="market-brand" onClick={() => setMenuOpen(false)} />
          <button ref={menuButton} className="market-menu-toggle" type="button" aria-controls="market-navigation"
            aria-expanded={menuOpen} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setMenuOpen(open => !open)}>
            <span aria-hidden="true" />
          </button>
          <div className="market-nav-items" id="market-navigation" data-open={menuOpen}>
            <div className="market-links">
              <button type="button" onClick={() => jumpTo('market-categories')}>Categories</button>
              <button type="button" onClick={() => jumpTo('market-listings')}>Listings</button>
            </div>
            <div className="market-account">
              <button type="button" disabled>Favorites</button>
              <button type="button" disabled>Cart</button>
              {user ? <><Link to="/profile" onClick={() => setMenuOpen(false)}>My profile</Link><button type="button" onClick={onLogout}>Log out</button></>
                : <Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>}
            </div>
          </div>
        </nav>
      </header>

      <main className="market-width market-main">
        <section className="market-hero" aria-labelledby="market-heading">
          <div className="market-welcome">
            {user && <p className="market-greeting">Welcome back, {user.firstName || user.username}.</p>}
            <h1 id="market-heading">The student marketplace for <span>campus essentials</span></h1>
            <p>Secondhand textbooks, electronics, and university supplies for students.</p>
            <div className="market-hero-actions">
              {user ? <button type="button" className="market-primary" onClick={() => showSection('market-listings')}>Browse listings</button>
                : <Link className="market-primary" to="/register">Create an account</Link>}
              <button type="button" className="market-sell" disabled>+ Sell an item</button>
            </div>
          </div>
          <div className="market-hero-media">
            <img className="market-hero-image" src="/walnut-hero.webp" alt="Textbooks, headphones, and a canvas bag" fetchPriority="high" />
          </div>
        </section>

        <section className="market-search" aria-label="Marketplace search">
          <label htmlFor="market-search-input">Search marketplace</label>
          <input id="market-search-input" type="search" placeholder="Search campus essentials" disabled />
          <button type="button" disabled>Search</button>
        </section>

        <section className="market-section" id="market-categories" aria-labelledby="market-categories-title" tabIndex={-1}>
          <h2 id="market-categories-title">Marketplace categories</h2>
          <ul className="market-grid market-categories">
            {categories.map(category => <li key={category.name}>
              <svg className="market-category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={category.icon} />
              </svg>
              <div><h3>{category.name}</h3><p>{category.description}</p></div>
            </li>)}
          </ul>
        </section>

        <section className="market-section" id="market-listings" aria-labelledby="market-listings-title" tabIndex={-1}>
          <h2 id="market-listings-title">Listings</h2>
          <ul className="market-grid market-listings">
            {listings.map(item => <li key={item.name}>
              <img src={item.image} alt="" loading="lazy" />
              <div className="market-item">
                <div className="market-item-meta">
                  <p>{item.category}</p>
                  <p className="market-condition">{item.condition}</p>
                </div>
                <h3>{item.name}</h3>
                <strong>{item.price}</strong>
              </div>
            </li>)}
          </ul>
        </section>
      </main>
      <footer className="market-footer">
        <div className="market-width market-footer-content">
          <Brand className="market-footer-brand" />
          <nav aria-label="Footer navigation">
            <button type="button" onClick={() => showSection('market-categories')}>Categories</button>
            <button type="button" onClick={() => showSection('market-listings')}>Listings</button>
          </nav>
        </div>
      </footer>
    </div>
  )
}
