import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { LoginRequest } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await authService.login(formData);
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);
      navigate('/characters');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Invalid username or password';
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <div className="flex-row justify-space-between align-center mb-20">
        <h2>{t.login.title}</h2>
        <LanguageToggle />
      </div>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label-block">{t.login.username}:</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            className="auth-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label-block">{t.login.password}:</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="auth-input"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {t.login.loginButton}
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="btn-primary"
          >
            {t.login.registerLink}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
