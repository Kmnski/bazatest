
import React from 'react';
import './Header.css';

function Header({ user, onLogout }) {
  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      onLogout();
    }
  };

  return (
    <header className="header">
      <h1>🏭 System Magazynowy</h1>
      <div className="user-info">
        <span>
          Witaj, <strong>{user?.imie} {user?.nazwisko}</strong>
          {user?.rola && ` (${user.rola})`}
        </span>
        <button className="logout-button" onClick={handleLogout}>
          Wyloguj
        </button>
      </div>
    </header>
  );
}

export default Header;