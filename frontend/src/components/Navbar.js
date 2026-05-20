import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">⬡</span>
          <span className="brand-name">TaskForge</span>
        </Link>

        <div className="navbar-links">
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/projects" className={`nav-link ${isActive('/projects') ? 'active' : ''}`}>
            Projects
          </Link>
        </div>

        <div className="navbar-right">
          <div className="user-pill" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className={`badge badge-${user?.role?.toLowerCase()}`}>{user?.role}</span>
            </div>
            <span className="chevron">{menuOpen ? '▲' : '▼'}</span>
          </div>

          {menuOpen && (
            <div className="dropdown">
              <div className="dropdown-header">
                <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{user?.email}</p>
              </div>
              <button className="dropdown-item danger" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
