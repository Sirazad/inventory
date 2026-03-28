import React from 'react';
import { Inventory } from '../../types';
import { TranslationKeys } from '../../i18n/translations';
import styles from './CloneDialog.module.css';

interface Props {
  item: Inventory;
  onResponse: (includeContents: boolean | null) => void;
  t: TranslationKeys;
}

const CloneDialog: React.FC<Props> = ({ item, onResponse, t }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{t.inventory.cloneContainer}</h3>
        <p>{t.inventory.cloneContainerQuestion}</p>
        <div className={styles.buttonRow}>
          <button
            onClick={() => onResponse(true)}
            className={`btn-primary ${styles.btnSuccess}`}
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
