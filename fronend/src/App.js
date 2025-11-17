// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './components/common.css'
import Login from './Login';
import Dashboard from './pages/Dashboard';

import Suppliers from './pages/Suppliers';
import Receivers from './pages/Receivers';
import NewPZ from './pages/NewPZ';
import NewWZ from './pages/NewWZ';
import Documents from './pages/Documents';
import DocumentView from './pages/DocumentView';
import NewDocument from './pages/NewDocument';
import AdminPanel from './pages/AdminPanel';
import ApprovalPanel from './pages/ApprovalPanel';
import UserManagement from './pages/UsersManagement';
import EditDocument from './pages/EditDocument';

import ProtectedRoute from './ProtectedRoute';



function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Ładowanie aplikacji...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            !isAuthenticated
              ? <Login onLogin={handleLogin} />
              : <Navigate to="/dashboard" />
          }
        />

        {/* Protected routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} loading={loading} />}>
          <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} user={user} />} />
          <Route path="/suppliers" element={<Suppliers onLogout={handleLogout} user={user} />}/>
          <Route path="/receivers" element={<Receivers onLogout={handleLogout} user={user} />}/>
          <Route path="/documents" element={<Documents user={user} onLogout={handleLogout} />} />
          <Route path="/document-create" element={<NewDocument user={user} onLogout={handleLogout} />} />
          <Route path="/document-view/:id" element={<DocumentView user={user} onLogout={handleLogout} />} />
          <Route path="/admin" element={<AdminPanel user={user} onLogout={handleLogout} />} />
          <Route path="/approval-panel" element={<ApprovalPanel user={user} onLogout={handleLogout} />} />
          <Route path="/users-management" element={<UserManagement user={user} onLogout={handleLogout} />} />
          <Route path="/document-edit/:id" element={<EditDocument user={user} onLogout={handleLogout} />}/>
          <Route path="/documents/new-pz" element={<NewPZ user={user} />} />
          <Route path="/documents/new-wz" element={<NewWZ user={user} />} />
          

        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
