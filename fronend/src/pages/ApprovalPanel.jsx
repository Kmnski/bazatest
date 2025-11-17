import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI, authAPI } from '../api';
import './ApprovalPanel.css';

const ApprovalPanel = () => {
    const [pendingDocuments, setPendingDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const navigate = useNavigate();

    const fetchPendingDocuments = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await documentsAPI.getPendingDocuments();
            setPendingDocuments(response.data || []);
            
        } catch (err) {
            console.error('Błąd pobierania dokumentów:', err);
            setError('Nie udało się załadować dokumentów oczekujących');
            setPendingDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    const approveDocument = async (docId) => {
        try {
            setActionLoading(docId);
            
            if (window.confirm('Czy na pewno chcesz zatwierdzić ten dokument?')) {
                await documentsAPI.approveDocument(docId);
                alert('Dokument został zatwierdzony pomyślnie');
                fetchPendingDocuments();
            }
        } catch (err) {
            console.error('Błąd zatwierdzania dokumentu:', err);
            alert('Nie udało się zatwierdzić dokumentu');
        } finally {
            setActionLoading(null);
        }
    };

    const rejectDocument = async (docId) => {
        try {
            setActionLoading(docId);
            
            if (window.confirm('Czy na pewno chcesz odrzucić ten dokument?')) {
                await documentsAPI.rejectDocument(docId);
                alert('Dokument został odrzucony pomyślnie');
                fetchPendingDocuments();
            }
        } catch (err) {
            console.error('Błąd odrzucania dokumentu:', err);
            alert('Nie udało się odrzucić dokumentu');
        } finally {
            setActionLoading(null);
        }
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
        fetchPendingDocuments();
    }, []);

    if (loading) {
        return (
            <div className="approval-panel">
                <div className="approval-loading">Ładowanie dokumentów...</div>
            </div>
        );
    }

    return (
        <div className="approval-panel">
            <div className="approval-panel-body">
                <div className="approval-container">
                    <div className="approval-header">
                        <h1>✅ Zatwierdzanie dokumentów</h1>
                        <div className="approval-nav-buttons">
                            <button 
                                className="approval-btn approval-btn-secondary"
                                onClick={() => navigate('/admin-panel')}
                            >
                                📊 Panel administratora
                            </button>
                            <button 
                                className="approval-btn approval-btn-secondary"
                                onClick={() => navigate('/users-management')}
                            >
                                👨‍💼 Zarządzanie użytkownikami
                            </button>
                            <button 
                                className="approval-btn approval-btn-secondary"
                                onClick={() => navigate('/documents')}
                            >
                                📋 Wszystkie dokumenty
                            </button>
                            <button 
                                className="approval-btn approval-btn-danger" 
                                onClick={handleLogout}
                            >
                                🚪 Wyloguj
                            </button>
                        </div>
                    </div>

                    <div className="approval-content">
                        {error && (
                            <div className="approval-error-banner">
                                ⚠️ {error}
                                <button onClick={() => setError(null)}>×</button>
                            </div>
                        )}

                        <h2 className="approval-section-title">Dokumenty oczekujące na zatwierdzenie</h2>
                        
                        <div className="approval-documents-grid">
                            {!pendingDocuments || pendingDocuments.length === 0 ? (
                                <div className="approval-empty-state">
                                    <div>✅</div>
                                    <h3>Brak dokumentów do zatwierdzenia</h3>
                                    <p>Wszystkie dokumenty zostały już rozpatrzone.</p>
                                </div>
                            ) : (
                                pendingDocuments.map(doc => (
                                    <div key={doc.idDokumentu} className="approval-document-card">
                                        <div className="approval-document-header">
                                            <div>
                                                <span className="approval-document-type">
                                                    {doc.typ === 'PZ' ? '📥 Przyjęcie zewnętrzne' : '📤 Wydanie zewnętrzne'}
                                                </span>
                                                <span className="approval-document-number">{doc.numerDokumentu}</span>
                                            </div>
                                            <span className="approval-status-badge approval-status-pending">
                                                Oczekuje
                                            </span>
                                        </div>
                                        
                                        <div className="approval-document-details">
                                            <div className="approval-detail-item">
                                                <span className="approval-detail-label">Data dokumentu</span>
                                                <span className="approval-detail-value">
                                                    {new Date(doc.data).toLocaleDateString('pl-PL')}
                                                </span>
                                            </div>
                                            <div className="approval-detail-item">
                                                <span className="approval-detail-label">Magazyn</span>
                                                <span className="approval-detail-value">{doc.magazynLokalizacja}</span>
                                            </div>
                                            <div className="approval-detail-item">
                                                <span className="approval-detail-label">
                                                    {doc.typ === 'PZ' ? 'Dostawca' : 'Odbiorca'}
                                                </span>
                                                <span className="approval-detail-value">
                                                    {doc.typ === 'PZ' ? doc.dostawcaNazwa : doc.odbiorcaNazwa}
                                                </span>
                                            </div>
                                            <div className="approval-detail-item">
                                                <span className="approval-detail-label">Utworzył</span>
                                                <span className="approval-detail-value">{doc.uzytkownikEmail}</span>
                                            </div>
                                        </div>

                                        {/* POZYCJE DOKUMENTU - TAK JAK W HTML */}
                                        <div className="approval-positions-list">
                                            <strong>Pozycje dokumentu:</strong>
                                            {doc.pozycje && doc.pozycje.length > 0 ? (
                                                doc.pozycje.map((pozycja, index) => (
                                                    <div key={index} className="approval-position-item">
                                                        <span>{pozycja.materialNazwa}</span>
                                                        <span>{pozycja.ilosc} {pozycja.materialJednostka}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="approval-position-item">
                                                    <span>Brak pozycji</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="approval-document-actions">
                                            <button 
                                                className="approval-btn approval-btn-success"
                                                onClick={() => approveDocument(doc.idDokumentu)}
                                                disabled={actionLoading === doc.idDokumentu}
                                            >
                                                {actionLoading === doc.idDokumentu ? '⏳' : '✅'} Zatwierdź
                                            </button>
                                            <button 
                                                className="approval-btn approval-btn-danger"
                                                onClick={() => rejectDocument(doc.idDokumentu)}
                                                disabled={actionLoading === doc.idDokumentu}
                                            >
                                                {actionLoading === doc.idDokumentu ? '⏳' : '❌'} Odrzuć
                                            </button>
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

export default ApprovalPanel;