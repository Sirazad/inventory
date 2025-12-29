import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div style={{ display: 'inline-block', marginLeft: '20px' }}>
      <label htmlFor="language-select" style={{ marginRight: '8px', color: '#333' }}>
        {t.common.language}:
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'en' | 'hu')}
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          backgroundColor: 'white',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        <option value="en">English</option>
        <option value="hu">Magyar</option>
      </select>
    </div>
  );
};

export default LanguageToggle;
