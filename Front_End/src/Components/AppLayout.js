import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../Components/CSS/AppLayout.css';
import './DataCard';

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
    <div className="app-layout">
      {!sidebarVisible && (
        <button
          className="sidebar-toggle-button"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
        >
          ☰
        </button>
      )}

      {sidebarVisible && (
        <aside className="sidebar">
          <div className="sidebar-header">
            Menu
            <button
              className="sidebar-close-button"
              onClick={toggleSidebar}
              aria-label="Close sidebar"
            >
              ☰
            </button>
          </div>
          <ul className="sidebar-menu">
            <li className="sidebar-item">Alerts</li>
            <li className="sidebar-item">Statistics</li>
            <li className="sidebar-item">Locations</li>
          </ul>
        </aside>
      )}

      <div className={`main-content ${sidebarVisible ? '' : 'full-width'}`}>
        <nav className="navbar">
          <button
            className="sidebar-toggle-button-desktop"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

          <h1 className="navbar-title">Flood Prediction and Alert System</h1>

          <div className="navbar-links">
            <Link to="/flooddata" className="nav-link">Home</Link>
            <Link to="/floodstatus" className="nav-link">Flood Status</Link>
            <Link to="/reports" className="nav-link">Reports</Link>
            <span className="username">{userName}</span>

            <div className="profile-dropdown-wrapper" ref={dropdownRef}>
              <button className="profile-button" onClick={toggleDropdown}>👤</button>
              {showDropdown && (
                <div className="dropdown-content">
                  <Link to="/profile" className="dropdown-link" onClick={() => setShowDropdown(false)}>Profile</Link>
                  <Link to="/logout" className="dropdown-link" onClick={() => setShowDropdown(false)}>Logout</Link>
                </div>
              )}
            </div>

          </div>
        </nav>

        <main className="content-area">
          {children}
        </main>

        <footer className="footer">
          <p>&copy; 2025 Flood Prediction and Alert System | Developed by Elyse and Solange</p>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
