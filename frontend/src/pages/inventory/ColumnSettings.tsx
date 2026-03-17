import React from 'react';
import { VisibleColumns } from './types';
import { TranslationKeys } from '../../i18n/translations';

interface Props {
  visibleColumns: VisibleColumns;
  onVisibleColumnsChange: (columns: VisibleColumns) => void;
  t: TranslationKeys;
}

const ColumnSettings: React.FC<Props> = ({ visibleColumns, onVisibleColumnsChange, t }) => {
  const columns: { key: keyof VisibleColumns; label: string; disabled?: boolean }[] = [
    { key: 'category', label: t.inventory.categoryColumn },
    { key: 'item', label: t.inventory.itemColumn + ' *', disabled: true },
    { key: 'quality', label: t.inventory.qualityColumn },
    { key: 'description', label: t.inventory.descriptionColumn },
    { key: 'price', label: t.inventory.priceColumn },
    { key: 'quantity', label: t.inventory.quantityColumn + ' *', disabled: true },
    { key: 'weight', label: t.inventory.weightColumn },
    { key: 'added', label: t.inventory.addedColumn },
    { key: 'modified', label: t.inventory.modifiedColumn },
    { key: 'notes', label: t.inventory.notesColumn },
    { key: 'actions', label: t.inventory.actionsColumn + ' *', disabled: true },
  ];

  return (
    <div style={{
      marginTop: '15px',
      padding: '15px',
      border: '1px solid #ccc',
      backgroundColor: '#f9f9f9',
      borderRadius: '4px',
    }}>
      <h4 style={{ marginTop: 0, marginBottom: '10px' }}>{t.inventory.showColumns}</h4>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '10px',
      }}>
        {columns.map(({ key, label, disabled }) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={visibleColumns[key]}
              onChange={(e) => onVisibleColumnsChange({ ...visibleColumns, [key]: e.target.checked })}
              style={{ marginRight: '8px' }}
              disabled={disabled}
            />
            {label}
          </label>
        ))}
      </div>
      <div style={{ marginTop: '10px', fontSize: '0.85em', color: '#666' }}>
        * Required columns cannot be hidden
      </div>
    </div>
  );
};

export default ColumnSettings;
