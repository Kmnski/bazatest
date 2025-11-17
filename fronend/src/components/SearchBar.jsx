// src/components/SearchBar.js
import React, { useRef, useEffect } from 'react';

function SearchBar({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "Szukaj...",
  delay = 400 
}) {
  const searchInputRef = useRef(null);

  // Automatyczne focus na input przy załadowaniu
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleInputChange = (e) => {
    onSearchChange(e.target.value); // Pozwól wpisać cokolwiek
  };

  return (
    <div className="search-bar">
      <input
        ref={searchInputRef}
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleInputChange}
      />
    </div>
  );
}

export default SearchBar;