import React from 'react';
import { Inventory } from '../../types';
import { TranslationKeys } from '../../i18n/translations';

interface Props {
  item: Inventory;
  onResponse: (includeContents: boolean | null) => void;
  t: TranslationKeys;
}

const CloneDialog: React.FC<Props> = ({ item, onResponse, t }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '500px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <h3 style={{ marginTop: 0 }}>{t.inventory.cloneContainer}</h3>
        <p>{t.inventory.cloneContainerQuestion}</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onResponse(true)}
            className="btn-primary"
            style={{ backgroundColor: '#5cb85c' }}
          >
            {t.inventory.cloneWithContents}
          </button>
          <button
            onClick={() => onResponse(false)}
            className="btn-primary"
          >
            {t.inventory.cloneEmpty}
          </button>
          <button
            onClick={() => onResponse(null)}
            className="btn-small"
          >
            {t.inventory.cloneCancel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloneDialog;
