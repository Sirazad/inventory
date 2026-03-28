import React from 'react';
import { InventoryFiltersState } from './types';
import { TranslationKeys } from '../../i18n/translations';

interface Props {
  filters: InventoryFiltersState;
  onFiltersChange: (filters: InventoryFiltersState) => void;
  onApply: () => void;
  onClear: () => void;
  onToggleColumnSettings: () => void;
  showColumnSettings: boolean;
  t: TranslationKeys;
}

const InventoryFilters: React.FC<Props> = ({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  onToggleColumnSettings,
  showColumnSettings,
  t,
}) => {
  return (
    <div className="filter-container mb-20">
      <h3>{t.inventory.filters}</h3>
      <div className="flex-row flex-gap-10" style={{ flexWrap: 'wrap' }}>
        <div>
          <label>{t.inventory.categoryLabel} </label>
          <input
            type="text"
            value={filters.category}
            onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
            className="form-input-small"
          />
        </div>
        <div>
          <label>{t.inventory.itemNameLabel} </label>
          <input
            type="text"
            value={filters.itemName}
            onChange={(e) => onFiltersChange({ ...filters, itemName: e.target.value })}
            className="form-input-small"
            placeholder={t.inventory.itemNamePlaceholder}
          />
        </div>
        <div>
          <label>{t.inventory.minPriceLabel} </label>
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(e) => onFiltersChange({ ...filters, minPrice: e.target.value })}
            className="form-input-small"
            placeholder={t.inventory.totalCopperPlaceholder}
          />
        </div>
        <div>
          <label>{t.inventory.maxWeightLabel} </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={filters.maxWeight}
            onChange={(e) => onFiltersChange({ ...filters, maxWeight: e.target.value })}
            className="form-input-small"
            placeholder={t.inventory.perItemPlaceholder}
          />
        </div>
        <button onClick={onApply} className="btn-small">
          {t.inventory.applyFilters}
        </button>
        <button onClick={onClear} className="btn-small">
          {t.inventory.clearFilters}
        </button>
        <button
          onClick={onToggleColumnSettings}
          className="btn-small"
          style={{ marginLeft: 'auto' }}
        >
          {showColumnSettings ? '▼' : '▶'} {t.inventory.columnSettings}
        </button>
      </div>
    </div>
  );
};

export default InventoryFilters;
