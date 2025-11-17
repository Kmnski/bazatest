import React from 'react';
import { receiversAPI } from '../api';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import SearchBar from '../components/SearchBar';
import ReceiverModal from '../components/modals/ReceiverModal';
import { useReceiverModal } from '../hooks/useReceiverModal';
import { useSearch } from '../hooks/useSearch';
import './Suppliers.css'; 

function Receivers({ user, onLogout }) {
  
  const {
    data: odbiorcy,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refetch: fetchOdbiorcy
  } = useSearch(receiversAPI.getOdbiorcy);

    // DEBUG - dodaj te logi
  console.log('🔍 DEBUG Receivers:', {
    odbiorcyCount: odbiorcy.length,
    searchQuery: searchQuery,
    loading: loading,
    error: error
  });

  // Hook dla modala
  const receiverModal = useReceiverModal();

  // Funkcja zapisywania odbiorcy
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (receiverModal.editingReceiver) {
        const receiverDataWithId = {
          idOdbiorcy: receiverModal.editingReceiver.idOdbiorcy,
          ...receiverModal.formData
        };
        
        await receiversAPI.updateReceiver(receiverModal.editingReceiver.idOdbiorcy, receiverDataWithId);
        alert('Odbiorca zaktualizowany!');
      } else {
        await receiversAPI.createReceiver(receiverModal.formData);
        alert('Odbiorca dodany!');
      }
      
      receiverModal.closeModal();
      fetchOdbiorcy(); // Odśwież listę
    } catch (error) {
      console.error('Błąd zapisywania odbiorcy:', error);
      alert('Błąd podczas zapisywania odbiorcy: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteReceiver = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego odbiorcę?\n\nUWAGA: Odbiorca zostanie ukryty, ale pozostanie w bazie danych ze względu na powiązane dokumenty.')) {
      try {
        await receiversAPI.deleteReceiver(id);
        alert('Odbiorca został ukryty!');
        fetchOdbiorcy();
      } catch (error) {
        console.error('Błąd usuwania odbiorcy:', error);
        alert('Błąd podczas usuwania odbiorcy: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) {
    return (
      <div className="receivers">
        <Header user={user} onLogout={onLogout} />
        <Navigation activeSection="receivers" />
        <div className="main-content">
          <div style={{textAlign: 'center', padding: '50px'}}>
            <div>Ładowanie odbiorców...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="receivers">
      <Header user={user} onLogout={onLogout} />
      <Navigation activeSection="receivers" />
      
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">👥 Zarządzanie odbiorcami</h1>
          <button className="add-button" onClick={receiverModal.openAddModal}>
            <span>+</span> Dodaj odbiorcę
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
          placeholder="Szukaj odbiorców po nazwie, email lub adresie..."
        />

        {/* Tabela odbiorców */}
        <div className="s-table">
          <table>
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Adres</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {odbiorcy.length > 0 ? (
                odbiorcy.map((receiver) => (
                  <tr key={receiver.idOdbiorcy}>
                    <td><strong>{receiver.nazwa}</strong></td>
                    <td>{receiver.email || '-'}</td>
                    <td>{receiver.telefon || '-'}</td>
                    <td>{receiver.adres || '-'}</td>
                    <td>
                      <div className="suppliers-action-buttons">
                        <button 
                          className="edit-btn" 
                          onClick={() => receiverModal.openEditModal(receiver)}
                        >
                          Edytuj
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteReceiver(receiver.idOdbiorcy)}
                        >
                          Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>
                    {searchQuery ? 'Brak odbiorców spełniających kryteria wyszukiwania' : 'Brak odbiorców'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReceiverModal
        showModal={receiverModal.showModal}
        editingReceiver={receiverModal.editingReceiver}
        formData={receiverModal.formData}
        onClose={receiverModal.closeModal}
        onSubmit={handleSubmit}
        onFormChange={receiverModal.handleFormChange}
      />
    </div>
  );
}

export default Receivers;