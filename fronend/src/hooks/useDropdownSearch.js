import { useState, useEffect, useCallback, useRef } from 'react';

export const useDropdownSearch = (fetchDataFunction, searchFunction = null) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const initialDataRef = useRef([]);

    // Funkcja do formatowania wyświetlanej wartości (możesz dostosować)
const formatDisplayValue = (item) => {
  if (!item) return '';
  
  // Dla magazynów
  if (item.typ && item.lokalizacja) {
    return `${item.lokalizacja}`;
  }
  // Dla dostawców/odbiorców
  if (item.nazwa && item.email) {
    return `${item.nazwa} (${item.email})`;
  }
  // Dla materiałów
  if (item.nazwa && item.jednostka) {
    return `${item.nazwa} (${item.jednostka})`;
  }
  return item.typ || item.nazwa || item.toString();
};

  // Pobieranie wszystkich danych
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchDataFunction();
      const allData = response.data;
      setData(allData);
      setFilteredData(allData);
      initialDataRef.current = allData;
    } catch (err) {
      setError('Błąd podczas pobierania danych');
      console.error('❌ Błąd pobierania:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchDataFunction]);

  // Wyszukiwanie
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setFilteredData(initialDataRef.current);
      return;
    }

    setLoading(true);
    try {
      let searchData;
      
      if (searchFunction) {
        // Wyszukiwanie przez backend
        const response = await searchFunction(query);
        searchData = response.data;
      } else {
        // Filtrowanie lokalne
        searchData = initialDataRef.current.filter(item =>
          Object.values(item).some(value =>
            value && value.toString().toLowerCase().includes(query.toLowerCase())
          )
        );
      }
      
      setFilteredData(searchData);
    } catch (err) {
      console.error('❌ Błąd wyszukiwania:', err);
      setError('Błąd podczas wyszukiwania');
      setFilteredData(initialDataRef.current);
    } finally {
      setLoading(false);
    }
  }, [searchFunction]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Pobierz dane przy pierwszym renderze
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    setShowResults(true);
  }, []);

const handleFocus = useCallback(() => {
  setShowResults(true);
  // ZAWSZE pokazuj wszystkie dane przy focus, niezależnie od searchQuery
  setFilteredData(initialDataRef.current);
}, []);

  const handleSelect = useCallback((selectedItem) => {
    setSearchQuery(formatDisplayValue(selectedItem));
    setShowResults(false);
    return selectedItem;
  }, [formatDisplayValue]);

  const handleCloseResults = useCallback(() => {
    setShowResults(false);
  }, []);



  return {
    data: filteredData,
    searchQuery,
    setSearchQuery: handleSearchChange,
    loading,
    error,
    showResults,
    setShowResults,
    handleFocus,
    handleSelect,
    handleCloseResults,
    refetch: fetchAll,
    formatDisplayValue
  };
};