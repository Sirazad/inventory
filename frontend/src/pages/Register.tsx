import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { RegisterRequest } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await authService.register(formData);
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);
      navigate('/characters');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || t.register.errorGeneric;
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <div className="flex-row justify-space-between align-center mb-20">
        <h2>{t.register.title}</h2>
        <LanguageToggle />
      </div>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label-block">{t.register.username}:</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            minLength={3}
            className="auth-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label-block">{t.register.email}:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="auth-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label-block">{t.register.password}:</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
            className="auth-input"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {t.register.registerButton}
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            {t.register.loginLink}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
