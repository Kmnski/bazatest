// src/components/SupplierModal.js
import React from 'react';

function SupplierModal({ 
  showModal, 
  editingSupplier, 
  formData, 
  onClose, 
  onSubmit, 
  onFormChange 
}) {
  if (!showModal) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{editingSupplier ? 'Edytuj dostawcę' : 'Dodaj nowego dostawcę'}</h2>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="supplierName">Nazwa dostawcy:</label>
            <input 
              type="text" 
              id="supplierName"
              value={formData.nazwa}
              onChange={(e) => onFormChange('nazwa', e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="supplierEmail">Email:</label>
            <input 
              type="email" 
              id="supplierEmail"
              value={formData.email}
              onChange={(e) => onFormChange('email', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="supplierPhone">Telefon:</label>
            <input 
              type="tel" 
              id="supplierPhone"
              value={formData.telefon}
              onChange={(e) => onFormChange('telefon', e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="save-btn">
              {editingSupplier ? 'Zaktualizuj' : 'Zapisz dostawcę'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SupplierModal;