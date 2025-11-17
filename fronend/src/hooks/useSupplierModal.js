
import { useState } from 'react';

export function useSupplierModal() {
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    nazwa: '',
    email: '',
    telefon: ''
  });

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({ nazwa: '', email: '', telefon: '' });
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      nazwa: supplier.nazwa,
      email: supplier.email || '',
      telefon: supplier.telefon || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    showModal,
    editingSupplier,
    formData,
    openAddModal,
    openEditModal,
    closeModal,
    handleFormChange
  };
}