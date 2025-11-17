// src/components/EditDocument.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { documentsAPI, warehousesAPI, suppliersAPI, receiversAPI, materialsAPI } from '../api';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import './NewDocument.css';

function EditDocument({ user, onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Stan formularza
  const [formData, setFormData] = useState({
    typ: 'PZ',
    data: new Date().toISOString().split('T')[0],
    uwagi: '',
    magazynId: '',
    dostawcaId: '',
    odbiorcaId: '',
    pozycje: []
  });

  // Stan dla wyszukiwania
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [warehouseMaterials, setWarehouseMaterials] = useState([]);
  
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [filteredCounterparties, setFilteredCounterparties] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  
  const [showWarehouseResults, setShowWarehouseResults] = useState(false);
  const [showCounterpartyResults, setShowCounterpartyResults] = useState(false);
  const [showMaterialResults, setShowMaterialResults] = useState({});
  
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedCounterparty, setSelectedCounterparty] = useState(null);
  
  // Stan dla inputów wyszukiwania
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [counterpartySearch, setCounterpartySearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState({});
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [documentData, setDocumentData] = useState(null);

  useEffect(() => {
    loadDocumentData();
  }, [id]);

  // Ładowanie danych dokumentu
  const loadDocumentData = async () => {
    try {
      setInitialLoading(true);
      
      // Pobierz dane dokumentu
      const documentResponse = await documentsAPI.getDokument(id);
      const document = documentResponse.data;
      setDocumentData(document);

      // Pobierz pozostałe dane
      const [warehousesResponse, suppliersResponse, receiversResponse, materialsResponse] = await Promise.all([
        warehousesAPI.getMagazyny(),
        suppliersAPI.getDostawcy(),
        receiversAPI.getOdbiorcy(),
        materialsAPI.getMaterialy()
      ]);

      setWarehouses(warehousesResponse.data);
      setSuppliers(suppliersResponse.data);
      setReceivers(receiversResponse.data);
      setMaterials(materialsResponse.data);

      // Wypełnij formularz danymi dokumentu
      fillFormWithDocumentData(document, warehousesResponse.data, suppliersResponse.data, receiversResponse.data, materialsResponse.data);

    } catch (error) {
      console.error('Błąd ładowania danych dokumentu:', error);
      alert('Błąd podczas ładowania danych dokumentu');
    } finally {
      setInitialLoading(false);
    }
  };

  // Funkcja do wypełnienia formularza danymi dokumentu
  const fillFormWithDocumentData = (document, warehouses, suppliers, receivers, materials) => {
    // Znajdź magazyn
    const warehouse = warehouses.find(w => w.idMagazynu === document.magazynId);
    const warehouseText = warehouse ? `${warehouse.lokalizacja}` : '';
    
    // Znajdź kontrahenta
    let counterparty = null;
    let counterpartyText = '';
    
    if (document.typ === 'PZ' && document.dostawcaId) {
      counterparty = suppliers.find(s => s.idDostawcy === document.dostawcaId);
      counterpartyText = counterparty ? `${counterparty.nazwa} (${counterparty.email})` : '';
    } else if (document.typ === 'WZ' && document.odbiorcaId) {
      counterparty = receivers.find(r => r.idOdbiorcy === document.odbiorcaId);
      counterpartyText = counterparty ? `${counterparty.nazwa} (${counterparty.email})` : '';
    }

    // Przygotuj pozycje z nazwami materiałów
    const pozycje = document.pozycje.map(pozycja => {
      const material = materials.find(m => m.idMaterialu === pozycja.materialId);
      return {
        ...pozycja,
        materialId: pozycja.materialId,
        materialNazwa: material ? material.nazwa : '',
        materialJednostka: material ? material.jednostka : '',
        maxIlosc: null // Dla edycji nie potrzebujemy max ilości
      };
    });

    // Ustaw stan wyszukiwania materiałów
    const materialSearchState = {};
    document.pozycje.forEach((pozycja, index) => {
      const material = materials.find(m => m.idMaterialu === pozycja.materialId);
      materialSearchState[index] = material ? `${material.nazwa} (${material.jednostka})` : '';
    });

    setFormData({
      typ: document.typ,
      data: document.data.split('T')[0],
      uwagi: document.uwagi || '',
      magazynId: document.magazynId.toString(),
      dostawcaId: document.dostawcaId ? document.dostawcaId.toString() : '',
      odbiorcaId: document.odbiorcaId ? document.odbiorcaId.toString() : '',
      pozycje: pozycje
    });

    setWarehouseSearch(warehouseText);
    setCounterpartySearch(counterpartyText);
    setMaterialSearch(materialSearchState);
    setSelectedWarehouse(warehouse);
    setSelectedCounterparty(counterparty);
  };

  // Ładowanie materiałów magazynu gdy zmieni się wybrany magazyn
  useEffect(() => {
    if (formData.magazynId && formData.typ === 'WZ') {
      loadWarehouseMaterials();
    } else {
      setWarehouseMaterials([]);
    }
  }, [formData.magazynId, formData.typ]);

  const loadWarehouseMaterials = async () => {
    try {
      const response = await warehousesAPI.getWarehouseMaterials(formData.magazynId);
      setWarehouseMaterials(response.data);
    } catch (error) {
      console.error('Błąd ładowania materiałów magazynu:', error);
      alert('Błąd podczas ładowania materiałów z magazynu');
    }
  };

  // Pozostałe funkcje pozostają takie same jak w NewDocument.js
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'typ') {
      setFormData(prev => ({
        ...prev,
        typ: value,
        dostawcaId: '',
        odbiorcaId: '',
        pozycje: []
      }));
      setSelectedCounterparty(null);
      setCounterpartySearch('');
      setMaterialSearch({});
    } else if (name === 'magazynId') {
      setFormData(prev => ({
        ...prev,
        magazynId: value,
        pozycje: []
      }));
      setMaterialSearch({});
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Wyszukiwanie magazynów
  const searchWarehouses = (query) => {
    setWarehouseSearch(query);
    
    if (query.length === 0) {
      setFilteredWarehouses(warehouses);
      return;
    }

    const filtered = warehouses.filter(wh =>
      wh.nazwa?.toLowerCase().includes(query.toLowerCase()) ||
      wh.lokalizacja?.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredWarehouses(filtered);
  };

  const handleWarehouseFocus = () => {
    setFilteredWarehouses(warehouses);
    setShowWarehouseResults(true);
  };

  const selectWarehouse = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setWarehouseSearch(`${warehouse.lokalizacja}`);
    setFormData(prev => ({ 
      ...prev, 
      magazynId: warehouse.idMagazynu,
      pozycje: []
    }));
    setShowWarehouseResults(false);
    setMaterialSearch({});
  };

  // Wyszukiwanie dostawców/odbiorców
  const searchCounterparties = (query) => {
    setCounterpartySearch(query);
    
    if (query.length === 0) {
      const data = formData.typ === 'PZ' ? suppliers : receivers;
      setFilteredCounterparties(data);
      return;
    }

    const data = formData.typ === 'PZ' ? suppliers : receivers;
    const filtered = data.filter(cp =>
      cp.nazwa?.toLowerCase().includes(query.toLowerCase()) ||
      cp.email?.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredCounterparties(filtered);
  };

  const handleCounterpartyFocus = () => {
    const data = formData.typ === 'PZ' ? suppliers : receivers;
    setFilteredCounterparties(data);
    setShowCounterpartyResults(true);
  };

  const selectCounterparty = (counterparty) => {
    setSelectedCounterparty(counterparty);
    setCounterpartySearch(`${counterparty.nazwa} (${counterparty.email})`);
    if (formData.typ === 'PZ') {
      setFormData(prev => ({ ...prev, dostawcaId: counterparty.idDostawcy }));
    } else {
      setFormData(prev => ({ ...prev, odbiorcaId: counterparty.idOdbiorcy }));
    }
    setShowCounterpartyResults(false);
  };

  // Wyszukiwanie materiałów dla pozycji
  const searchMaterials = (query, positionIndex) => {
    setMaterialSearch(prev => ({ ...prev, [positionIndex]: query }));
    
    if (query.length === 0) {
      const availableMaterials = formData.typ === 'WZ' ? warehouseMaterials : materials;
      setFilteredMaterials(availableMaterials);
      return;
    }

    const availableMaterials = formData.typ === 'WZ' ? warehouseMaterials : materials;
    const filtered = availableMaterials.filter(material =>
      material.nazwa?.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredMaterials(filtered);
  };

  const handleMaterialFocus = (positionIndex) => {
    const availableMaterials = formData.typ === 'WZ' ? warehouseMaterials : materials;
    setFilteredMaterials(availableMaterials);
    setShowMaterialResults(prev => ({ ...prev, [positionIndex]: true }));
  };

  const selectMaterial = (material, positionIndex) => {
    const updatedPozycje = [...formData.pozycje];
    const maxIlosc = formData.typ === 'WZ' ? material.stanMagazynowy || 0 : null;
    
    updatedPozycje[positionIndex] = {
      ...updatedPozycje[positionIndex],
      materialId: material.idMaterialu,
      materialNazwa: material.nazwa,
      materialJednostka: material.jednostka,
      maxIlosc: maxIlosc
    };
    
    setFormData(prev => ({ ...prev, pozycje: updatedPozycje }));
    setMaterialSearch(prev => ({ 
      ...prev, 
      [positionIndex]: `${material.nazwa} (${material.jednostka})${maxIlosc ? ` - dostępne: ${maxIlosc}` : ''}` 
    }));
    setShowMaterialResults(prev => ({ ...prev, [positionIndex]: false }));
  };

  // Dodawanie nowych pozycji
  const addPosition = () => {
    setFormData(prev => ({
      ...prev,
      pozycje: [...prev.pozycje, { 
        materialId: '', 
        ilosc: '', 
        materialNazwa: '', 
        materialJednostka: '',
        maxIlosc: null
      }]
    }));
  };

  const removePosition = (index) => {
    const updatedPozycje = formData.pozycje.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, pozycje: updatedPozycje }));
    
    setMaterialSearch(prev => {
      const newSearch = { ...prev };
      delete newSearch[index];
      return newSearch;
    });
  };

  const updatePosition = (index, field, value) => {
    const updatedPozycje = [...formData.pozycje];
    updatedPozycje[index] = { ...updatedPozycje[index], [field]: value };
    
    if (field === 'ilosc' && formData.typ === 'WZ' && updatedPozycje[index].maxIlosc) {
      const ilosc = parseFloat(value) || 0;
      const maxIlosc = parseFloat(updatedPozycje[index].maxIlosc);
      if (ilosc > maxIlosc) {
        alert(`Nie można wydać więcej niż dostępna ilość: ${maxIlosc}`);
        updatedPozycje[index].ilosc = maxIlosc.toString();
      }
    }
    
    setFormData(prev => ({ ...prev, pozycje: updatedPozycje }));
  };

  // Podsumowanie
  const getSummary = () => {
    const positionsCount = formData.pozycje.length;
    const totalQuantity = formData.pozycje.reduce((sum, pozycja) => {
      return sum + (parseFloat(pozycja.ilosc) || 0);
    }, 0);

    return { positionsCount, totalQuantity };
  };

  const { positionsCount, totalQuantity } = getSummary();

  // Aktualizacja dokumentu
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Walidacja
      if (!formData.magazynId) {
        alert('Wybierz magazyn');
        return;
      }

      if (formData.typ === 'PZ' && !formData.dostawcaId) {
        alert('Wybierz dostawcę');
        return;
      }

      if (formData.typ === 'WZ' && !formData.odbiorcaId) {
        alert('Wybierz odbiorcę');
        return;
      }

      if (formData.pozycje.length === 0) {
        alert('Dodaj przynajmniej jedną pozycję');
        return;
      }

      const invalidPositions = formData.pozycje.filter(p => !p.materialId || !p.ilosc);
      if (invalidPositions.length > 0) {
        alert('Wszystkie pozycje muszą mieć wybrany materiał i ilość');
        return;
      }

      // Dodatkowa walidacja dla WZ
      if (formData.typ === 'WZ') {
        for (const pozycja of formData.pozycje) {
          const material = warehouseMaterials.find(m => m.idMaterialu === parseInt(pozycja.materialId));
          if (material && (parseFloat(pozycja.ilosc) > parseFloat(material.stanMagazynowy))) {
            alert(`Nie można wydać więcej niż dostępna ilość materiału: ${material.nazwa}. Dostępne: ${material.stanMagazynowy}`);
            return;
          }
        }
      }

      let documentData = {
        typ: formData.typ,
        data: formData.data,
        uwagi: formData.uwagi,
        magazynId: parseInt(formData.magazynId),
        uzytkownikId: user.id,
        pozycje: formData.pozycje.map(p => ({
          materialId: parseInt(p.materialId),
          ilosc: parseFloat(p.ilosc)
        }))
      };

      if (formData.typ === 'PZ') {
        documentData = {
          ...documentData,
          dostawcaId: parseInt(formData.dostawcaId)
        };
      } else {
        documentData = {
          ...documentData,
          odbiorcaId: parseInt(formData.odbiorcaId)
        };
      }

      // Użyj metody update zamiast create
      const response = await documentsAPI.updateDokument(id, documentData);
      alert('Dokument został zaktualizowany pomyślnie!');
      navigate('/documents');
      
    } catch (error) {
      console.error('❌ Błąd aktualizacji dokumentu:', error);
      alert('Błąd podczas aktualizacji dokumentu: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    if (window.confirm('Czy na pewno chcesz anulować edycję dokumentu?')) {
      navigate('/documents');
    }
  };

  // Ukrywanie wyników wyszukiwania przy kliknięciu gdzie indziej
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowWarehouseResults(false);
        setShowCounterpartyResults(false);
        setShowMaterialResults({});
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  if (initialLoading) {
    return (
      <div className="new-document">
        <Header user={user} onLogout={onLogout} />
        <Navigation activeSection="documents" />
        <div className="main-content">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div>Ładowanie dokumentu...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="new-document">
      <Header user={user} onLogout={onLogout} />
      <Navigation activeSection="documents" />
      
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">
            ✏️ Edycja dokumentu {documentData?.numerDokumentu || formData.typ}
          </h1>
          <div>
            <strong>Status:</strong> <span style={{ color: '#e67e22' }}>Edycja</span>
          </div>
        </div>

        <form className="document-form" onSubmit={handleSubmit}>
          {/* Informacje podstawowe */}
          <div className="form-section">
            <h3>📋 Informacje podstawowe</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="documentType">Typ dokumentu:</label>
                <select 
                  id="documentType"
                  name="typ"
                  value={formData.typ}
                  onChange={handleInputChange}
                  required
                >
                  <option value="PZ">Przyjęcie (PZ)</option>
                  <option value="WZ">Wydanie (WZ)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="documentDate">Data dokumentu:</label>
                <input 
                  type="date" 
                  id="documentDate"
                  name="data"
                  value={formData.data}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="documentNotes">Uwagi:</label>
              <textarea 
                id="documentNotes"
                name="uwagi"
                rows="3" 
                placeholder="Dodatkowe uwagi do dokumentu..."
                value={formData.uwagi}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Magazyn */}
          <div className="form-section">
            <h3>🏪 Magazyn</h3>
            <div className="form-group">
              <label>Wybierz magazyn:</label>
              <div className="search-container">
                <input 
                  type="text" 
                  placeholder="Wyszukaj magazyn..."
                  value={warehouseSearch}
                  onChange={(e) => searchWarehouses(e.target.value)}
                  onFocus={handleWarehouseFocus}
                />
                {showWarehouseResults && (
                  <div className="search-results show">
                    {filteredWarehouses.map(wh => (
                      <div 
                        key={wh.idMagazynu}
                        className="search-result"
                        onClick={() => selectWarehouse(wh)}
                      >
                        {wh.nazwa} ({wh.lokalizacja})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dostawca/Odbiorca */}
          <div className="form-section">
            <h3>{formData.typ === 'PZ' ? '👥 Dostawca' : '👥 Odbiorca'}</h3>
            <div className="form-group">
              <label>Wybierz {formData.typ === 'PZ' ? 'dostawcę' : 'odbiorcę'}:</label>
              <div className="search-container">
                <input 
                  type="text" 
                  placeholder={`Wyszukaj ${formData.typ === 'PZ' ? 'dostawcę' : 'odbiorcę'}...`}
                  value={counterpartySearch}
                  onChange={(e) => searchCounterparties(e.target.value)}
                  onFocus={handleCounterpartyFocus}
                />
                {showCounterpartyResults && (
                  <div className="search-results show">
                    {filteredCounterparties.map(cp => (
                      <div 
                        key={cp.idDostawcy || cp.idOdbiorcy}
                        className="search-result"
                        onClick={() => selectCounterparty(cp)}
                      >
                        {cp.nazwa} ({cp.email})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pozycje dokumentu */}
          <div className="form-section positions-section">
            <h3>📦 Pozycje dokumentu</h3>
            
            <div id="positionsList">
              {formData.pozycje.map((pozycja, index) => (
                <div key={index} className="position-item">
                  <div className="position-header">
                    <div className="position-material">Pozycja #{index + 1}</div>
                    <button 
                      type="button" 
                      className="remove-position" 
                      onClick={() => removePosition(index)}
                    >
                      🗑️ Usuń
                    </button>
                  </div>
                  <div className="position-details">
                    <div className="form-group">
                      <label>Materiał:</label>
                      <div className="search-container">
                        <input 
                          type="text" 
                          placeholder="Wyszukaj materiał..."
                          value={materialSearch[index] || ''}
                          onChange={(e) => searchMaterials(e.target.value, index)}
                          onFocus={() => handleMaterialFocus(index)}
                          disabled={formData.typ === 'WZ' && !formData.magazynId}
                        />
                        {formData.typ === 'WZ' && !formData.magazynId && (
                          <div className="form-hint">Wybierz najpierw magazyn</div>
                        )}
                        {showMaterialResults[index] && (
                          <div className="search-results show">
                            {filteredMaterials.map(material => (
                              <div 
                                key={material.idMaterialu}
                                className="search-result"
                                onClick={() => selectMaterial(material, index)}
                              >
                                {material.nazwa} ({material.jednostka})
                                {formData.typ === 'WZ' && material.stanMagazynowy !== undefined && (
                                  <span style={{float: 'right', color: '#666'}}>
                                    dostępne: {material.stanMagazynowy}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>
                        Ilość:
                        {formData.typ === 'WZ' && pozycja.maxIlosc && (
                          <span className="max-quantity">
                            (maks: {pozycja.maxIlosc})
                          </span>
                        )}
                      </label>
                      <input 
                        type="number" 
                        step="1" 
                        min="0" 
                        max={formData.typ === 'WZ' ? pozycja.maxIlosc : undefined}
                        placeholder="0"
                        value={pozycja.ilosc || ''}
                        onChange={(e) => updatePosition(index, 'ilosc', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="button" 
              className="add-position-btn" 
              onClick={addPosition}
              disabled={formData.typ === 'WZ' && !formData.magazynId}
            >
              <span>+</span> Dodaj pozycję
            </button>
          </div>

          {/* Podsumowanie */}
          <div className="form-section">
            <h3>📊 Podsumowanie</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Liczba pozycji:</label>
                <input type="text" value={positionsCount} readOnly />
              </div>
              <div className="form-group">
                <label>Łączna ilość:</label>
                <input type="text" value={totalQuantity.toFixed(2)} readOnly />
              </div>
            </div>
          </div>

          {/* Akcje */}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={cancelEdit}>
              Anuluj
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zaktualizuj dokument'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditDocument;