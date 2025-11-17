import React from 'react';
import { suppliersAPI } from '../api'; // ✅ poprawione
import Header from '../components/Header'; // ✅ poprawione
import Navigation from '../components/Navigation'; // ✅ poprawione
import SearchBar from '../components/SearchBar'; // ✅ poprawione
import SupplierModal from '../components/modals/SupplierModal'; // ✅ poprawione
import { useSupplierModal } from '../hooks/useSupplierModal'; // ✅ poprawione
import { useSearch } from '../hooks/useSearch'; // ✅ poprawione
import './Suppliers.css';

function Suppliers({ user, onLogout }) {
  // Hook dla wyszukiwania dostawców
  const {
    data: dostawcy,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refetch: fetchDostawcy
  } = useSearch(suppliersAPI.getDostawcy);

  // Hook dla modala
  const supplierModal = useSupplierModal();

  // Funkcja zapisywania dostawcy
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (supplierModal.editingSupplier) {
        const supplierDataWithId = {
          idDostawcy: supplierModal.editingSupplier.idDostawcy,
          ...supplierModal.formData
        };
        
        await suppliersAPI.updateSupplier(supplierModal.editingSupplier.idDostawcy, supplierDataWithId);
        alert('Dostawca zaktualizowany!');
      } else {
        await suppliersAPI.createSupplier(supplierModal.formData);
        alert('Dostawca dodany!');
      }
      
      supplierModal.closeModal();
      fetchDostawcy(); // Odśwież listę
    } catch (error) {
      console.error('Błąd zapisywania dostawcy:', error);
      alert('Błąd podczas zapisywania dostawcy: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteSupplier = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego dostawcę?')) {
      try {
        await suppliersAPI.deleteSupplier(id);
        alert('Dostawca usunięty!');
        fetchDostawcy();
      } catch (error) {
        console.error('Błąd usuwania dostawcy:', error);
        alert('Błąd podczas usuwania dostawcy');
      }
    }
  };

  if (loading) {
    return (
      <div className="suppliers">
        <Header user={user} onLogout={onLogout} />
        <Navigation activeSection="suppliers" />
        <div className="main-content">
          <div style={{textAlign: 'center', padding: '50px'}}>
            <div>Ładowanie dostawców...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="suppliers">
      <Header user={user} onLogout={onLogout} />
      <Navigation activeSection="suppliers" />
      
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">👥 Zarządzanie dostawcami</h1>
          <button className="add-button" onClick={supplierModal.openAddModal}>
            <span>+</span> Dodaj dostawcę
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <SearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Szukaj dostawców po nazwie lub email..."
        />

        <div className="s-table">
          <table>
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {dostawcy.length > 0 ? (
                dostawcy.map((supplier) => (
                  <tr key={supplier.idDostawcy}>
                    <td><strong>{supplier.nazwa}</strong></td>
                    <td>{supplier.email || '-'}</td>
                    <td>{supplier.telefon || '-'}</td>
                    <td>
                      <div className="suppliers-action-buttons">
                        <button 
                          className="edit-btn" 
                          onClick={() => supplierModal.openEditModal(supplier)}
                        >
                          Edytuj
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteSupplier(supplier.idDostawcy)}
                        >
                          Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>
                    {searchQuery ? 'Brak dostawców spełniających kryteria wyszukiwania' : 'Brak dostawców'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierModal
        showModal={supplierModal.showModal}
        editingSupplier={supplierModal.editingSupplier}
        formData={supplierModal.formData}
        onClose={supplierModal.closeModal}
        onSubmit={handleSubmit}
        onFormChange={supplierModal.handleFormChange}
      />
    </div>
  );
}

export default Suppliers;