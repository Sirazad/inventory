import React from 'react';
import { Inventory } from '../../types';
import { VisibleColumns } from './types';
import { formatInventoryDate } from '../../utils/dateFormatting';
import { TranslationKeys } from '../../i18n/translations';
import styles from './InventoryTable.module.css';

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
      <tr className={styles.row}>
        {visibleColumns.category && (
          <td className="table-cell" style={{ paddingLeft }}>
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
          <td className="table-cell" style={{ width: '50px', paddingLeft }}>
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
          <td className="table-cell" style={{ width: '50px' }}></td>
        )}
        {visibleColumns.item && (
          <td className={`table-cell ${isContainer(item) ? styles.boldCell : ''}`}>
            {item.item}
            {hasActiveFilters && item.containerId && (
              <div className={styles.containerHint}>
                📦 {t.inventory.inContainer} {getContainerName(allInventory, item.containerId)}
              </div>
            )}
          </td>
        )}
        {visibleColumns.quality && <td className="table-cell">{item.quality || '-'}</td>}
        {visibleColumns.description && <td className="table-cell">{item.description}</td>}
        {visibleColumns.price && (
          <td className="table-cell-right">
            {formatPrice(item)}
          </td>
        )}
        {visibleColumns.quantity && (
          <td className="table-cell-center">
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
          <td className="table-cell-right">
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
          <td className="table-cell">
            {formatInventoryDate(item.addedYear, item.addedDay, item.addedGodName, item.addedGodMonthNumber, item.addedSeason, t)}
          </td>
        )}
        {visibleColumns.modified && (
          <td className="table-cell">
            {formatInventoryDate(item.modifiedYear, item.modifiedDay, item.modifiedGodName, item.modifiedGodMonthNumber, item.modifiedSeason, t)}
          </td>
        )}
        {visibleColumns.notes && <td className="table-cell">{item.addedUpdated || '-'}</td>}
        {visibleColumns.actions && (
          <td className="table-cell-center">
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
            <tr key={`empty-${item.id}`} className={styles.row}>
              <td colSpan={getColspan(visibleColumns, hasActiveFilters)} className={`table-cell ${styles.emptyContainer}`}>
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
    <table className={styles.table}>
      <thead>
        <tr className={styles.theadRow}>
          {!visibleColumns.category && !hasActiveFilters && <th className="table-cell" style={{ width: '50px' }}></th>}
          {visibleColumns.category && <th className="table-cell">{t.inventory.category}</th>}
          {visibleColumns.item && <th className="table-cell">{t.inventory.item}</th>}
          {visibleColumns.quality && <th className="table-cell">{t.inventory.quality}</th>}
          {visibleColumns.description && <th className="table-cell">{t.inventory.description}</th>}
          {visibleColumns.price && <th className="table-cell-right">{t.inventory.price}</th>}
          {visibleColumns.quantity && <th className="table-cell-right">{t.inventory.quantity}</th>}
          {visibleColumns.weight && <th className="table-cell-right">{t.inventory.weightKg}</th>}
          {visibleColumns.added && <th className="table-cell">{t.inventory.added}</th>}
          {visibleColumns.modified && <th className="table-cell">{t.inventory.modified}</th>}
          {visibleColumns.notes && <th className="table-cell">{t.inventory.addedUpdated}</th>}
          {visibleColumns.actions && <th className="table-cell-center">{t.inventory.actions}</th>}
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
