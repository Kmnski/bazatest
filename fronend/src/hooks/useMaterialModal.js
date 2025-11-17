// src/hooks/useMaterialModal.js
import { useState } from 'react';

export function useMaterialModal() {
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    nazwa: '',
    jednostka: '',
    opis: ''
  });

  const openAddModal = () => {
    setEditingMaterial(null);
    setFormData({ nazwa: '', jednostka: '', opis: '' });
    setShowModal(true);
  };

  const openEditModal = (material) => {
    setEditingMaterial(material);
    setFormData({
      nazwa: material.nazwa,
      jednostka: material.jednostka,
      opis: material.opis || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMaterial(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    showModal,
    editingMaterial,
    formData,
    openAddModal,
    openEditModal,
    closeModal,
    handleFormChange
  };
}