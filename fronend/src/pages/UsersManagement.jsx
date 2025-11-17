import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import './UsersManagement.css';

const UsersManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await authAPI.getAllUsers();
            const usersData = response.data || [];
            
            console.log('Otrzymani użytkownicy:', usersData); // DEBUG
            
            setUsers(usersData);
            
        } catch (err) {
            console.error('Błąd pobierania użytkowników:', err);
            setError('Nie udało się załadować listy użytkowników');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (userId, newRole) => {
        try {
            setActionLoading(userId);
            
            const user = users.find(u => u.id === userId);
            if (!user) return;

            // Mapuj stringi na wartości enum Rola
            const roleMap = {
                'Brak': 0,        // Rola.Brak
                'Magazynier': 1,  // Rola.Magazynier  
                'Admin': 2        // Rola.Admin
            };

            const roleValue = roleMap[newRole];

            if (window.confirm(`Czy na pewno chcesz zmienić rolę użytkownika ${user.email} na: ${getRoleDisplayName(newRole)}?`)) {
                const requestData = {
                    UserId: userId,
                    Rola: roleValue // Wysyłamy wartość enum (0, 1, 2)
                };
                
                console.log('Wysyłane dane:', requestData);
                
                await authAPI.dodajRole(requestData);
                alert(`Rola użytkownika ${user.email} została zmieniona`);
                fetchUsers(); // Odśwież listę
            }
        } catch (err) {
            console.error('Błąd zmiany roli użytkownika:', err);
            console.error('Szczegóły błędu:', err.response?.data);
            alert('Nie udało się zmienić roli użytkownika. Sprawdź konsolę.');
        } finally {
            setActionLoading(null);
        }
    };

    const getRoleDisplayName = (roleValue) => {
        // roleValue może być liczbą (enum) lub stringiem
        const roleMap = {
            0: 'Brak rangi',
            1: 'Magazynier', 
            2: 'Admin',
            'Brak': 'Brak rangi',
            'Magazynier': 'Magazynier',
            'Admin': 'Admin'
        };
        return roleMap[roleValue] || 'Brak rangi';
    };

    const getRoleBadgeClass = (roleValue) => {
        const roleMap = {
            0: 'users-role-none',
            1: 'users-role-warehouseman', 
            2: 'users-role-admin',
            'Brak': 'users-role-none',
            'Magazynier': 'users-role-warehouseman',
            'Admin': 'users-role-admin'
        };
        return roleMap[roleValue] || 'users-role-none';
    };

    const getCurrentRoleValue = (roleValue) => {
        // Konwertuj wartość enum na string dla selecta
        const roleMap = {
            0: 'Brak',
            1: 'Magazynier',
            2: 'Admin',
            'Brak': 'Brak',
            'Magazynier': 'Magazynier', 
            'Admin': 'Admin'
        };
        return roleMap[roleValue] || 'Brak';
    };

    const handleLogout = async () => {
        if (window.confirm('Czy na pewno chcesz się wylogować?')) {
            try {
                await authAPI.logout();
            } catch (err) {
                console.error('Błąd podczas wylogowywania:', err);
            } finally {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Oblicz statystyki - uwzględnij wartości enum
    const stats = {
        totalUsers: users.length,
        adminUsers: users.filter(u => u.rola === 2 || u.rola === 'Admin').length,
        warehousemanUsers: users.filter(u => u.rola === 1 || u.rola === 'Magazynier').length,
        noneUsers: users.filter(u => !u.rola || u.rola === 0 || u.rola === 'Brak').length
    };

    if (loading) {
        return (
            <div className="users-management">
                <div className="users-loading">Ładowanie użytkowników...</div>
            </div>
        );
    }

    return (
        <div className="users-management">
            <div className="users-management-body">
                <div className="users-container">
                    <div className="users-header">
                        <h1>👨‍💼 Zarządzanie użytkownikami</h1>
                        <div className="users-nav-buttons">
                            <button 
                                className="users-btn users-btn-secondary"
                                onClick={() => navigate('/admin-panel')}
                            >
                                📊 Panel administratora
                            </button>
                            <button 
                                className="users-btn users-btn-secondary"
                                onClick={() => navigate('/documents')}
                            >
                                📋 Dokumenty
                            </button>
                            <button 
                                className="users-btn users-btn-danger" 
                                onClick={handleLogout}
                            >
                                🚪 Wyloguj
                            </button>
                        </div>
                    </div>

                    <div className="users-content">
                        {error && (
                            <div className="users-error-banner">
                                ⚠️ {error}
                                <button onClick={() => setError(null)}>×</button>
                            </div>
                        )}

                        <div className="users-stats-grid">
                            <div className="users-stat-card">
                                <div className="users-stat-number">{stats.totalUsers}</div>
                                <div className="users-stat-label">Wszyscy użytkownicy</div>
                            </div>
                            <div className="users-stat-card">
                                <div className="users-stat-number">{stats.adminUsers}</div>
                                <div className="users-stat-label">Administratorzy</div>
                            </div>
                            <div className="users-stat-card">
                                <div className="users-stat-number">{stats.warehousemanUsers}</div>
                                <div className="users-stat-label">Magazynierzy</div>
                            </div>
                            <div className="users-stat-card">
                                <div className="users-stat-number">{stats.noneUsers}</div>
                                <div className="users-stat-label">Brak rangi</div>
                            </div>
                        </div>

                        <h2 className="users-section-title">Lista użytkowników</h2>
                        
                        <div className="users-grid">
                            {!users || users.length === 0 ? (
                                <div className="users-empty-state">
                                    <div>👥</div>
                                    <h3>Brak użytkowników</h3>
                                    <p>Nie znaleziono żadnych użytkowników w systemie.</p>
                                </div>
                            ) : (
                                users.map(user => (
                                    <div key={user.id} className="users-user-card">
                                        <div className="users-user-info">
                                            <h3>{user.imie && user.nazwisko ? `${user.imie} ${user.nazwisko}` : user.email}</h3>
                                            <p><strong>Email:</strong> {user.email}</p>
                                            
                                            
                                        </div>
                                        <div className="users-user-actions">
                                            <select 
                                                className="users-role-select"
                                                value={getCurrentRoleValue(user.rola)}
                                                onChange={(e) => updateUserRole(user.id, e.target.value)}
                                                disabled={actionLoading === user.id}
                                            >
                                                <option value="Brak">Brak rangi</option>
                                                <option value="Magazynier">Magazynier</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                            
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersManagement;