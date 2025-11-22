import React from 'react';
import { suppliersAPI } from '../api';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import SearchBar from '../components/SearchBar';
import SupplierModal from '../components/modals/SupplierModal';
import { useSupplierModal } from '../hooks/useSupplierModal';
import { useSearch } from '../hooks/useSearch';


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
        
      } else {
        await suppliersAPI.createSupplier(supplierModal.formData);
        
      }
      
      supplierModal.closeModal();
      fetchDostawcy();
    } catch (error) {
      
    }
  };

  const deleteSupplier = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego dostawcę?')) {
      try {
        await suppliersAPI.deleteSupplier(id);
        
        fetchDostawcy();
      } catch (error) {
        
        
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