import { useState, useEffect, useCallback, useRef } from 'react';

export const useSearch = (fetchAllFunction, searchFunction = null) => {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const initialDataRef = useRef([]);

  // Pobieranie wszystkich danych
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAllFunction();
      const allData = response.data;
      setData(allData);
      initialDataRef.current = allData;
      
    } catch (err) {
      setError('Błąd podczas pobierania danych');
      
    } finally {
      setLoading(false);
    }
  }, [fetchAllFunction]);

  // Filtrowanie danych lokalnie
  const filterData = useCallback((query) => {
    if (!query.trim()) {
      // Puste zapytanie - pokaż wszystkie dane
      setData(initialDataRef.current);
      
      return;
    }

    
    
    const filteredData = initialDataRef.current.filter(item =>
      Object.values(item).some(value =>
        value && value.toString().toLowerCase().includes(query.toLowerCase())
      )
    );
    
    setData(filteredData);
    
  }, []);

  // Wyszukiwanie przez backend
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      // Puste zapytanie - pokaż wszystkie dane
      setData(initialDataRef.current);
      return;
    }

    
    setLoading(true);

    try {
      const response = await searchFunction(query);
      setData(response.data);
      
    } catch (err) {
      
      setError('Błąd podczas wyszukiwania');
      // Przy błędzie wróć do wszystkich danych
      setData(initialDataRef.current);
    } finally {
      setLoading(false);
    }
  }, [searchFunction]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchFunction) {
        // Użyj funkcji wyszukiwania z backendu
        performSearch(searchQuery);
      } else {
        // Filtruj lokalnie
        filterData(searchQuery);
      }
    }, 300); // Krótszy debounce dla lepszej responsywności

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchFunction, performSearch, filterData]);

  // Pobierz dane przy pierwszym renderze
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    data,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refetch: fetchAll
  };
};