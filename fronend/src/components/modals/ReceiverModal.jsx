// src/components/ReceiverModal.js
import React from 'react';

function ReceiverModal({
  showModal,
  editingReceiver,
  formData,
  onClose,
  onSubmit,
  onFormChange
}) {
  if (!showModal) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{editingReceiver ? 'Edytuj odbiorcę' : 'Dodaj nowego odbiorcę'}</h2>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="receiverName">Nazwa odbiorcy:</label>
            <input
              type="text"
              id="receiverName"
              value={formData.nazwa}
              onChange={(e) => onFormChange('nazwa', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="receiverEmail">Email:</label>
            <input
              type="email"
              id="receiverEmail"
              value={formData.email}
              onChange={(e) => onFormChange('email', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="receiverPhone">Telefon:</label>
            <input
              type="tel"
              id="receiverPhone"
              value={formData.telefon}
              onChange={(e) => onFormChange('telefon', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="receiverAddress">Adres:</label>
            <input
              type="text"
              id="receiverAddress"
              value={formData.adres}
              onChange={(e) => onFormChange('adres', e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="save-btn">
              {editingReceiver ? 'Zaktualizuj' : 'Zapisz odbiorcę'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReceiverModal;