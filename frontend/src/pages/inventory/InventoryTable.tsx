import React from 'react';
import { Inventory } from '../../types';
import { VisibleColumns } from './types';
import { formatInventoryDate } from '../../utils/dateFormatting';
import { TranslationKeys } from '../../i18n/translations';

interface Props {
  inventory: Inventory[];
  visibleColumns: VisibleColumns;
  expandedContainers: Set<number>;
  containerContents: Map<number, Inventory[]>;
  containerWeights: Map<number, number>;
  hasActiveFilters: boolean;
  onToggleContainer: (itemId: number) => void;
  onEdit: (item: Inventory) => void;
  onRemove: (id: number) => void;
  onClone: (item: Inventory) => void;
  onQuantityChange: (item: Inventory, delta: number) => void;
  t: TranslationKeys;
}

const isContainer = (item: Inventory) => {
  return item.isContainer === true || item.category.toLowerCase() === 'container';
};

const getContainerName = (inventory: Inventory[], containerId: number): string => {
  const container = inventory.find(item => item.id === containerId);
  return container ? container.item : 'Unknown Container';
};

const getColspan = (visibleColumns: VisibleColumns, hasActiveFilters: boolean): number => {
  let count = 0;
  if (visibleColumns.category) count++;
  if (visibleColumns.item) count++;
  if (visibleColumns.quality) count++;
  if (visibleColumns.description) count++;
  if (visibleColumns.price) count++;
  if (visibleColumns.quantity) count++;
  if (visibleColumns.weight) count++;
  if (visibleColumns.added) count++;
  if (visibleColumns.modified) count++;
  if (visibleColumns.notes) count++;
  if (visibleColumns.actions) count++;
  if (!visibleColumns.category && !hasActiveFilters) count++;
  return count;
};

const formatPrice = (item: Inventory) => {
  if (item.gold !== undefined || item.silver !== undefined || item.copper !== undefined) {
    return `${item.gold || 0}g ${item.silver || 0}s ${item.copper || 0}c`;
  }
  return '-';
};

interface ItemRowProps {
  item: Inventory;
  allInventory: Inventory[];
  visibleColumns: VisibleColumns;
  expandedContainers: Set<number>;
  containerContents: Map<number, Inventory[]>;
  containerWeights: Map<number, number>;
  hasActiveFilters: boolean;
  nestingLevel: number;
  onToggleContainer: (itemId: number) => void;
  onEdit: (item: Inventory) => void;
  onRemove: (id: number) => void;
  onClone: (item: Inventory) => void;
  onQuantityChange: (item: Inventory, delta: number) => void;
  t: TranslationKeys;
}

const ItemRow: React.FC<ItemRowProps> = ({
  item,
  allInventory,
  visibleColumns,
  expandedContainers,
  containerContents,
  containerWeights,
  hasActiveFilters,
  nestingLevel,
  onToggleContainer,
  onEdit,
  onRemove,
  onClone,
  onQuantityChange,
  t,
}) => {
  const paddingLeft = nestingLevel > 0 ? `${20 + nestingLevel * 20}px` : '10px';
  const nestPrefix = nestingLevel > 0 ? '↳'.repeat(nestingLevel) + ' ' : '';
  const isExpanded = expandedContainers.has(item.id);
  const contents = containerContents.get(item.id) || [];

  return (
    <React.Fragment>
      <tr style={{ backgroundColor: 'white' }}>
        {visibleColumns.category && (
          <td style={{ padding: '10px', border: '1px solid #ccc', paddingLeft }}>
            {isContainer(item) && !hasActiveFilters && (
              <button
                onClick={() => onToggleContainer(item.id)}
                className="btn-tiny mr-5"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            {nestPrefix}{item.category}
          </td>
        )}
        {!visibleColumns.category && isContainer(item) && !hasActiveFilters && (
          <td style={{ padding: '10px', border: '1px solid #ccc', width: '50px', paddingLeft }}>
            <button
              onClick={() => onToggleContainer(item.id)}
              className="btn-tiny"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          </td>
        )}
        {/* Spacer cell for non-containers when category is hidden and no filters */}
        {!visibleColumns.category && !isContainer(item) && !hasActiveFilters && nestingLevel === 0 && (
          <td style={{ padding: '10px', border: '1px solid #ccc', width: '50px' }}></td>
        )}
        {visibleColumns.item && (
          <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: isContainer(item) ? 'bold' : 'normal' }}>
            {item.item}
            {hasActiveFilters && item.containerId && (
              <div style={{ fontSize: '0.85em', color: '#666', fontStyle: 'italic', fontWeight: 'normal' }}>
                📦 {t.inventory.inContainer} {getContainerName(allInventory, item.containerId)}
              </div>
            )}
          </td>
        )}
        {visibleColumns.quality && <td style={{ padding: '10px', border: '1px solid #ccc' }}>{item.quality || '-'}</td>}
        {visibleColumns.description && <td style={{ padding: '10px', border: '1px solid #ccc' }}>{item.description}</td>}
        {visibleColumns.price && (
          <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
            {formatPrice(item)}
          </td>
        )}
        {visibleColumns.quantity && (
          <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
            <div className="quantity-controls">
              <button
                onClick={() => onQuantityChange(item, -1)}
                className="btn-quantity"
                title={t.inventory.decreaseQuantity}
              >
                −
              </button>
              <span className="quantity-value">
                {item.quantity}
              </span>
              <button
                onClick={() => onQuantityChange(item, +1)}
                className="btn-quantity"
                title={t.inventory.increaseQuantity}
              >
                +
              </button>
            </div>
          </td>
        )}
        {visibleColumns.weight && (
          <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
            {isContainer(item) && containerWeights.has(item.id) ? (
              <strong>{containerWeights.get(item.id)?.toFixed(2)} {t.inventory.kgTotal}</strong>
            ) : item.weight ? (
              `${item.weight} ${t.inventory.kg}`
            ) : (
              '-'
            )}
          </td>
        )}
        {visibleColumns.added && (
          <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
            {formatInventoryDate(item.addedYear, item.addedDay, item.addedGodName, item.addedGodMonthNumber, item.addedSeason, t)}
          </td>
        )}
        {visibleColumns.modified && (
          <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
            {formatInventoryDate(item.modifiedYear, item.modifiedDay, item.modifiedGodName, item.modifiedGodMonthNumber, item.modifiedSeason, t)}
          </td>
        )}
        {visibleColumns.notes && <td style={{ padding: '10px', border: '1px solid #ccc' }}>{item.addedUpdated || '-'}</td>}
        {visibleColumns.actions && (
          <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
            <button onClick={() => onClone(item)} className="btn-small mr-5">
              {t.inventory.clone}
            </button>
            <button onClick={() => onEdit(item)} className="btn-small mr-5">
              {t.inventory.edit}
            </button>
            <button onClick={() => onRemove(item.id)} className="btn-delete">
              {t.inventory.remove}
            </button>
          </td>
        )}
      </tr>

      {/* Show container contents when expanded (only when no filters are active) */}
      {!hasActiveFilters && isContainer(item) && isExpanded && (
        <>
          {contents.length === 0 && (
            <tr key={`empty-${item.id}`} style={{ backgroundColor: 'white' }}>
              <td colSpan={getColspan(visibleColumns, hasActiveFilters)} style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center', fontStyle: 'italic', color: '#999' }}>
                {t.inventory.containerEmpty}
              </td>
            </tr>
          )}
          {contents.map((containedItem) => (
            <ItemRow
              key={`contained-${containedItem.id}`}
              item={containedItem}
              allInventory={allInventory}
              visibleColumns={visibleColumns}
              expandedContainers={expandedContainers}
              containerContents={containerContents}
              containerWeights={containerWeights}
              hasActiveFilters={hasActiveFilters}
              nestingLevel={nestingLevel + 1}
              onToggleContainer={onToggleContainer}
              onEdit={onEdit}
              onRemove={onRemove}
              onClone={onClone}
              onQuantityChange={onQuantityChange}
              t={t}
            />
          ))}
        </>
      )}
    </React.Fragment>
  );
};

const InventoryTable: React.FC<Props> = ({
  inventory,
  visibleColumns,
  expandedContainers,
  containerContents,
  containerWeights,
  hasActiveFilters,
  onToggleContainer,
  onEdit,
  onRemove,
  onClone,
  onQuantityChange,
  t,
}) => {
  const displayItems = hasActiveFilters ? inventory : inventory.filter(item => !item.containerId);

  if (inventory.length === 0) {
    return <p>{t.inventory.noItems}</p>;
  }

  if (!hasActiveFilters && displayItems.length === 0) {
    return <p>{t.inventory.allInContainers}</p>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ backgroundColor: 'white' }}>
          {!visibleColumns.category && !hasActiveFilters && <th style={{ padding: '10px', width: '50px', border: '1px solid #ccc' }}></th>}
          {visibleColumns.category && <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.category}</th>}
          {visibleColumns.item && <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.item}</th>}
          {visibleColumns.quality && <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.quality}</th>}
          {visibleColumns.description && <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.description}</th>}
          {visibleColumns.price && <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ccc' }}>{t.inventory.price}</th>}
          {visibleColumns.quantity && <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ccc' }}>{t.inventory.quantity}</th>}
          {visibleColumns.weight && <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ccc' }}>{t.inventory.weightKg}</th>}
          {visibleColumns.added && <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.added}</th>}
          {visibleColumns.modified && <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.modified}</th>}
          {visibleColumns.notes && <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.addedUpdated}</th>}
          {visibleColumns.actions && <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>{t.inventory.actions}</th>}
        </tr>
      </thead>
      <tbody>
        {displayItems.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            allInventory={inventory}
            visibleColumns={visibleColumns}
            expandedContainers={expandedContainers}
            containerContents={containerContents}
            containerWeights={containerWeights}
            hasActiveFilters={hasActiveFilters}
            nestingLevel={0}
            onToggleContainer={onToggleContainer}
            onEdit={onEdit}
            onRemove={onRemove}
            onClone={onClone}
            onQuantityChange={onQuantityChange}
            t={t}
          />
        ))}
      </tbody>
    </table>
  );
};

export default InventoryTable;
