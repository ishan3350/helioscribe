import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mainNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/dashboard/profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/dashboard/settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.67 19.18 11.36 19.14 11.06L21.16 9.37C21.34 9.22 21.4 8.97 21.3 8.74L19.3 5.26C19.2 5.03 18.97 4.88 18.73 4.88H15.07C14.7 4.54 14.3 4.25 13.87 4.02L13.49 0.74C13.46 0.5 13.25 0.32 13.01 0.32H10.99C10.75 0.32 10.54 0.5 10.51 0.74L10.13 4.02C9.7 4.25 9.3 4.54 8.93 4.88H5.27C5.03 4.88 4.8 5.03 4.7 5.26L2.7 8.74C2.6 8.97 2.66 9.22 2.84 9.37L4.86 11.06C4.82 11.36 4.8 11.67 4.8 12C4.8 12.33 4.82 12.64 4.86 12.94L2.84 14.63C2.66 14.78 2.6 15.03 2.7 15.26L4.7 18.74C4.8 18.97 5.03 19.12 5.27 19.12H8.93C9.3 19.46 9.7 19.75 10.13 19.98L10.51 23.26C10.54 23.5 10.75 23.68 10.99 23.68H13.01C13.25 23.68 13.46 23.5 13.49 23.26L13.87 19.98C14.3 19.75 14.7 19.46 15.07 19.12H18.73C18.97 19.12 19.2 18.97 19.3 18.74L21.3 15.26C21.4 15.03 21.34 14.78 21.16 14.63L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12C8.4 10.02 10.02 8.4 12 8.4C13.98 8.4 15.6 10.02 15.6 12C15.6 13.98 13.98 15.6 12 15.6Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 'help',
      label: 'Help & Support',
      path: '/dashboard/help',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9H8C8 6.79 9.79 5 12 5C14.21 5 16 6.79 16 9C16 10.2 15.4 11.27 14.47 11.93L15.07 11.25Z" fill="currentColor"/>
        </svg>
      )
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setIsMobileMenuOpen(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button 
        className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-content">
          {/* Header */}
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                  <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="currentColor"/>
                </svg>
              </div>
              {!isCollapsed && <span className="logo-text">HelioScribe</span>}
            </div>
            {!isCollapsed && (
              <button 
                className="sidebar-close-btn desktop-only"
                onClick={toggleCollapse}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                </svg>
              </button>
            )}
          </div>

          {/* Main Navigation */}
          <nav className="sidebar-nav">
            <ul className="nav-list main-nav">
              {mainNavItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => handleNavigation(item.path)}
                    aria-label={item.label}
                    title={isCollapsed ? item.label : ''}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="nav-label">{item.label}</span>
                        <svg className="nav-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="currentColor"/>
                        </svg>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Section */}
          {!isCollapsed && (
            <div className="sidebar-footer">
              <div className="user-section">
                <div className="user-avatar">
                  {user?.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="user-info">
                  <div className="user-name">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="user-email">{user?.email}</div>
                </div>
              </div>
              <button 
                className="sidebar-logout-btn"
                onClick={onLogout}
                aria-label="Sign out"
              >
                Sign out
              </button>
            </div>
          )}

          {/* Collapsed Expand Button - Desktop Only */}
          {isCollapsed && (
            <button 
              className="sidebar-expand-btn desktop-only"
              onClick={toggleCollapse}
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="currentColor"/>
              </svg>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
