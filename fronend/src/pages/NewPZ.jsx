import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI, warehousesAPI, suppliersAPI, materialsAPI } from '../api';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import SupplierModal from '../components/modals/SupplierModal';
import MaterialModal from '../components/modals/MaterialModal';
import { useMaterialModal } from '../hooks/useMaterialModal';
import { useSupplierModal } from '../hooks/useSupplierModal';
import { useDropdownSearch } from '../hooks/useDropdownSearch';

function NewPZ({ user, onLogout }) {
  const navigate = useNavigate();
  
  // Stan formularza
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    magazynId: '',
    dostawcaId: '',
    pozycje: []
  });

  // Hooki dla wyszukiwania
  const warehouseSearch = useDropdownSearch(warehousesAPI.getMagazyny);
  const supplierSearch = useDropdownSearch(suppliersAPI.getDostawcy);
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [materialSearch, setMaterialSearch] = useState({});
  const [showMaterialResults, setShowMaterialResults] = useState({});

  // Hooki dla modalów
  const supplierModal = useSupplierModal();
  const materialModal = useMaterialModal();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      const materialsResponse = await materialsAPI.getMaterialy();
      setMaterials(materialsResponse.data);
      setFilteredMaterials(materialsResponse.data);
    } catch (error) {
      console.error('Błąd ładowania danych:', error);
      alert('Błąd podczas ładowania danych');
    } finally {
      setInitialLoading(false);
    }
  };

  // Funkcja do sprawdzania czy materiał jest już użyty w innych pozycjach
  const isMaterialAlreadyUsed = (materialId, currentPositionIndex) => {
    return formData.pozycje.some((pozycja, index) => 
      index !== currentPositionIndex && pozycja.materialId === materialId
    );
  };

  // Filtrowanie materiałów - wyklucz już wybrane
  const getAvailableMaterials = (currentPositionIndex) => {
    return materials.filter(material => 
      !isMaterialAlreadyUsed(material.idMaterialu, currentPositionIndex)
    );
  };

  // Wybór magazynu
  const selectWarehouse = (warehouse) => {
    warehouseSearch.handleSelect(warehouse);
    setFormData(prev => ({ 
      ...prev, 
      magazynId: warehouse.idMagazynu,
      pozycje: []
    }));
    setMaterialSearch({});
  };

  // Wybór dostawcy
  const selectSupplier = (supplier) => {
    supplierSearch.handleSelect(supplier);
    setFormData(prev => ({ ...prev, dostawcaId: supplier.idDostawcy }));
  };

  // Wyszukiwanie materiałów dla pozycji
  const searchMaterials = (query, positionIndex) => {
    setMaterialSearch(prev => ({ ...prev, [positionIndex]: query }));
    
    if (query.length === 0) {
      setFilteredMaterials(getAvailableMaterials(positionIndex));
      return;
    }

    const availableMaterials = getAvailableMaterials(positionIndex);
    const filtered = availableMaterials.filter(material =>
      material.nazwa?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredMaterials(filtered);
  };

  const handleMaterialFocus = (positionIndex) => {
    setFilteredMaterials(getAvailableMaterials(positionIndex));
    setShowMaterialResults(prev => ({ ...prev, [positionIndex]: true }));
  };

  const selectMaterial = (material, positionIndex) => {
    // Sprawdź czy materiał nie jest już użyty
    if (isMaterialAlreadyUsed(material.idMaterialu, positionIndex)) {
      alert('Ten materiał został już wybrany w innej pozycji!');
      return;
    }

    const updatedPozycje = [...formData.pozycje];
    
    updatedPozycje[positionIndex] = {
      ...updatedPozycje[positionIndex],
      materialId: material.idMaterialu,
      materialNazwa: material.nazwa,
      materialJednostka: material.jednostka
    };
    
    setFormData(prev => ({ ...prev, pozycje: updatedPozycje }));
    setMaterialSearch(prev => ({ 
      ...prev, 
      [positionIndex]: `${material.nazwa} (${material.jednostka})` 
    }));
    setShowMaterialResults(prev => ({ ...prev, [positionIndex]: false }));
  };

  // Zarządzanie pozycjami
  const addPosition = () => {
    setFormData(prev => ({
      ...prev,
      pozycje: [...prev.pozycje, { 
        materialId: '', 
        ilosc: '', 
        materialNazwa: '', 
        materialJednostka: ''
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
    setFormData(prev => ({ ...prev, pozycje: updatedPozycje }));
  };

  // Funkcje zapisywania dla modalów
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      const response = await suppliersAPI.createSupplier(supplierModal.formData);
      supplierSearch.refetch();
      supplierModal.closeModal();
      alert('Dostawca został dodany!');
    } catch (error) {
      console.error('Błąd dodawania dostawcy:', error);
      alert('Błąd podczas dodawania dostawcy');
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      const response = await materialsAPI.createMaterial(materialModal.formData);
      const materialsResponse = await materialsAPI.getMaterialy();
      setMaterials(materialsResponse.data);
      setFilteredMaterials(materialsResponse.data);
      materialModal.closeModal();
      alert('Materiał został dodany!');
    } catch (error) {
      console.error('Błąd dodawania materiału:', error);
      alert('Błąd podczas dodawania materiału');
    }
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

  // Zapis dokumentu
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!formData.magazynId) {
        alert('Wybierz magazyn');
        return;
      }

      if (!formData.dostawcaId) {
        alert('Wybierz dostawcę');
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

      // Walidacja unikalności materiałów
      const materialIds = formData.pozycje.map(p => p.materialId);
      const uniqueMaterialIds = [...new Set(materialIds)];
      if (materialIds.length !== uniqueMaterialIds.length) {
        alert('Nie można użyć tego samego materiału w wielu pozycjach!');
        return;
      }

      const documentData = {
        typ: 'PZ',
        data: formData.data,
        magazynId: parseInt(formData.magazynId),
        dostawcaId: parseInt(formData.dostawcaId),
        uzytkownikId: user.id,
        pozycje: formData.pozycje.map(p => ({
          materialId: parseInt(p.materialId),
          ilosc: parseFloat(p.ilosc)
        }))
      };

      const response = await documentsAPI.createDokument(documentData);
      alert('Dokument PZ został utworzony pomyślnie!');
      navigate('/documents');
      
    } catch (error) {
      console.error('❌ Błąd tworzenia dokumentu PZ:', error);
      alert('Błąd podczas tworzenia dokumentu: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const cancelDocument = () => {
    if (window.confirm('Czy na pewno chcesz anulować tworzenie dokumentu PZ?')) {
      navigate('/documents');
    }
  };

  // Ukrywanie wyników wyszukiwania przy kliknięciu gdzie indziej
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        warehouseSearch.handleCloseResults();
        supplierSearch.handleCloseResults();
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
      <div className="new-pz">
        <Header user={user} onLogout={onLogout} />
        <Navigation activeSection="documents" />
        <div className="main-content">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div>Ładowanie danych...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="new-pz">
      <Header user={user} onLogout={onLogout} />
      <Navigation activeSection="documents" />
      
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">📝 Nowy dokument PZ - Przyjęcie</h1>
          <div>
            <strong>Status:</strong> <span style={{ color: '#e67e22' }}>Tworzony</span>
          </div>
        </div>

        <form className="document-form" onSubmit={handleSubmit}>
          {/* Informacje podstawowe */}
          <div className="form-section">
            <h3>📋 Informacje podstawowe</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="documentDate">Data dokumentu:</label>
                <input 
                  type="date" 
                  id="documentDate"
                  name="data"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  required
                />
              </div>
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
                  value={warehouseSearch.searchQuery}
                  onChange={(e) => warehouseSearch.setSearchQuery(e.target.value)}
                  onFocus={warehouseSearch.handleFocus}
                />
                {warehouseSearch.showResults && (
                  <div className="search-results show">
                    {warehouseSearch.data.map(wh => (
                      <div 
                        key={wh.idMagazynu}
                        className="search-result"
                        onClick={() => selectWarehouse(wh)}
                      >
                        {wh.typ} ({wh.lokalizacja})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dostawca */}
          <div className="form-section">
            <h3>👥 Dostawca</h3>
            <div className="form-group">
              <label>Wybierz dostawcę:</label>
              <div className="search-container">
                <input 
                  type="text" 
                  placeholder="Wyszukaj dostawcę..."
                  value={supplierSearch.searchQuery}
                  onChange={(e) => supplierSearch.setSearchQuery(e.target.value)}
                  onFocus={supplierSearch.handleFocus}
                />
                {supplierSearch.showResults && (
                  <div className="search-results show">
                    {supplierSearch.data.map(supplier => (
                      <div 
                        key={supplier.idDostawcy}
                        className="search-result"
                        onClick={() => selectSupplier(supplier)}
                      >
                        {supplier.nazwa} ({supplier.email})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button 
                type="button" 
                className="add-new-btn" 
                onClick={supplierModal.openAddModal}
              >
                + Dodaj nowego dostawcę
              </button>
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
                        />
                        {showMaterialResults[index] && (
                          <div className="search-results show">
                            {filteredMaterials.map(material => {
                              const isUsed = isMaterialAlreadyUsed(material.idMaterialu, index);
                              return (
                                <div 
                                  key={material.idMaterialu}
                                  className={`search-result ${isUsed ? 'disabled' : ''}`}
                                  onClick={() => !isUsed && selectMaterial(material, index)}
                                  style={isUsed ? { 
                                    opacity: 0.5, 
                                    cursor: 'not-allowed',
                                    backgroundColor: '#f5f5f5'
                                  } : {}}
                                >
                                  {material.nazwa} ({material.jednostka})
                                  {isUsed && (
                                    <span style={{float: 'right', color: '#ff4444', fontSize: '12px'}}>
                                      już wybrany
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <button 
                        type="button" 
                        className="add-new-btn" 
                        onClick={materialModal.openAddModal}
                        style={{ marginTop: '5px' }}
                      >
                        + Dodaj nowy materiał
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Ilość:</label>
                      <input 
                        type="number" 
                        step="1" 
                        min="0"
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
            <button type="button" className="cancel-btn" onClick={cancelDocument}>
              Anuluj
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zapisz dokument PZ'}
            </button>
          </div>
        </form>
      </div>

      {/* Modale */}
      <SupplierModal
        showModal={supplierModal.showModal}
        editingSupplier={supplierModal.editingSupplier}
        formData={supplierModal.formData}
        onClose={supplierModal.closeModal}
        onSubmit={handleAddSupplier}
        onFormChange={supplierModal.handleFormChange}
      />

      <MaterialModal
        showModal={materialModal.showModal}
        editingMaterial={materialModal.editingMaterial}
        formData={materialModal.formData}
        onClose={materialModal.closeModal}
        onSubmit={handleAddMaterial}
        onFormChange={materialModal.handleFormChange}
      />
    </div>
  );
}

export default NewPZ;