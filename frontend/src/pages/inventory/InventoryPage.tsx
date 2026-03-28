import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryService, categoryService, templateService } from '../../services/api';
import { Inventory, Category } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { getApiErrorMessage, isApiStatus } from '../../utils/errorUtils';
import { toCopperValue } from '../../utils/currencyUtils';
import { InventoryFormData, InventoryFiltersState, VisibleColumns, EMPTY_FORM_DATA, EMPTY_FILTERS, DEFAULT_VISIBLE_COLUMNS } from './types';
import InventoryFilters from './InventoryFilters';
import ColumnSettings from './ColumnSettings';
import InventoryForm from './InventoryForm';
import InventoryTable from './InventoryTable';
import CloneDialog from './CloneDialog';

const InventoryPage: React.FC = () => {
  const { characterId: rawCharacterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const characterId = Number(rawCharacterId);

  // Redirect if characterId is not a valid number
  useEffect(() => {
    if (isNaN(characterId)) {
      navigate('/characters', { replace: true });
    }
  }, [characterId, navigate]);

  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedContainers, setExpandedContainers] = useState<Set<number>>(new Set());
  const [containerContents, setContainerContents] = useState<Map<number, Inventory[]>>(new Map());
  const [containerWeights, setContainerWeights] = useState<Map<number, number>>(new Map());
  const [filters, setFilters] = useState<InventoryFiltersState>(EMPTY_FILTERS);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(DEFAULT_VISIBLE_COLUMNS);
  const [formData, setFormData] = useState<InventoryFormData>(EMPTY_FORM_DATA);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [itemToClone, setItemToClone] = useState<Inventory | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoryService.getCategories();
      const hasContainerCategory = data.some(cat => cat.name.toLowerCase() === 'container');
      if (!hasContainerCategory) {
        try {
          await categoryService.createCategory({ name: 'container' });
          const updatedData = await categoryService.getCategories();
          setCategories(updatedData);
        } catch {
          setCategories(data);
        }
      } else {
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  const loadInventory = useCallback(async () => {
    try {
      const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : undefined;
      const maxWeight = filters.maxWeight ? parseFloat(filters.maxWeight) : undefined;
      const data = await inventoryService.getInventory(
        characterId,
        filters.category || undefined,
        minPrice,
        maxWeight,
        filters.itemName || undefined,
      );
      setInventory(data);
    } catch (err: unknown) {
      console.error('Failed to load inventory', err);
      setInventory([]);
      if (isApiStatus(err, 403) || isApiStatus(err, 401)) {
        alert(t.inventory.cannotLoad);
      }
    }
  }, [characterId, filters, t]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Clear container state and reload when characterId changes
  useEffect(() => {
    setExpandedContainers(new Set());
    setContainerContents(new Map());
    setContainerWeights(new Map());
    loadInventory();
  }, [characterId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (filters.category === '' && filters.minPrice === '' && filters.maxWeight === '' && filters.itemName === '') {
      loadInventory();
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters = filters.category !== '' || filters.minPrice !== '' || filters.maxWeight !== '' || filters.itemName !== '';

  const isContainer = (item: Inventory) => {
    return item.isContainer === true || item.category.toLowerCase() === 'container';
  };

  const getAvailableContainers = () => {
    return inventory.filter(item => isContainer(item) && item.id !== editingId);
  };

  const handleSubmit = async (e: React.FormEvent, saveAsTemplate: boolean = false) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        gold: formData.gold ? parseInt(formData.gold) : undefined,
        silver: formData.silver ? parseInt(formData.silver) : undefined,
        copper: formData.copper ? parseInt(formData.copper) : undefined,
        quantity: parseInt(formData.quantity),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        containerId: formData.containerId ? parseInt(formData.containerId) : undefined,
      };

      if (editingId) {
        await inventoryService.updateInventory(characterId, editingId, data);
        setEditingId(null);
      } else {
        await inventoryService.createInventory(characterId, data);

        if (saveAsTemplate) {
          try {
            const gold = parseInt(formData.gold) || 0;
            const silver = parseInt(formData.silver) || 0;
            const copper = parseInt(formData.copper) || 0;
            const priceInCopper = toCopperValue(gold, silver, copper);
            const templateData = {
              name: formData.item,
              category: formData.category,
              item: formData.item,
              quality: formData.quality || undefined,
              description: formData.description,
              priceInCopper: priceInCopper > 0 ? priceInCopper : undefined,
              quantity: parseInt(formData.quantity),
              weight: formData.weight ? parseFloat(formData.weight) : undefined,
              isContainer: formData.category.toLowerCase() === 'container',
            };
            await templateService.createTemplate(templateData);
            alert('Item added to inventory and saved as template!');
          } catch (templateErr) {
            console.error('Failed to save as template', templateErr);
            alert('Item added to inventory, but failed to save as template');
          }
        }
      }

      setFormData(EMPTY_FORM_DATA);
      setShowAddForm(false);
      loadInventory();
    } catch (err: unknown) {
      if (isApiStatus(err, 400)) {
        alert(t.inventory.invalidRequest);
      } else if (isApiStatus(err, 403)) {
        alert(t.inventory.accessDenied);
      } else {
        alert(t.inventory.errorPrefix + getApiErrorMessage(err, t.inventory.failedSave));
      }
      console.error('Failed to save inventory item', err);
    }
  };

  const handleEdit = (item: Inventory) => {
    setFormData({
      category: item.category,
      item: item.item,
      quality: item.quality || '',
      description: item.description,
      gold: item.gold?.toString() || '',
      silver: item.silver?.toString() || '',
      copper: item.copper?.toString() || '',
      quantity: item.quantity.toString(),
      addedUpdated: item.addedUpdated || '',
      weight: item.weight?.toString() || '',
      containerId: item.containerId?.toString() || '',
    });
    setEditingId(item.id);
    setShowAddForm(true);
  };

  const handleRemove = async (id: number) => {
    const removalText = prompt(t.inventory.enterRemovalReason);
    if (removalText !== null) {
      try {
        await inventoryService.removeInventory(characterId, id, removalText);
        loadInventory();
      } catch {
        alert(t.inventory.failedRemove);
      }
    }
  };

  const handleClone = (item: Inventory) => {
    if (isContainer(item)) {
      setItemToClone(item);
      setShowCloneDialog(true);
    } else {
      performClone(item, false);
    }
  };

  const performClone = async (item: Inventory, includeContents: boolean) => {
    try {
      const result = await inventoryService.cloneInventory(characterId, item.id, includeContents);
      let message = `${t.inventory.cloneSuccess} ${item.item}`;
      if (result.clonedContainers && result.clonedContainers.length > 0) {
        const containerList = result.clonedContainers
          .map((c: { name: string; count: number }) => `${c.name} (${c.count})`)
          .join(', ');
        message += ` - ${t.inventory.cloneContains}: ${containerList}`;
      }
      alert(message);
      loadInventory();
    } catch {
      alert(t.inventory.cloneFailed);
    }
  };

  const handleCloneDialogResponse = (includeContents: boolean | null) => {
    if (includeContents !== null && itemToClone) {
      performClone(itemToClone, includeContents);
    }
    setShowCloneDialog(false);
    setItemToClone(null);
  };

  const handleQuantityChange = async (item: Inventory, delta: number) => {
    const newQuantity = Math.max(0, item.quantity + delta);
    if (newQuantity === item.quantity) return;

    let reason: string | undefined;
    if (delta < 0 && newQuantity === 0) {
      const input = prompt(t.inventory.enterRemovalReason);
      // If user cancels (null) or leaves blank, proceed with no reason — backend auto-generates
      reason = (input !== null && input.trim() !== '') ? input.trim() : undefined;
    }

    try {
      const updatedItem = await inventoryService.updateQuantity(characterId, item.id, delta, reason);
      setInventory(inventory.map(i => i.id === item.id ? updatedItem : i).filter(i => !i.removed));
    } catch {
      alert(t.inventory.failedUpdateQuantity);
    }
  };

  const toggleContainer = async (itemId: number) => {
    const newExpanded = new Set(expandedContainers);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
      setExpandedContainers(newExpanded);
    } else {
      newExpanded.add(itemId);
      setExpandedContainers(newExpanded);

      try {
        const contents = await inventoryService.getContainerContents(characterId, itemId);
        setContainerContents(prev => new Map(prev).set(itemId, contents));
      } catch (err) {
        console.error('Failed to load container contents', err);
        alert(t.inventory.failedLoadContainer);
      }

      try {
        const totalWeight = await inventoryService.getTotalWeight(characterId, itemId);
        setContainerWeights(prev => new Map(prev).set(itemId, totalWeight));
      } catch (err) {
        console.error('Failed to load total weight', err);
      }
    }
  };

  if (isNaN(characterId)) {
    return null;
  }

  return (
    <div className="page-container max-width-1200">
      <div className="mb-20">
        <button onClick={() => navigate('/characters')} className="btn-primary">
          {t.inventory.backToCharacters}
        </button>
      </div>

      <h2>{t.inventory.inventoryManagement}</h2>

      <InventoryFilters
        filters={filters}
        onFiltersChange={setFilters}
        onApply={loadInventory}
        onClear={() => setFilters(EMPTY_FILTERS)}
        onToggleColumnSettings={() => setShowColumnSettings(!showColumnSettings)}
        showColumnSettings={showColumnSettings}
        t={t}
      />

      {showColumnSettings && (
        <ColumnSettings
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
          t={t}
        />
      )}

      {/* Add/Edit Form Toggle */}
      <div className="mb-20">
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
            setFormData(EMPTY_FORM_DATA);
          }}
          className="btn-primary"
        >
          {showAddForm ? t.inventory.cancel : t.inventory.addNewItem}
        </button>
      </div>

      {showAddForm && (
        <InventoryForm
          formData={formData}
          onFormDataChange={setFormData}
          editingId={editingId}
          categories={categories}
          availableContainers={getAvailableContainers()}
          onSubmit={handleSubmit}
          onCancel={() => setShowAddForm(false)}
          characterId={characterId}
          onInventoryAdded={loadInventory}
          t={t}
        />
      )}

      {/* Inventory List */}
      <div>
        <h3>{t.inventory.inventoryItems}</h3>
        <InventoryTable
          inventory={inventory}
          visibleColumns={visibleColumns}
          expandedContainers={expandedContainers}
          containerContents={containerContents}
          containerWeights={containerWeights}
          hasActiveFilters={hasActiveFilters}
          onToggleContainer={toggleContainer}
          onEdit={handleEdit}
          onRemove={handleRemove}
          onClone={handleClone}
          onQuantityChange={handleQuantityChange}
          t={t}
        />
      </div>

      {/* Clone Confirmation Dialog */}
      {showCloneDialog && itemToClone && (
        <CloneDialog
          item={itemToClone}
          onResponse={handleCloneDialogResponse}
          t={t}
        />
      )}
    </div>
  );
};

export default InventoryPage;
