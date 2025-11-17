import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation({ activeSection }) {
  const location = useLocation();
  
  const baseNavItems = [
    { id: 'dashboard', label: '📊 Dashboard', path: '/dashboard' },
    { id: 'documents', label: '📋 Dokumenty', path: '/documents' },
    { id: 'suppliers', label: '🏢 Dostawcy', path: '/suppliers' },
    { id: 'receivers', label: '👥 Odbiorcy', path: '/receivers' }
  ];

  const adminNavItem = [
    { id: 'admin', label: '👑 Panel admina', path: '/admin' }
  ];

  // Sprawdź rolę z localStorage
  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Błąd odczytu użytkownika z localStorage:', error);
      return null;
    }
  };

  const user = getUserFromStorage();
  const isAdmin = user?.role === 'Admin' || user?.rola === 'Admin' || user?.role === 2;

  // Połącz podstawowe elementy z panelem admina jeśli użytkownik jest adminem
  const navItems = isAdmin 
    ? [...baseNavItems, ...adminNavItem]
    : baseNavItems;

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="nav">
      {navItems.map(item => (
        <Link
          key={item.id}
          to={item.path}
          className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default Navigation;