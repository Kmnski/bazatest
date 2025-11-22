import React, { useState } from 'react';
import { authAPI } from './api';


function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerData, setRegisterData] = useState({
    imie: '',
    nazwisko: '',
    email: '',
    haslo: ''
  });

  const handleChange = (e) => {
    if (isRegistering) {
      setRegisterData({
        ...registerData,
        [e.target.name]: e.target.value
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
    setError('');
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    if (isRegistering) {
      
      await authAPI.register({
        email: registerData.email,
        haslo: registerData.haslo,
        imie: registerData.imie,
        nazwisko: registerData.nazwisko
      });

      
      alert('Rejestracja zakończona sukcesem! Teraz możesz się zalogować.');
      setIsRegistering(false);
      setRegisterData({ imie: '', nazwisko: '', email: '', haslo: '' }); 
    } else {
      
      const response = await authAPI.login({
        email: formData.email,
        haslo: formData.password
      });

      const userData = response.data;
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify({
        id: userData.id,
        email: userData.email,
        imie: userData.imie,
        nazwisko: userData.nazwisko,
        rola: userData.rola
      }));

      onLogin(userData);
    }
  } catch (error) {
    console.error('Błąd:', error);
    setError(
      error.response?.data?.message ||
      error.response?.data ||
      'Wystąpił błąd. Spróbuj ponownie.'
    );
  } finally {
    setLoading(false);
  }
};


  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo">
          <h1>🏭 System Magazynowy</h1>
          <p>{isRegistering ? 'Zarejestruj nowe konto' : 'Zaloguj się do swojego konta'}</p>
        </div>

        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* FORMULARZ REJESTRACJI */}
          {isRegistering && (
            <>
              <div className="form-group">
                <label htmlFor="imie">Imię:</label>
                <input
                  type="text"
                  id="imie"
                  name="imie"
                  placeholder="Jan"
                  value={registerData.imie}
                  onChange={handleChange}
                  required 
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="nazwisko">Nazwisko:</label>
                <input
                  type="text"
                  id="nazwisko"
                  name="nazwisko"
                  placeholder="Kowalski"
                  value={registerData.nazwisko}
                  onChange={handleChange}
                  required 
                  disabled={loading}
                />
              </div>
            </>
          )}

          {/* WSPÓLNE POLA */}
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="admin@magazyn.pl"
              value={isRegistering ? registerData.email : formData.email}
              onChange={handleChange}
              required 
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło:</label>
            <input 
              type="password"
              id="password"
              name={isRegistering ? "haslo" : "password"}
              placeholder="••••••••"
              value={isRegistering ? registerData.haslo : formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Przetwarzanie...' : (isRegistering ? 'Zarejestruj się' : 'Zaloguj się')}
          </button>
        </form>

        <div className="register-link">
          <p>
            {isRegistering ? 'Masz już konto?' : 'Nie masz konta?'} 
            <a href="#!" onClick={toggleMode}>
              {isRegistering ? ' Zaloguj się' : ' Zarejestruj się'}
            </a>
          </p>
        </div>
        
      </div>
    </div>
  );
}

export default Login;