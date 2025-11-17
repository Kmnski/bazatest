import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI, warehousesAPI, suppliersAPI, receiversAPI, materialsAPI } from '../api';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import SupplierModal from '../components/modals/SupplierModal';
import ReceiverModal from '../components/modals/ReceiverModal';
import MaterialModal from '../components/modals/MaterialModal';
import { useReceiverModal } from '../hooks/useReceiverModal';
import { useMaterialModal } from '../hooks/useMaterialModal';
import { useSupplierModal } from '../hooks/useSupplierModal';
import { useDropdownSearch } from '../hooks/useDropdownSearch';
import './NewDocument.css';

function NewDocument({ user, onLogout }) {
  const navigate = useNavigate();
  
  // Stan formularza
  const [formData, setFormData] = useState({
    typ: 'PZ',
    data: new Date().toISOString().split('T')[0],
    magazynId: '',
    dostawcaId: '',
    odbiorcaId: '',
    pozycje: []
  });

  // Hooki dla wyszukiwania z dropdownem
  const warehouseSearch = useDropdownSearch(warehousesAPI.getMagazyny);
  const supplierSearch = useDropdownSearch(suppliersAPI.getDostawcy);
  const receiverSearch = useDropdownSearch(receiversAPI.getOdbiorcy);
  
  // Dla materiałów potrzebujemy specjalnego hooka bo zależy od typu dokumentu
  const [materials, setMaterials] = useState([]);
  const [warehouseMaterials, setWarehouseMaterials] = useState([]);
  const [materialSearch, setMaterialSearch] = useState({});
  const [showMaterialResults, setShowMaterialResults] = useState({});

  // Hooki dla modalów
  const supplierModal = useSupplierModal();
  const receiverModal = useReceiverModal();
  const materialModal = useMaterialModal();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Ładowanie materiałów magazynu gdy zmieni się wybrany magazyn
  useEffect(() => {
    if (formData.magazynId && formData.typ === 'WZ') {
      loadWarehouseMaterials();
    } else {
      setWarehouseMaterials([]);
    }
  }, [formData.magazynId, formData.typ]);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      
      const [materialsResponse] = await Promise.all([
        materialsAPI.getMaterialy()
      ]);

      setMaterials(materialsResponse.data);

    } catch (error) {
      console.error('Błąd ładowania danych:', error);
      alert('Błąd podczas ładowania danych');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadWarehouseMaterials = async () => {
    try {
      const response = await warehousesAPI.getWarehouseMaterials(formData.magazynId);
      setWarehouseMaterials(response.data);
    } catch (error) {
      console.error('Błąd ładowania materiałów magazynu:', error);
      alert('Błąd podczas ładowania materiałów z magazynu');
    }
  };

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
      supplierSearch.setSearchQuery('');
      receiverSearch.setSearchQuery('');
      setMaterialSearch({});
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Wybór magazynu
  const selectWarehouse = (warehouse) => {
    console.log('🔍 Wybrany magazyn:', warehouse); // 👈 DODAJ TEN LOG
    warehouseSearch.handleSelect(warehouse);
    setFormData(prev => ({ 
      ...prev, 
      magazynId: warehouse.idMagazynu,
      pozycje: []
    }));
    setMaterialSearch({});
  };

// Wybór dostawcy/odbiorcy
const selectCounterparty = (counterparty) => {
  if (formData.typ === 'PZ') {
    supplierSearch.handleSelect(counterparty); // ✅ USUŃ const selected
    setFormData(prev => ({ ...prev, dostawcaId: counterparty.idDostawcy })); // ✅ UŻYJ bezpośrednio counterparty
  } else {
    receiverSearch.handleSelect(counterparty); // ✅ USUŃ const selected
    setFormData(prev => ({ ...prev, odbiorcaId: counterparty.idOdbiorcy })); // ✅ UŻYJ bezpośrednio counterparty
  }
};

  // Wyszukiwanie materiałów dla pozycji (pozostaje podobne)
  const searchMaterials = (query, positionIndex) => {
    setMaterialSearch(prev => ({ ...prev, [positionIndex]: query }));
  };

  const handleMaterialFocus = (positionIndex) => {
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

  // Reszta funkcji pozostaje podobna (addPosition, removePosition, updatePosition, etc.)
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

  // Funkcje modalów pozostają bez zmian
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      const response = await suppliersAPI.createSupplier(supplierModal.formData);
      supplierSearch.refetch(); // Odśwież listę dostawców
      supplierModal.closeModal();
      alert('Dostawca został dodany!');
    } catch (error) {
      console.error('Błąd dodawania dostawcy:', error);
      alert('Błąd podczas dodawania dostawcy');
    }
  };

   const handleAddReceiver = async (e) => {
    e.preventDefault();
    try {
      const response = await receiversAPI.createReceiver(receiverModal.formData);
      receiverSearch.refetch(); // Odśwież listę odbiorców
      receiverModal.closeModal();
      alert('Odbiorca został dodany!');
    } catch (error) {
      console.error('Błąd dodawania odbiorcy:', error);
      alert('Błąd podczas dodawania odbiorcy');
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      const response = await materialsAPI.createMaterial(materialModal.formData);
      // Odśwież listę materiałów
      const materialsResponse = await materialsAPI.getMaterialy();
      setMaterials(materialsResponse.data);
      materialModal.closeModal();
      alert('Materiał został dodany!');
    } catch (error) {
      console.error('Błąd dodawania materiału:', error);
      alert('Błąd podczas dodawania materiału');
    }
  };

  const openCounterpartyModal = () => {
    if (formData.typ === 'PZ') {
      supplierModal.openAddModal();
    } else {
      receiverModal.openAddModal();
    }
  };

  // Podsumowanie i handleSubmit pozostają bez zmian
  const getSummary = () => {
    const positionsCount = formData.pozycje.length;
    const totalQuantity = formData.pozycje.reduce((sum, pozycja) => {
      return sum + (parseFloat(pozycja.ilosc) || 0);
    }, 0);
    return { positionsCount, totalQuantity };
  };

  const { positionsCount, totalQuantity } = getSummary();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
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

      const response = await documentsAPI.createDokument(documentData);
      alert('Dokument został utworzony pomyślnie!');
      navigate('/documents');
      
    } catch (error) {
      console.error('❌ Błąd tworzenia dokumentu:', error);
      alert('Błąd podczas tworzenia dokumentu: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const cancelDocument = () => {
    if (window.confirm('Czy na pewno chcesz anulować tworzenie dokumentu?')) {
      navigate('/documents');
    }
  };

  // Ukrywanie wyników wyszukiwania przy kliknięciu gdzie indziej
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        warehouseSearch.handleCloseResults();
        supplierSearch.handleCloseResults();
        receiverSearch.handleCloseResults();
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
            <div>Ładowanie danych...</div>
          </div>
        </div>
      </div>
    );
  }

  // Available materials based on document type
  const availableMaterials = formData.typ === 'WZ' ? warehouseMaterials : materials;

  return (
    <div className="new-document">
      <Header user={user} onLogout={onLogout} />
      <Navigation activeSection="documents" />
      
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">
            📝 Nowy dokument {formData.typ}
          </h1>
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
                  value={formData.typ === 'PZ' ? supplierSearch.searchQuery : receiverSearch.searchQuery}
                  onChange={(e) => formData.typ === 'PZ' 
                    ? supplierSearch.setSearchQuery(e.target.value)
                    : receiverSearch.setSearchQuery(e.target.value)
                  }
                  onFocus={formData.typ === 'PZ' ? supplierSearch.handleFocus : receiverSearch.handleFocus}
                />
                {formData.typ === 'PZ' && supplierSearch.showResults && (
                  <div className="search-results show">
                    {supplierSearch.data.map(supplier => (
                      <div 
                        key={supplier.idDostawcy}
                        className="search-result"
                        onClick={() => selectCounterparty(supplier)}
                      >
                        {supplier.nazwa} ({supplier.email})
                      </div>
                    ))}
                  </div>
                )}
                {formData.typ === 'WZ' && receiverSearch.showResults && (
                  <div className="search-results show">
                    {receiverSearch.data.map(receiver => (
                      <div 
                        key={receiver.idOdbiorcy}
                        className="search-result"
                        onClick={() => selectCounterparty(receiver)}
                      >
                        {receiver.nazwa} ({receiver.email})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button 
                type="button" 
                className="add-new-btn" 
                onClick={openCounterpartyModal}
              >
                + Dodaj nowego {formData.typ === 'PZ' ? 'dostawcę' : 'odbiorcę'}
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
                          disabled={formData.typ === 'WZ' && !formData.magazynId}
                        />
                        {formData.typ === 'WZ' && !formData.magazynId && (
                          <div className="form-hint">Wybierz najpierw magazyn</div>
                        )}
                        {showMaterialResults[index] && (
                          <div className="search-results show">
                            {availableMaterials.map(material => (
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
                      {formData.typ === 'PZ' && (
                        <button 
                          type="button" 
                          className="add-new-btn" 
                          onClick={materialModal.openAddModal}
                          style={{ marginTop: '5px' }}
                        >
                          + Dodaj nowy materiał
                        </button>
                      )}
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
            <button type="button" className="cancel-btn" onClick={cancelDocument}>
              Anuluj
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zapisz dokument'}
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

      <ReceiverModal
        showModal={receiverModal.showModal}
        editingReceiver={receiverModal.editingReceiver}
        formData={receiverModal.formData}
        onClose={receiverModal.closeModal}
        onSubmit={handleAddReceiver}
        onFormChange={receiverModal.handleFormChange}
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

export default NewDocument;