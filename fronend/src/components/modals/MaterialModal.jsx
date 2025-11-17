// src/components/MaterialModal.js
import React from 'react';

function MaterialModal({ 
  showModal, 
  editingMaterial, 
  formData, 
  onClose, 
  onSubmit, 
  onFormChange 
}) {
  if (!showModal) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{editingMaterial ? 'Edytuj materiał' : 'Dodaj nowy materiał'}</h2>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="materialName">Nazwa materiału:</label>
            <input 
              type="text" 
              id="materialName"
              value={formData.nazwa}
              onChange={(e) => onFormChange('nazwa', e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="materialUnit">Jednostka:</label>
            <input 
              type="text" 
              id="materialUnit"
              value={formData.jednostka}
              onChange={(e) => onFormChange('jednostka', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="materialDescription">Opis:</label>
            <textarea 
              id="materialDescription"
              value={formData.opis}
              onChange={(e) => onFormChange('opis', e.target.value)}
              rows="3"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="save-btn">
              {editingMaterial ? 'Zaktualizuj' : 'Zapisz materiał'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MaterialModal;