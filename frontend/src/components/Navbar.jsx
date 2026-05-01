import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">TaskFlow</Link>
      <div className="navbar-links">
        <Link to="/" className={isActive('/')}>Dashboard</Link>
        <Link to="/projects" className={isActive('/projects')}>Projects</Link>
        <div className="navbar-user">
          <div className="navbar-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '0.85rem' }}>{user?.name}</span>
        </div>
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}
