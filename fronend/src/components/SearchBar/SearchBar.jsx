import React from 'react';
import './SearchBar.css';

function SearchBar({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "Szukaj...",
  className = "",
  disabled = false
}) {
  return (
    <div className={`search-bar ${className}`}>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="search-input"
      />
      <div className="search-icon">🔍</div>
    </div>
  );
}

export default SearchBar;