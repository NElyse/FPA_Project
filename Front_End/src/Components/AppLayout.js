import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../Components/CSS/AppLayout.css';

const AppLayout = ({ children }) => {
  const [userName, setUserName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserName(user.full_names || user.username || '');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setShowDropdown(!showDropdown);
  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

  return (
    <div className="fpa-layout">
      {sidebarVisible && (
        <aside className={`fpa-sidebar ${sidebarVisible ? 'open' : 'hidden'}`}>
          <div className="fpa-sidebar-header">
            Menu
            <button className="fpa-sidebar-close" onClick={toggleSidebar} aria-label="Close sidebar">✕</button>
          </div>
          <ul className="fpa-sidebar-menu">
            <li className="fpa-sidebar-item"><Link to="/FloodPredictionForm">Make Prediction</Link></li>
            <li className="fpa-sidebar-item"><Link to="/floodstatus">Flood Status</Link></li>
            <li className="fpa-sidebar-item"><Link to="/reports">Reports</Link></li>
          </ul>
        </aside>
      )}

      {!sidebarVisible && (
        <button className="fpa-toggle-button" onClick={toggleSidebar} aria-label="Open sidebar">☰</button>
      )}

      <div className={`fpa-main-wrapper ${!sidebarVisible ? 'full-width' : ''}`}>
        <header className="fpa-navbar">
          <button className="fpa-toggle-button-desktop" onClick={toggleSidebar} aria-label="Toggle sidebar">☰</button>
          <h1 className="fpa-navbar-title">Flood Prediction and Alert System</h1>
          <div className="fpa-navbar-links">
            <span className="fpa-username">{userName}</span>
            <div className="fpa-dropdown-wrapper" ref={dropdownRef}>
              <button className="fpa-profile-button" onClick={toggleDropdown} aria-label="User profile">👤</button>
              {showDropdown && (
                <div className="fpa-dropdown">
                  <Link to="/profile" className="fpa-dropdown-link" onClick={() => setShowDropdown(false)}>Profile</Link>
                  <Link to="/logout" className="fpa-dropdown-link" onClick={() => {
                    localStorage.removeItem('user');
                    setShowDropdown(false);
                    window.location.href = '/login';
                  }}>Logout</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="fpa-content">
          {children}
        </main>

        <footer className="fpa-footer">
          <p>&copy; 2025 Flood Prediction and Alert System | Developed by Elyse and Solange</p>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
