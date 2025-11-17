// src/hooks/useReceiverModal.js
import { useState } from 'react';

export function useReceiverModal() {
  const [showModal, setShowModal] = useState(false);
  const [editingReceiver, setEditingReceiver] = useState(null);
  const [formData, setFormData] = useState({
    nazwa: '',
    email: '',
    telefon: '',
    adres: ''
  });

  const openAddModal = () => {
    setEditingReceiver(null);
    setFormData({ nazwa: '', email: '', telefon: '', adres: '' });
    setShowModal(true);
  };

  const openEditModal = (receiver) => {
    setEditingReceiver(receiver);
    setFormData({
      nazwa: receiver.nazwa,
      email: receiver.email,
      telefon: receiver.telefon,
      adres: receiver.adres
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingReceiver(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    showModal,
    editingReceiver,
    formData,
    openAddModal,
    openEditModal,
    closeModal,
    handleFormChange
  };
}