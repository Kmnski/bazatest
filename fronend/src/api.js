
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// INTERCEPTOR DO AUTOMATYCZNEGO PRZEKIEROWANIA PRZY 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);



// Interceptor do automatycznego dodawania tokena
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  //getMe: () => api.get('/auth/me'),
  getAllUsers: () => api.get('/auth/AllUsers'),
  dodajRole: (data) => api.post('/auth/DodajRole', data),
};

export const materialsAPI = {
  getMaterialy: () => api.get('/Materialy'),
  createMaterial: (materialData) => api.post('/Materialy', materialData),
};

export const dashboardAPI = {
  getStatystyki: () => api.get('/dashboard/statystyki'),
  getOstatniaAktywnosc: () => api.get('/dashboard/ostatnia-aktywnosc'),
};

export const suppliersAPI = {
  getDostawcy: () => api.get('/Dostawca'),
  //getSupplier: (id) => api.get(`/Dostawca/${id}`),
  createSupplier: (supplierData) => api.post('/Dostawca', supplierData),
  updateSupplier: (id, supplierData) => api.put(`/Dostawca/${id}`, supplierData),
  deleteSupplier: (id) => api.delete(`/Dostawca/${id}`),
  searchSuppliers: (query) => api.get(`/Dostawca/search?query=${query}`)
};


export const receiversAPI = {
  getOdbiorcy: () => api.get('/Odbiorca'),
  //getReceiver: (id) => api.get(`/Odbiorca/${id}`),
  createReceiver: (receiverData) => api.post('/Odbiorca', receiverData),
  updateReceiver: (id, receiverData) => api.put(`/Odbiorca/${id}`, receiverData),
  deleteReceiver: (id) => api.delete(`/Odbiorca/${id}`),
  searchReceivers: (query) => api.get(`/Odbiorca/search?query=${query}`)
};

export const warehousesAPI = {
  getMagazyny: () => api.get('/Magazyn'),
  //getWarehouse: (id) => api.get(`/Magazyn/${id}`),
  getWarehouseMaterials: (id) => api.get(`/Magazyn/${id}/materials`)
};


export const documentsAPI = {
  getDokumenty: () => api.get('/Dokument'),
  getDokument: (id) => api.get(`/Dokument/${id}`),
  createDokument: (dokumentData) => api.post('/Dokument', dokumentData),
  updateDokument: (id, dokumentData) => api.put(`/Dokument/${id}`, dokumentData),
  deleteDokument: (id) => api.delete(`/Dokument/${id}`),
  searchDokumenty: (query) => api.get(`/Dokument/search?query=${encodeURIComponent(query)}`),
  getFilteredDokumenty: (filters) => api.get('/Dokument/filter', { params: filters }),
  getPozycjeDokumentu: (dokumentId) => api.get(`/Dokument/${dokumentId}/pozycje`),
  getPendingDocuments: () => api.get('/Dokument/pending'),
  approveDocument: (id) => api.put(`/Dokument/${id}/approve`),
  rejectDocument: (id, data) => api.put(`/Dokument/${id}/reject`, data),
};




export default api;