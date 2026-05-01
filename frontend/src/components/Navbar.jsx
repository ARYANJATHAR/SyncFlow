import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span>SyncFlow</span>
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/" className={isActive('/')}>Dashboard</Link>
            <Link to="/projects" className={isActive('/projects')}>Projects</Link>
            
            <button onClick={toggleTheme} className="btn-icon" style={{ fontSize: '1.2rem', padding: '0.4rem' }} title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            <div className="navbar-user">
              <div className="navbar-avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{user?.name}</span>
            </div>
            <button onClick={logout} className="btn-secondary btn-sm">Logout</button>
          </>
        ) : (
          <>
            <button onClick={toggleTheme} className="btn-icon" style={{ fontSize: '1.2rem', padding: '0.4rem', marginRight: '0.5rem' }} title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <Link to="/login" className={isActive('/login')}>Login</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
