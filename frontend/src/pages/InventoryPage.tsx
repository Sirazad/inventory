import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryService, categoryService } from '../services/api';
import { Inventory, Category } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

const InventoryPage: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedContainers, setExpandedContainers] = useState<Set<number>>(new Set());
  const [containerContents, setContainerContents] = useState<Map<number, Inventory[]>>(new Map());
  const [containerWeights, setContainerWeights] = useState<Map<number, number>>(new Map());
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxWeight: '',
  });
  const [formData, setFormData] = useState({
    category: '',
    item: '',
    quality: '',
    description: '',
    gold: '',
    silver: '',
    copper: '',
    quantity: '1',
    addedUpdated: '',
    weight: '',
    containerId: '',
  });
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Pyarr calendar constants (same as in Characters.tsx)
  const DAYS_PER_MONTH = 20;
  const MONTHS_PER_YEAR = 31;
  const DAYS_PER_YEAR = MONTHS_PER_YEAR * DAYS_PER_MONTH; // 620 days total

  // Pyarr calendar months (31 months)
  const CALENDAR_MONTHS = [
    { number: 1, name: 'Szándék' }, { number: 2, name: 'Akarat' }, { number: 3, name: 'Harag' },
    { number: 4, name: 'Végítélet' }, { number: 5, name: 'Sikolyok' }, { number: 6, name: 'Csend' },
    { number: 7, name: 'Kacaj' }, { number: 8, name: 'Pengék' }, { number: 9, name: 'Csontok' },
    { number: 10, name: 'Hamvak' }, { number: 11, name: 'Lant' }, { number: 12, name: 'Álmok' },
    { number: 13, name: 'Ébredés' }, { number: 14, name: 'Áldozat' }, { number: 15, name: 'Engesztelés' },
    { number: 16, name: 'Lángok' }, { number: 17, name: 'Feloldozás' }, { number: 18, name: 'Ifjak' },
    { number: 19, name: 'Bölcsek' }, { number: 20, name: 'Beavatottak' }, { number: 21, name: 'Felemelkedők' },
    { number: 22, name: 'Fogadalmak' }, { number: 23, name: 'Esküvések' }, { number: 24, name: 'Fohászok' },
    { number: 25, name: 'Hullámok' }, { number: 26, name: 'Áradás' }, { number: 27, name: 'Tengercsend' },
    { number: 28, name: 'Zivatar' }, { number: 29, name: 'Kék Acél' }, { number: 30, name: 'Sólyomszárny' },
    { number: 31, name: 'Holdak és vándorok' }
  ];

  // Map for efficient month lookup by number
  const MONTHS_MAP = new Map(CALENDAR_MONTHS.map(m => [m.number, m]));

  // Helper function to calculate month and day from day-of-year
  const calculateMonthAndDay = (dayOfYear?: number) => {
    // Default to day 1 if invalid
    const day = (dayOfYear && dayOfYear >= 1 && dayOfYear <= DAYS_PER_YEAR) ? dayOfYear : 1;
    const monthNumber = Math.floor((day - 1) / DAYS_PER_MONTH) + 1;
    const dayInMonth = ((day - 1) % DAYS_PER_MONTH) + 1;
    return { monthNumber, dayInMonth };
  };

  // Helper function to format inventory date with month name and god info
  const formatInventoryDate = (year?: number, day?: number, godName?: string, godMonthNumber?: number, season?: string): string => {
    // Check for null/undefined
    if (year == null || day == null) {
      return '-';
    }
    
    // Validate currentDay is within valid range (1-620)
    if (day < 1 || day > DAYS_PER_YEAR) {
      return '-';
    }
    
    // Calculate month and day
    const { monthNumber, dayInMonth } = calculateMonthAndDay(day);
    const month = MONTHS_MAP.get(monthNumber);
    
    // If month lookup fails, return dash
    if (!month) {
      return '-';
    }
    
    // Base format: "3692, Csend 12"
    let formattedDate = `${year}, ${month.name} ${dayInMonth}`;
    
    // Add god info if available from backend
    if (godName && godMonthNumber != null && season) {
      const ordinal = (t.calendar.ordinals as any)[godMonthNumber] || godMonthNumber.toString();
      const translatedSeason = (t.calendar.seasons as any)[season] || season;
      
      // Replace placeholders in date format pattern
      const godInfo = t.calendar.dateFormat
        .replace('{god}', godName)
        .replace('{ordinal}', ordinal)
        .replace('{season}', translatedSeason);
      
      formattedDate += ` (${godInfo})`;
    }
    
    return formattedDate;
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  useEffect(() => {
    if (filters.category === '' && filters.minPrice === '' && filters.maxWeight === '') {
      loadInventory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      
      // Auto-create "container" category if it doesn't exist
      const hasContainerCategory = data.some(cat => cat.name.toLowerCase() === 'container');
      if (!hasContainerCategory) {
        try {
          await categoryService.createCategory({ name: 'container' });
          // Reload categories to include the new one
          const updatedData = await categoryService.getCategories();
          setCategories(updatedData);
        } catch (createErr) {
          // If creation fails (e.g., already exists due to race condition), just use existing data
          setCategories(data);
        }
      } else {
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadInventory = async () => {
    try {
      const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : undefined;
      const maxWeight = filters.maxWeight ? parseFloat(filters.maxWeight) : undefined;
      const data = await inventoryService.getInventory(
        Number(characterId),
        filters.category || undefined,
        minPrice,
        maxWeight
      );
      setInventory(data);
    } catch (err: any) {
      console.error('Failed to load inventory', err);
      setInventory([]);
      
      if (err.response?.status === 403 || err.response?.status === 401) {
        alert(t.inventory.cannotLoad);
      }
    }
  };

  const handleApplyFilters = () => {
    loadInventory();
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        await inventoryService.updateInventory(Number(characterId), editingId, data);
        setEditingId(null);
      } else {
        await inventoryService.createInventory(Number(characterId), data);
      }

      setFormData({
        category: '',
        item: '',
        quality: '',
        description: '',
        gold: '',
        silver: '',
        copper: '',
        quantity: '1',
        addedUpdated: '',
        weight: '',
        containerId: '',
      });
      setShowAddForm(false);
      loadInventory();
    } catch (err: any) {
      // Display better error messages
      if (err.response?.data?.error) {
        alert(t.inventory.errorPrefix + err.response.data.error);
      } else if (err.response?.status === 400) {
        alert(t.inventory.invalidRequest);
      } else if (err.response?.status === 403) {
        alert(t.inventory.accessDenied);
      } else {
        alert(t.inventory.failedSave);
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
        await inventoryService.removeInventory(Number(characterId), id, removalText);
        loadInventory();
      } catch (err) {
        alert(t.inventory.failedRemove);
      }
    }
  };

  const handleQuantityChange = async (item: Inventory, delta: number) => {
    const newQuantity = Math.max(1, item.quantity + delta);
    if (newQuantity === item.quantity) return; // No change
    
    try {
      const updatedItem = await inventoryService.updateQuantity(
        Number(characterId),
        item.id,
        delta
      );
      // Update the item in state with the returned data
      setInventory(inventory.map(i => i.id === item.id ? updatedItem : i).filter(i => !i.removed));
    } catch (err) {
      alert(t.inventory.failedUpdateQuantity);
    }
  };

  const isContainer = (item: Inventory) => {
    return item.category.toLowerCase() === 'container';
  };

  const toggleContainer = async (itemId: number) => {
    const newExpanded = new Set(expandedContainers);
    
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
      setExpandedContainers(newExpanded);
    } else {
      newExpanded.add(itemId);
      setExpandedContainers(newExpanded);
      
      // Always reload container contents when expanding to get fresh data
      try {
        const contents = await inventoryService.getContainerContents(Number(characterId), itemId);
        console.log('Loaded container contents:', contents);
        setContainerContents(prev => new Map(prev).set(itemId, contents));
      } catch (err) {
        console.error('Failed to load container contents', err);
        alert(t.inventory.failedLoadContainer);
      }
      
      // Load total weight
      try {
        const totalWeight = await inventoryService.getTotalWeight(Number(characterId), itemId);
        setContainerWeights(prev => new Map(prev).set(itemId, totalWeight));
      } catch (err) {
        console.error('Failed to load total weight', err);
      }
    }
  };

  // Get available containers (items with category "container" that are not the current editing item)
  const getAvailableContainers = () => {
    return inventory.filter(item => 
      isContainer(item) && item.id !== editingId
    );
  };

  return (
    <div className="page-container max-width-1200">
      <div className="mb-20">
        <button onClick={() => navigate('/characters')} className="btn-primary">
          {t.inventory.backToCharacters}
        </button>
      </div>

      <h2>{t.inventory.inventoryManagement}</h2>

      {/* Filters */}
      <div className="filter-container mb-20">
        <h3>{t.inventory.filters}</h3>
        <div className="flex-row flex-gap-10" style={{ flexWrap: 'wrap' }}>
          <div>
            <label>{t.inventory.categoryLabel} </label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="form-input-small"
            />
          </div>
          <div>
            <label>{t.inventory.minPriceLabel} </label>
            <input
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
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
              onChange={(e) => setFilters({ ...filters, maxWeight: e.target.value })}
              className="form-input-small"
              placeholder={t.inventory.perItemPlaceholder}
            />
          </div>
          <button onClick={handleApplyFilters} className="btn-small">
            {t.inventory.applyFilters}
          </button>
          <button
            onClick={() => {
              setFilters({ category: '', minPrice: '', maxWeight: '' });
            }}
            className="btn-small"
          >
            {t.inventory.clearFilters}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="mb-20">
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
            setFormData({
              category: '',
              item: '',
              quality: '',
              description: '',
              gold: '',
              silver: '',
              copper: '',
              quantity: '1',
              addedUpdated: '',
              weight: '',
              containerId: '',
            });
          }}
          className="btn-primary"
        >
          {showAddForm ? t.inventory.cancel : t.inventory.addNewItem}
        </button>
      </div>

      {showAddForm && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '2px solid #7AB8C0', backgroundColor: 'white' }}>
          <h3>{editingId ? t.inventory.editItem : t.inventory.addNewItem}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label>{t.inventory.categoryRequired}</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                >
                  <option value="">{t.inventory.selectCategory}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                  {t.inventory.containerHelp}
                </div>
              </div>
              <div>
                <label>{t.inventory.itemRequired}</label>
                <input
                  type="text"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
              <div>
                <label>{t.inventory.qualityLabel}</label>
                <input
                  type="text"
                  value={formData.quality}
                  onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
              <div>
                <label>{t.inventory.quantityRequired}</label>
                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const newQty = Math.max(1, parseInt(formData.quantity || '1') - 1);
                      setFormData({ ...formData, quantity: newQty.toString() });
                    }}
                    className="btn-form-quantity"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    style={{ flex: 1, padding: '8px', textAlign: 'center' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newQty = parseInt(formData.quantity || '1') + 1;
                      setFormData({ ...formData, quantity: newQty.toString() });
                    }}
                    className="btn-form-quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label>{t.inventory.priceLabel}</label>
                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder={t.inventory.gold}
                    value={formData.gold}
                    onChange={(e) => setFormData({ ...formData, gold: e.target.value })}
                    style={{ width: '30%', padding: '8px' }}
                  />
                  <span style={{ alignSelf: 'center' }}>g</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={t.inventory.silver}
                    value={formData.silver}
                    onChange={(e) => setFormData({ ...formData, silver: e.target.value })}
                    style={{ width: '30%', padding: '8px' }}
                  />
                  <span style={{ alignSelf: 'center' }}>s</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={t.inventory.copper}
                    value={formData.copper}
                    onChange={(e) => setFormData({ ...formData, copper: e.target.value })}
                    style={{ width: '30%', padding: '8px' }}
                  />
                  <span style={{ alignSelf: 'center' }}>c</span>
                </div>
              </div>
              <div>
                <label>{t.inventory.weightLabel}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={t.inventory.kilograms}
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
              <div>
                <label>{t.inventory.containerOptional}</label>
                <select
                  value={formData.containerId}
                  onChange={(e) => setFormData({ ...formData, containerId: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                >
                  <option value="">{t.inventory.noContainer}</option>
                  {getAvailableContainers().map((container) => (
                    <option key={container.id} value={container.id}>
                      {container.item}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                  {t.inventory.containerItemHelp}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>{t.inventory.descriptionRequired}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>{t.inventory.notesLabel}</label>
                <input
                  type="text"
                  value={formData.addedUpdated}
                  onChange={(e) => setFormData({ ...formData, addedUpdated: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
            </div>
            <div style={{ marginTop: '15px' }}>
              <button type="submit" className="btn-primary">
                {editingId ? t.inventory.updateItem : t.inventory.addItem}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory List */}
      <div>
        <h3>{t.inventory.inventoryItems}</h3>
        {inventory.length === 0 ? (
          <p>{t.inventory.noItems}</p>
        ) : inventory.filter(item => !item.containerId).length === 0 ? (
          <p>{t.inventory.allInContainers}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
             <thead>
              <tr style={{ backgroundColor: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.category}</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.item}</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.quality}</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.description}</th>
                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ccc' }}>{t.inventory.price}</th>
                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ccc' }}>{t.inventory.quantity}</th>
                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ccc' }}>{t.inventory.weightKg}</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.added}</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.modified}</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>{t.inventory.addedUpdated}</th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>{t.inventory.actions}</th>
              </tr>
            </thead>
            <tbody>
              {inventory.filter(item => !item.containerId).map((item) => (
                <React.Fragment key={item.id}>
                  <tr style={{ backgroundColor: 'white' }}>
                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                      {isContainer(item) && (
                        <button
                          onClick={() => toggleContainer(item.id)}
                          className="btn-tiny mr-5"
                        >
                          {expandedContainers.has(item.id) ? '▼' : '▶'}
                        </button>
                      )}
                      {item.category}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: isContainer(item) ? 'bold' : 'normal' }}>
                      {item.item}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>{item.quality || '-'}</td>
                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>{item.description}</td>
                    <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                      {item.gold !== undefined || item.silver !== undefined || item.copper !== undefined
                        ? `${item.gold || 0}g ${item.silver || 0}s ${item.copper || 0}c`
                        : '-'}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                      <div className="quantity-controls">
                        <button
                          onClick={() => handleQuantityChange(item, -1)}
                          className="btn-quantity"
                          title={t.inventory.decreaseQuantity}
                        >
                          −
                        </button>
                        <span className="quantity-value">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item, +1)}
                          className="btn-quantity"
                          title={t.inventory.increaseQuantity}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                      {isContainer(item) && containerWeights.has(item.id) ? (
                        <strong>{containerWeights.get(item.id)?.toFixed(2)} {t.inventory.kgTotal}</strong>
                      ) : item.weight ? (
                        `${item.weight} ${t.inventory.kg}`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                      {formatInventoryDate(item.addedYear, item.addedDay, item.addedGodName, item.addedGodMonthNumber, item.addedSeason)}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                      {formatInventoryDate(item.modifiedYear, item.modifiedDay, item.modifiedGodName, item.modifiedGodMonthNumber, item.modifiedSeason)}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>{item.addedUpdated || '-'}</td>
                    <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                      <button
                        onClick={() => handleEdit(item)}
                        className="btn-small mr-5"
                      >
                        {t.inventory.edit}
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="btn-delete"
                      >
                        {t.inventory.remove}
                      </button>
                    </td>
                  </tr>
                  {/* Show container contents when expanded */}
                  {isContainer(item) && expandedContainers.has(item.id) && (
                    <>
                      {containerContents.get(item.id)?.length === 0 && (
                        <tr key={`empty-${item.id}`} style={{ backgroundColor: 'white' }}>
                          <td colSpan={11} style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center', fontStyle: 'italic', color: '#999' }}>
                            {t.inventory.containerEmpty}
                          </td>
                        </tr>
                      )}
                      {containerContents.get(item.id)?.map((containedItem) => (
                    <React.Fragment key={`contained-${containedItem.id}`}>
                      <tr style={{ backgroundColor: 'white' }}>
                        <td style={{ padding: '10px', border: '1px solid #ccc', paddingLeft: '40px' }}>
                          {isContainer(containedItem) && (
                            <button
                              onClick={() => toggleContainer(containedItem.id)}
                              className="btn-tiny mr-5"
                            >
                              {expandedContainers.has(containedItem.id) ? '▼' : '▶'}
                            </button>
                          )}
                          ↳ {containedItem.category}
                        </td>
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>{containedItem.item}</td>
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>{containedItem.quality || '-'}</td>
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>{containedItem.description}</td>
                      <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                        {containedItem.gold !== undefined || containedItem.silver !== undefined || containedItem.copper !== undefined
                          ? `${containedItem.gold || 0}g ${containedItem.silver || 0}s ${containedItem.copper || 0}c`
                          : '-'}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                        <div className="quantity-controls">
                          <button
                            onClick={() => handleQuantityChange(containedItem, -1)}
                            className="btn-quantity"
                            title={t.inventory.decreaseQuantity}
                          >
                            −
                          </button>
                          <span className="quantity-value">
                            {containedItem.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(containedItem, +1)}
                            className="btn-quantity"
                            title={t.inventory.increaseQuantity}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                        {containedItem.weight ? `${containedItem.weight} ${t.inventory.kg}` : '-'}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                        {formatInventoryDate(containedItem.addedYear, containedItem.addedDay, containedItem.addedGodName, containedItem.addedGodMonthNumber, containedItem.addedSeason)}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                        {formatInventoryDate(containedItem.modifiedYear, containedItem.modifiedDay, containedItem.modifiedGodName, containedItem.modifiedGodMonthNumber, containedItem.modifiedSeason)}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>{containedItem.addedUpdated || '-'}</td>
                      <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEdit(containedItem)}
                          className="btn-small mr-5"
                        >
                          {t.inventory.edit}
                        </button>
                        <button
                          onClick={() => handleRemove(containedItem.id)}
                          className="btn-delete"
                        >
                          {t.inventory.remove}
                        </button>
                      </td>
                    </tr>
                    {/* Show nested container contents when expanded */}
                    {isContainer(containedItem) && expandedContainers.has(containedItem.id) && containerContents.get(containedItem.id)?.map((nestedItem) => (
                      <tr key={`nested-${nestedItem.id}`} style={{ backgroundColor: 'white' }}>
                        <td style={{ padding: '10px', border: '1px solid #ccc', paddingLeft: '60px' }}>
                          ↳↳ {nestedItem.category}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ccc' }}>{nestedItem.item}</td>
                        <td style={{ padding: '10px', border: '1px solid #ccc' }}>{nestedItem.quality || '-'}</td>
                        <td style={{ padding: '10px', border: '1px solid #ccc' }}>{nestedItem.description}</td>
                        <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                          {nestedItem.gold !== undefined || nestedItem.silver !== undefined || nestedItem.copper !== undefined
                            ? `${nestedItem.gold || 0}g ${nestedItem.silver || 0}s ${nestedItem.copper || 0}c`
                            : '-'}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                          <div className="quantity-controls">
                            <button
                              onClick={() => handleQuantityChange(nestedItem, -1)}
                              className="btn-quantity"
                              title={t.inventory.decreaseQuantity}
                            >
                              −
                            </button>
                            <span className="quantity-value">
                              {nestedItem.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(nestedItem, +1)}
                              className="btn-quantity"
                              title={t.inventory.increaseQuantity}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                          {nestedItem.weight ? `${nestedItem.weight} ${t.inventory.kg}` : '-'}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                          {formatInventoryDate(nestedItem.addedYear, nestedItem.addedDay, nestedItem.addedGodName, nestedItem.addedGodMonthNumber, nestedItem.addedSeason)}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                          {formatInventoryDate(nestedItem.modifiedYear, nestedItem.modifiedDay, nestedItem.modifiedGodName, nestedItem.modifiedGodMonthNumber, nestedItem.modifiedSeason)}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ccc' }}>{nestedItem.addedUpdated || '-'}</td>
                        <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                          <button
                            onClick={() => handleEdit(nestedItem)}
                            className="btn-small mr-5"
                          >
                            {t.inventory.edit}
                          </button>
                          <button
                            onClick={() => handleRemove(nestedItem.id)}
                            className="btn-delete"
                          >
                            {t.inventory.remove}
                          </button>
                        </td>
                      </tr>
                    ))}
                    </React.Fragment>
                  ))}
                    </>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
