// src/components/Documents.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentsAPI } from '../api';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import SearchBar from '../components/SearchBar';
import './Documents.css';

function Documents({ user, onLogout }) {
  const [dokumenty, setDokumenty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDokumenty();
  }, []);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    
    if (trimmedQuery.length === 0) {
      fetchDokumenty();
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchDokumenty = async () => {
    setLoading(true);
    try {
      const response = await documentsAPI.getDokumenty();
      console.log('📋 Pobrane dokumenty:', response.data); // DEBUG
      setDokumenty(response.data);
    } catch (error) {
      console.error('Błąd pobierania dokumentów:', error);
      alert('Błąd podczas pobierania dokumentów');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      const response = await documentsAPI.searchDokumenty(searchQuery.trim());
      setDokumenty(response.data);
    } catch (error) {
      console.error('Błąd wyszukiwania:', error);
      fetchDokumenty();
    }
  };

  const deleteDocument = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten dokument? Tej operacji nie można cofnąć.')) {
      try {
        await documentsAPI.deleteDokument(id); 
        alert('Dokument został usunięty');
        fetchDokumenty();
      } catch (error) {
        console.error('Błąd usuwania dokumentu:', error);
        alert('Błąd podczas usuwania dokumentu');
      }
    }
  };

  // Funkcja do określenia nazwy kontrahenta
  const getKontrahentNazwa = (dokument) => {
    if (dokument.typ === 'PZ' || dokument.typ === 'PW') {
      return dokument.dostawcaNazwa || 'Brak dostawcy';
    } else {
      return dokument.odbiorcaNazwa || 'Brak odbiorcy';
    }
  };

  // Funkcja bezpiecznego dostępu do statusu
  const getStatus = (dokument) => {
    return dokument.status || 'oczekujacy';
  };

  // Funkcja bezpiecznego dostępu do typu
  const getTyp = (dokument) => {
    return dokument.typ || 'PZ';
  };

  // Funkcja renderująca przyciski akcji w zależności od statusu
  const renderActionButtons = (dokument) => {
    const status = getStatus(dokument).toLowerCase();
    const documentId = dokument.idDokumentu;

    switch (status) {
      case 'zatwierdzony':
        return (
          <div className="action-buttons-centered">
            <Link 
              to={`/document-view/${documentId}`} 
              className="view-btn"
            >
              Podgląd
            </Link>
          </div>
        );

      case 'odrzucony':
        return (
          <div className="action-buttons-centered">
            <Link 
              to={`/document-view/${documentId}`} 
              className="view-btn"
            >
              Podgląd
            </Link>
            <Link 
              to={`/document-edit/${documentId}`} 
              className="edit-btn"
            >
              Edytuj
            </Link>
            <button 
              className="delete-btn" 
              onClick={() => deleteDocument(documentId)}
            >
              Usuń
            </button>
          </div>
        );

      case 'oczekujacy':
      default:
        return (
          <div className="action-buttons-centered">
            <Link 
              to={`/document-view/${documentId}`} 
              className="view-btn"
            >
              Podgląd
            </Link>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="documents">
        <Header user={user} onLogout={onLogout} />
        <Navigation activeSection="documents" />
        <div className="main-content">
          <div style={{textAlign: 'center', padding: '50px'}}>
            <div>Ładowanie dokumentów...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="documents">
      <Header user={user} onLogout={onLogout} />
      <Navigation activeSection="documents" />
      
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">📋 Dokumenty magazynowe</h1>
          <div className="document-actions">
            <Link to="/documents/new-pz" className="create-document-btn pz-btn">
              <span>📥</span> Nowy PZ
            </Link>
            <Link to="/documents/new-wz" className="create-document-btn wz-btn">
              <span>📤</span> Nowy WZ
            </Link>
          </div>

        </div>

        {/* Wyszukiwarka */}
        <SearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Szukaj dokumentów..."
        />

        {/* Tabela dokumentów */}
        <div className="s-table">
          <table>
            <thead>
              <tr>
                <th>Numer dokumentu</th>
                <th>Typ</th>
                <th>Data</th>
                <th>Magazyn</th>
                <th>Kontrahent</th>
                <th>Ilość pozycji</th>
                <th>Status</th>
                <th style={{textAlign: 'center'}}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {dokumenty.length > 0 ? (
                dokumenty.map((dokument) => {
                  const status = getStatus(dokument);
                  const typ = getTyp(dokument);
                  
                  return (
                    <tr key={dokument.idDokumentu}>
                      <td><strong>{dokument.numerDokumentu || 'Brak numeru'}</strong></td>
                      <td>
                        <span className={`document-type type-${typ.toLowerCase()}`}>
                          {typ}
                        </span>
                      </td>
                      <td>{dokument.data ? new Date(dokument.data).toLocaleDateString() : 'Brak daty'}</td>
                      <td>{dokument.magazynLokalizacja || 'Brak danych'}</td>
                      <td>{getKontrahentNazwa(dokument)}</td>
                      <td>{dokument.liczbaPozycji || 0} pozycje</td>
                      <td>
                        <span className={`document-status status-${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        {renderActionButtons(dokument)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>
                    {searchQuery ? 'Brak dokumentów spełniających kryteria' : 'Brak dokumentów'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Documents;