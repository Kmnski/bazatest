import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import './AdminPanel.css';

const AdminPanel = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

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

    const adminCards = [
        {
            icon: '✅',
            title: 'Zatwierdzanie dokumentów',
            description: 'Przeglądaj i zatwierdzaj dokumenty oczekujące na akceptację',
            onClick: () => navigate('/approval-panel')
        },
        {
            icon: '👨‍💼',
            title: 'Zarządzanie użytkownikami',
            description: 'Dodawaj, edytuj i zarządzaj rolami użytkowników systemu',
            onClick: () => navigate('/users-management')
        },

    ];

    if (loading) {
        return (
            <div className="admin-panel">
                <div className="admin-loading">Ładowanie...</div>
            </div>
        );
    }

    return (
        <div className="admin-panel">
            <div className="admin-panel-body">
                <div className="admin-container">
                    <div className="admin-header">
                        <h1>👑 Panel administratora</h1>
                        <div className="admin-nav-buttons">
                            <button 
                                className="admin-btn admin-btn-secondary"
                                onClick={() => navigate('/dashboard')}
                            >
                                📊 Dashboard
                            </button>
                            <button 
                                className="admin-btn admin-btn-danger" 
                                onClick={handleLogout}
                            >
                                🚪 Wyloguj
                            </button>
                        </div>
                    </div>

                    <div className="admin-content">
                        {error && (
                            <div className="admin-error-banner">
                                ⚠️ {error}
                                <button onClick={() => setError(null)}>×</button>
                            </div>
                        )}

                        <h2 className="admin-section-title">Narzędzia administracyjne</h2>
                        <div className="admin-grid">
                            {adminCards.map((card, index) => (
                                <div 
                                    key={index}
                                    className="admin-card"
                                    onClick={card.onClick}
                                    role="button"
                                    tabIndex={0}
                                    onKeyPress={(e) => e.key === 'Enter' && card.onClick()}
                                >
                                    <div className="admin-card-icon">{card.icon}</div>
                                    <div className="admin-card-title">{card.title}</div>
                                    <div className="admin-card-description">{card.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;