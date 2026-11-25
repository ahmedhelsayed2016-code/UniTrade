import { Link } from 'react-router-dom'

export default function Brand({ className = '', onClick }) {
  return (
    <Link className={`site-brand ${className}`} to="/" onClick={onClick}>
      <img className="site-brand-mark" src="/unitrade-icon.png" width="48" height="48" alt="" />
      <span>UniTrade</span>
    </Link>
  )
}
