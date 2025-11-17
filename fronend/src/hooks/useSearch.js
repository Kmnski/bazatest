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
      initialDataRef.current = allData; // Zapisz dane do filtrowania
      console.log('📊 Pobrano wszystkie dane:', allData.length);
    } catch (err) {
      setError('Błąd podczas pobierania danych');
      console.error('❌ Błąd pobierania:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchAllFunction]);

  // Filtrowanie danych lokalnie
  const filterData = useCallback((query) => {
    if (!query.trim()) {
      // Puste zapytanie - pokaż wszystkie dane
      setData(initialDataRef.current);
      console.log('📋 Puste zapytanie - pokazuję wszystkie dane:', initialDataRef.current.length);
      return;
    }

    console.log('🔍 Filtruję lokalnie:', query);
    
    const filteredData = initialDataRef.current.filter(item =>
      Object.values(item).some(value =>
        value && value.toString().toLowerCase().includes(query.toLowerCase())
      )
    );
    
    setData(filteredData);
    console.log('✅ Znaleziono:', filteredData.length, 'wyników');
  }, []);

  // Wyszukiwanie przez backend
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      // Puste zapytanie - pokaż wszystkie dane
      setData(initialDataRef.current);
      return;
    }

    console.log('🔍 Wyszukiwanie przez backend:', query);
    setLoading(true);

    try {
      const response = await searchFunction(query);
      setData(response.data);
      console.log('✅ Backend znalazł:', response.data.length, 'wyników');
    } catch (err) {
      console.error('❌ Błąd wyszukiwania:', err);
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