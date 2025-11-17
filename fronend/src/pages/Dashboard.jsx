import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../api';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import './Dashboard.css';

function Dashboard({ onLogout, user }) {
  const [statystyki, setStatystyki] = useState({
    liczbaMaterialow: 0,
    dzisiejszeDokumenty: 0,
    aktywniDostawcy: 0,
    liczbaMagazynow: 0
  });
  
  const [ostatniaAktywnosc, setOstatniaAktywnosc] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const [statystykiResponse, aktywnoscResponse] = await Promise.all([
          dashboardAPI.getStatystyki(),
          dashboardAPI.getOstatniaAktywnosc()
        ]);

        setStatystyki(statystykiResponse.data);
        
        if (aktywnoscResponse.data && Array.isArray(aktywnoscResponse.data)) {
          setOstatniaAktywnosc(aktywnoscResponse.data);
        } else {
          console.warn('Nieprawidłowy format danych aktywności:', aktywnoscResponse.data);
          setOstatniaAktywnosc([]);
        }
        
      } catch (error) {
        console.error('Błąd pobierania danych:', error);
        setStatystyki({
          liczbaMaterialow: 0,
          dzisiejszeDokumenty: 0,
          aktywniDostawcy: 0,
          liczbaMagazynow: 0
        });
        setOstatniaAktywnosc([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCzas = (dataString) => {
    if (!dataString) return 'brak daty';
    
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) {
        return 'nieprawidłowa data';
      }
      
      const teraz = new Date();
      const roznica = teraz - data; // różnica w ms

      const dni = Math.floor(roznica / (1000 * 60 * 60 * 24));

      if (dni < 1) return 'dziś';
      if (dni === 1) return 'wczoraj';
      if (dni < 7) return `${dni} dni temu`;
      if (dni < 30) return `${Math.floor(dni / 7)} tyg. temu`;
      return `${Math.floor(dni / 30)} mies. temu`;
    } catch (error) {
      console.error('Błąd formatowania daty:', error, dataString);
      return 'błąd daty';
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Header user={user} onLogout={onLogout} />
        <Navigation activeSection="dashboard" />
        <div className="main-content">
          <div style={{textAlign: 'center', padding: '50px'}}>
            <div>Ładowanie danych...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />
      <Navigation activeSection="dashboard" />
      
      <div className="main-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>ŁĄCZNA LICZBA MATERIAŁÓW</h3>
            <div className="number">{statystyki.liczbaMaterialow}</div>
          </div>
          <div className="stat-card">
            <h3>DZISIEJSZE DOKUMENTY</h3>
            <div className="number">{statystyki.dzisiejszeDokumenty}</div>
          </div>
          <div className="stat-card">
            <h3>AKTYWNI DOSTAWCY</h3>
            <div className="number">{statystyki.aktywniDostawcy}</div>
          </div>
          <div className="stat-card">
            <h3>MAGAZYNY</h3>
            <div className="number">{statystyki.liczbaMagazynow}</div>
          </div>
        </div>

        <div className="recent-activity">
          <h2>📈 Ostatnia aktywność</h2>
          {ostatniaAktywnosc.length > 0 ? (
            ostatniaAktywnosc.map((aktywnosc, index) => (
              <div key={index} className="activity-item">
                <div className="activity-text">
                  <span className="activity-type">{aktywnosc.typ}</span>
                  <span className="activity-description">
                    <strong>{aktywnosc.numer}</strong> - {aktywnosc.opis}
                  </span>
                </div>
                <div className="activity-time">
                  {aktywnosc.czas ? formatCzas(aktywnosc.czas) : 'brak daty'}
                </div>
              </div>
            ))
          ) : (
            <div className="activity-item">
              <div className="activity-text">
                <span>Brak ostatniej aktywności</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;