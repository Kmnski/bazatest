import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI } from '../api';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import './DocumentView.css';

function DocumentView({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dokument, setDokument] = useState(null);
  const [pozycje, setPozycje] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDokument();
  }, [id]);

  const fetchDokument = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.getDokument(id);
      console.log('📄 Pełna odpowiedź API:', response);
      console.log('📄 Dane dokumentu:', response.data);
      setDokument(response.data);

      // POBIERZ POZYCJE DOKUMENTU
      await fetchPozycjeDokumentu(id);
      
    } catch (error) {
      console.error('Błąd pobierania dokumentu:', error);
      alert('Błąd podczas pobierania dokumentu');
    } finally {
      setLoading(false);
    }
  };

  const fetchPozycjeDokumentu = async (dokumentId) => {
    try {
      const response = await documentsAPI.getPozycjeDokumentu(dokumentId);
      console.log('📦 Pozycje dokumentu:', response.data);
      setPozycje(response.data);
    } catch (error) {
      console.error('Błąd pobierania pozycji:', error);
      // Jeśli endpoint nie istnieje, użyj pozycji z dokumentu (jeśli są)
      if (dokument && dokument.pozycje) {
        setPozycje(dokument.pozycje);
      }
    }
  };

  const goBack = () => {
    navigate('/documents');
  };

  const printDocument = () => {
    window.print();
  };

  const getTypeClass = (typ) => {
    return typ === 'PZ' || typ === 'PW' ? 'type-pz' : 'type-wz';
  };

  const getStatusClass = (status) => {
    return status === 'zatwierdzony' ? 'status-completed' : 'status-pending';
  };


  // Funkcja do pobierania danych materiału z pozycji
  const getMaterialData = (pozycja) => {
    return {
      nazwa: pozycja.materialNazwa || 'Brak nazwy',
      opis: pozycja.materialOpis || `ID: ${pozycja.materialId}`,
      jednostka: pozycja.materialJednostka || 'szt',
      ilosc: pozycja.ilosc || 0
    };
  };

    const getKontrahentData = () => {
    if (!dokument) return { nazwa: '' };
    
    if (dokument.typ === 'PZ' || dokument.typ === 'PW') {
      return {
        nazwa: dokument.dostawcaNazwa || 'Brak danych'
      };
    } else {
      return {
        nazwa: dokument.odbiorcaNazwa || 'Brak danych'
      };
    }
  };

  if (loading) {
    return (
      <div className="document-view">
        <Header user={user} onLogout={onLogout} />
        <Navigation activeSection="documents" />
        <div className="main-content">
          <div style={{textAlign: 'center', padding: '50px'}}>
            <div>Ładowanie dokumentu...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!dokument) {
    return (
      <div className="document-view">
        <Header user={user} onLogout={onLogout} />
        <Navigation activeSection="documents" />
        <div className="main-content">
          <div style={{textAlign: 'center', padding: '50px'}}>
            <div>Dokument nie znaleziony</div>
            <button className="back-btn" onClick={goBack}>
              ← Powrót do listy
            </button>
          </div>
        </div>
      </div>
    );
  }

  const kontrahent = getKontrahentData();

  return (
    <div className="document-view">
      {/* Wersja ekranowa */}
      <div className="screen-version">
        <Header user={user} onLogout={onLogout} />
        <Navigation activeSection="documents" />
        
        <div className="main-content">
          <div className="page-header">
            <h1 className="page-title">📋 Podgląd dokumentu</h1>
            <button className="back-btn" onClick={goBack}>
              ← Powrót do listy
            </button>
          </div>

          <div className="document-card">
            <div className="document-header">
              <div className="document-info">
                <h2>
                  <span className={`document-type ${getTypeClass(dokument.typ)}`}>
                    {dokument.typ}
                  </span>
                  <strong>{dokument.numerDokumentu}</strong>
                </h2>
                <p>
                  Data: <strong>{new Date(dokument.data).toLocaleDateString()}</strong> | 
                  Utworzył: <strong>{dokument.uzytkownikEmail || user?.email || 'Administrator'}</strong>
                </p>
              </div>
              <div className={`document-status ${getStatusClass(dokument.status)}`}>
                {dokument.status}
              </div>
            </div>

            <div className="document-details">
              <div className="detail-group">
                <h3>🏪 Magazyn</h3>
                <div className="detail-item">
                  <span className="detail-label">Lokalizacja:</span>
                  <span className="detail-value">{dokument.magazynLokalizacja}</span>
                </div>
                
              </div>

              <div className="detail-group">
                <h3>👥 {dokument.typ === 'PZ' || dokument.typ === 'PW' ? 'Dostawca' : 'Odbiorca'}</h3>
                <div className="detail-item">
                  <span className="detail-label">Nazwa:</span>
                  <span className="detail-value">{kontrahent.nazwa}</span>
                </div>

              </div>
            </div>

            <div className="detail-group">
              <h3>📦 Pozycje dokumentu</h3>
              {pozycje.length > 0 ? (
                <table className="positions-table">
                  <thead>
                    <tr>
                      <th>Lp.</th>
                      <th>Materiał</th>
                      <th>Jednostka</th>
                      <th>Ilość</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pozycje.map((pozycja, index) => {
                      const material = getMaterialData(pozycja);
                      return (
                        <tr key={pozycja.idPozycji || index}>
                          <td>{index + 1}</td>
                          <td>
                            <strong>{material.nazwa}</strong>
                            <br />
                            <small>{material.opis}</small>
                          </td>
                          <td>{material.jednostka}</td>
                          <td>{material.ilosc}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background: '#f8f9fa'}}>
                      <td colSpan="3" style={{textAlign: 'right', fontWeight: 'bold'}}>
                        Razem:
                      </td>
                      <td style={{fontWeight: 'bold'}}>
                        {pozycje.reduce((sum, pozycja) => sum + (parseFloat(pozycja.ilosc) || 0), 0)} szt.
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p style={{textAlign: 'center', color: '#7f8c8d', fontStyle: 'italic', padding: '20px'}}>
                  Brak pozycji w dokumencie
                </p>
              )}
            </div>

            

            <div className="action-buttons">
              <button className="print-btn" onClick={printDocument}>
                🖨️ Drukuj dokument
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wersja do druku */}
      <div className="print-version">
        <div className="print-document">
          <div className="print-header">
            <h1>
              DOKUMENT {dokument.typ === 'PZ' || dokument.typ === 'PW' ? 'PRZYJĘCIA' : 'WYDANIA'} {dokument.typ}
            </h1>
            <p>
              Numer: <strong>{dokument.numerDokumentu}</strong> | 
              Data: <strong>{new Date(dokument.data).toLocaleDateString()}</strong>
            </p>
          </div>

          <div className="print-details">
            <div className="print-section">
              <h3>MAGAZYN</h3>
              <p>{dokument.magazynLokalizacja}</p>
              
            </div>
            
            <div className="print-section">
              <h3>{dokument.typ === 'PZ' || dokument.typ === 'PW' ? 'DOSTAWCA' : 'ODBIORCA'}</h3>
              <p>{kontrahent.nazwa}</p>
            </div>
          </div>

          <div className="print-section">
            <h3>POZYCJE DOKUMENTU</h3>
            {pozycje.length > 0 ? (
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Lp.</th>
                    <th>Nazwa materiału</th>
                    
                    <th>Jedn.</th>
                    <th>Ilość</th>
                  </tr>
                </thead>
                <tbody>
                  {pozycje.map((pozycja, index) => {
                    const material = getMaterialData(pozycja);
                    return (
                      <tr key={pozycja.idPozycji || index}>
                        <td>{index + 1}</td>
                        <td><strong>{material.nazwa}</strong></td>
                        <td>{material.jednostka}</td>
                        <td>{material.ilosc}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{textAlign: 'right', fontWeight: 'bold'}}>
                      RAZEM:
                    </td>
                    <td style={{fontWeight: 'bold'}}>
                      {pozycje.reduce((sum, pozycja) => sum + (parseFloat(pozycja.ilosc) || 0), 0)} szt
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p><em>Brak pozycji w dokumencie</em></p>
            )}
          </div>


          <div className="print-footer">
            <div>
              <div className="signature-line">
                Data i podpis {dokument.typ === 'PZ' || dokument.typ === 'PW' ? 'przyjmującego' : 'wydającego'}
              </div>
            </div>
            <div>
              <div className="signature-line">
                Data i podpis {dokument.typ === 'PZ' || dokument.typ === 'PW' ? 'dostawcy' : 'odbiorcy'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentView;