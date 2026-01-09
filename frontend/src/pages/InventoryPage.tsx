import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryService, categoryService, templateService } from '../services/api';
import { Inventory, Category, ItemTemplate } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { formatInventoryDate } from '../utils/dateFormatting';

const InventoryPage: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<'custom' | 'template'>('custom'); // Tab mode
  const [saveAsTemplate, setSaveAsTemplate] = useState(false); // Save as template checkbox
  const [templateSearch, setTemplateSearch] = useState('');
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ItemTemplate | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedContainers, setExpandedContainers] = useState<Set<number>>(new Set());
  const [containerContents, setContainerContents] = useState<Map<number, Inventory[]>>(new Map());
  const [containerWeights, setContainerWeights] = useState<Map<number, number>>(new Map());
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxWeight: '',
    itemName: '',
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    category: true,
    item: true,
    quality: true,
    description: true,
    price: true,
    quantity: true,
    weight: true,
    added: true,
    modified: true,
    notes: true,
    actions: true,
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

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  useEffect(() => {
    if (filters.category === '' && filters.minPrice === '' && filters.maxWeight === '' && filters.itemName === '') {
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
        maxWeight,
        filters.itemName || undefined
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
        
        // Save as template if checkbox is checked
        if (saveAsTemplate && !editingId) {
          try {
            const gold = parseInt(formData.gold) || 0;
            const silver = parseInt(formData.silver) || 0;
            const copper = parseInt(formData.copper) || 0;
            const priceInCopper = gold * 10000 + silver * 100 + copper;

            const templateData = {
              name: formData.item, // Use item name as template name
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
      setSaveAsTemplate(false);
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

  const handleTemplateSearch = async () => {
    if (!templateSearch.trim()) {
      setTemplates([]);
      return;
    }
    
    try {
      const response = await templateService.searchTemplates(templateSearch, undefined, undefined, 0, 20, 'name', 'ASC');
      setTemplates(response.content);
    } catch (err) {
      console.error('Failed to search templates', err);
      alert('Failed to search templates');
    }
  };

  const handleSelectTemplate = async (template: ItemTemplate) => {
    try {
      const fullTemplate = await templateService.getTemplate(template.id);
      setSelectedTemplate(fullTemplate);
    } catch (err) {
      console.error('Failed to load template details', err);
      alert('Failed to load template details');
    }
  };

  const handleAddTemplateToInventory = async () => {
    if (!selectedTemplate) return;
    
    try {
      await templateService.addTemplateToInventory(Number(characterId), selectedTemplate.id);
      alert(`Template "${selectedTemplate.name}" added to inventory successfully!`);
      setSelectedTemplate(null);
      setTemplateSearch('');
      setTemplates([]);
      setShowAddForm(false);
      loadInventory();
    } catch (err: any) {
      console.error('Failed to add template to inventory', err);
      alert('Failed to add template to inventory: ' + (err.response?.data?.message || err.message));
    }
  };


  const isContainer = (item: Inventory) => {
    return item.category.toLowerCase() === 'container';
  };

  const hasActiveFilters = () => {
    return filters.category !== '' || filters.minPrice !== '' || filters.maxWeight !== '' || filters.itemName !== '';
  };

  const getContainerName = (containerId: number): string => {
    const container = inventory.find(item => item.id === containerId);
    return container ? container.item : 'Unknown Container';
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

  // Calculate colspan for container empty message based on visible columns
  const getColspan = () => {
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
    // Add 1 for the expand/collapse column when category is hidden
    if (!visibleColumns.category && !hasActiveFilters()) count++;
    return count;
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
            <label>{t.inventory.itemNameLabel} </label>
            <input
              type="text"
              value={filters.itemName}
              onChange={(e) => setFilters({ ...filters, itemName: e.target.value })}
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
              setFilters({ category: '', minPrice: '', maxWeight: '', itemName: '' });
            }}
            className="btn-small"
          >
            {t.inventory.clearFilters}
          </button>
          <button
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className="btn-small"
            style={{ marginLeft: 'auto' }}
          >
            {showColumnSettings ? '▼' : '▶'} {t.inventory.columnSettings}
          </button>
        </div>
        
        {/* Column Visibility Settings */}
        {showColumnSettings && (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            border: '1px solid #ccc', 
            backgroundColor: '#f9f9f9',
            borderRadius: '4px'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px' }}>{t.inventory.showColumns}</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
              gap: '10px' 
            }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={visibleColumns.category}
                  onChange={(e) => setVisibleColumns({ ...visibleColumns, category: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                {t.inventory.categoryColumn}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={visibleColumns.item}
                  onChange={(e) => setVisibleColumns({ ...visibleColumns, item: e.target.checked })}
                  style={{ marginRight: '8px' }}
                  disabled
                />
                {t.inventory.itemColumn} *
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={visibleColumns.quality}
                  onChange={(e) => setVisibleColumns({ ...visibleColumns, quality: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                {t.inventory.qualityColumn}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={visibleColumns.description}
                  onChange={(e) => setVisibleColumns({ ...visibleColumns, description: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                {t.inventory.descriptionColumn}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={visibleColumns.price}
                  onChange={(e) => setVisibleColumns({ ...visibleColumns, price: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                {t.inventory.priceColumn}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={visibleColumns.quantity}
                  onChange={(e) => setVisibleColumns({ ...visibleColumns, quantity: e.target.checked })}
                  style={{ marginRight: '8px' }}
                  disabled
                />
                {t.inventory.quantityColumn} *
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={visibleColumns.weight}
                  onChange={(e) => setVisibleColumns({ ...visibleColumns, weight: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                {t.inventory.weightColumn}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={visibleColumns.added}
                  onChange={(e) => setVisibleColumns({ ...visibleColumns, added: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                {t.inventory.addedColumn}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={visibleColumns.modified}
                  onChange={(e) => setVisibleColumns({ ...visibleColumns, modified: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                {t.inventory.modifiedColumn}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={visibleColumns.notes}
                  onChange={(e) => setVisibleColumns({ ...visibleColumns, notes: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                {t.inventory.notesColumn}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={visibleColumns.actions}
                  onChange={(e) => setVisibleColumns({ ...visibleColumns, actions: e.target.checked })}
                  style={{ marginRight: '8px' }}
                  disabled
                />
                {t.inventory.actionsColumn} *
              </label>
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.85em', color: '#666' }}>
              * Required columns cannot be hidden
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      <div className="mb-20">
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
            setAddMode('custom');
            setSaveAsTemplate(false);
            setSelectedTemplate(null);
            setTemplateSearch('');
            setTemplates([]);
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
          
          {/* Tabs for Custom vs Template (only show when adding new, not editing) */}
          {!editingId && (
            <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #ccc' }}>
              <button
                type="button"
                onClick={() => setAddMode('custom')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  backgroundColor: addMode === 'custom' ? '#7AB8C0' : 'transparent',
                  color: addMode === 'custom' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: addMode === 'custom' ? 'bold' : 'normal',
                }}
              >
                Custom Item
              </button>
              <button
                type="button"
                onClick={() => setAddMode('template')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  backgroundColor: addMode === 'template' ? '#7AB8C0' : 'transparent',
                  color: addMode === 'template' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: addMode === 'template' ? 'bold' : 'normal',
                }}
              >
                From Template
              </button>
            </div>
          )}

          {/* Template Selection Mode */}
          {addMode === 'template' && !editingId && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label>Search Templates</label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTemplateSearch();
                      }
                    }}
                    placeholder="Search by template name..."
                    style={{ flex: 1, padding: '8px' }}
                  />
                  <button type="button" onClick={handleTemplateSearch} className="btn-primary">
                    Search
                  </button>
                </div>
              </div>

              {/* Template Results */}
              {templates.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>Search Results</h4>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        style={{
                          padding: '10px',
                          marginBottom: '10px',
                          border: selectedTemplate?.id === template.id ? '2px solid #7AB8C0' : '1px solid #ddd',
                          backgroundColor: selectedTemplate?.id === template.id ? '#f0f8ff' : 'white',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 'bold' }}>{template.name}</div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                          {template.category} - {template.item}
                          {template.isContainer && ' (Container)'}
                        </div>
                        <div style={{ fontSize: '0.85em', color: '#888' }}>{template.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Template Preview */}
              {selectedTemplate && (
                <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #5cb85c', backgroundColor: '#f0fff0' }}>
                  <h4>Selected Template: {selectedTemplate.name}</h4>
                  <div><strong>Category:</strong> {selectedTemplate.category}</div>
                  <div><strong>Item:</strong> {selectedTemplate.item}</div>
                  {selectedTemplate.quality && <div><strong>Quality:</strong> {selectedTemplate.quality}</div>}
                  <div><strong>Description:</strong> {selectedTemplate.description}</div>
                  <div><strong>Quantity:</strong> {selectedTemplate.quantity}</div>
                  {selectedTemplate.weight && <div><strong>Weight:</strong> {selectedTemplate.weight} kg</div>}
                  {selectedTemplate.isContainer && selectedTemplate.contents && selectedTemplate.contents.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>Contains {selectedTemplate.contents.length} items:</strong>
                      <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                        {selectedTemplate.contents.map((content, idx) => (
                          <li key={idx}>
                            {content.item || 'Referenced Template'} (x{content.quantity || content.quantityOverride || 1})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleAddTemplateToInventory}
                    className="btn-primary"
                    style={{ marginTop: '15px', backgroundColor: '#5cb85c' }}
                  >
                    Add to Inventory
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Custom Item Form */}
          {addMode === 'custom' && (
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
            
            {/* Save as Template checkbox (only show when adding new item, not editing) */}
            {!editingId && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f8ff', border: '1px solid #7AB8C0' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  <strong>Save as Template</strong>
                </label>
                <div style={{ fontSize: '0.85em', color: '#666', marginTop: '5px', marginLeft: '24px' }}>
                  Also create a reusable template from this item for future use
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '15px' }}>
              <button type="submit" className="btn-primary">
                {editingId ? t.inventory.updateItem : t.inventory.addItem}
              </button>
            </div>
          </form>
          )}
        </div>
      )}

      {/* Inventory List */}
      <div>
        <h3>{t.inventory.inventoryItems}</h3>
        {inventory.length === 0 ? (
          <p>{t.inventory.noItems}</p>
        ) : (!hasActiveFilters() && inventory.filter(item => !item.containerId).length === 0) ? (
          <p>{t.inventory.allInContainers}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
             <thead>
              <tr style={{ backgroundColor: 'white' }}>
                {!visibleColumns.category && !hasActiveFilters() && <th style={{ padding: '10px', width: '50px', border: '1px solid #ccc' }}></th>}
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
              {(hasActiveFilters() ? inventory : inventory.filter(item => !item.containerId)).map((item) => (
                <React.Fragment key={item.id}>
                  <tr style={{ backgroundColor: 'white' }}>
                    {visibleColumns.category && (
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                        {isContainer(item) && !hasActiveFilters() && (
                          <button
                            onClick={() => toggleContainer(item.id)}
                            className="btn-tiny mr-5"
                          >
                            {expandedContainers.has(item.id) ? '▼' : '▶'}
                          </button>
                        )}
                        {item.category}
                      </td>
                    )}
                    {!visibleColumns.category && !hasActiveFilters() && (
                      <td style={{ padding: '10px', border: '1px solid #ccc', width: '50px' }}>
                        {isContainer(item) && (
                          <button
                            onClick={() => toggleContainer(item.id)}
                            className="btn-tiny"
                          >
                            {expandedContainers.has(item.id) ? '▼' : '▶'}
                          </button>
                        )}
                      </td>
                    )}
                    {visibleColumns.item && (
                      <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: isContainer(item) ? 'bold' : 'normal' }}>
                        {item.item}
                        {hasActiveFilters() && item.containerId && (
                          <div style={{ fontSize: '0.85em', color: '#666', fontStyle: 'italic', fontWeight: 'normal' }}>
                            📦 {t.inventory.inContainer} {getContainerName(item.containerId)}
                          </div>
                        )}
                      </td>
                    )}
                    {visibleColumns.quality && <td style={{ padding: '10px', border: '1px solid #ccc' }}>{item.quality || '-'}</td>}
                    {visibleColumns.description && <td style={{ padding: '10px', border: '1px solid #ccc' }}>{item.description}</td>}
                    {visibleColumns.price && (
                      <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                        {item.gold !== undefined || item.silver !== undefined || item.copper !== undefined
                          ? `${item.gold || 0}g ${item.silver || 0}s ${item.copper || 0}c`
                          : '-'}
                      </td>
                    )}
                    {visibleColumns.quantity && (
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
                    )}
                  </tr>
                  {/* Show container contents when expanded (only when no filters are active) */}
                  {!hasActiveFilters() && isContainer(item) && expandedContainers.has(item.id) && (
                    <>
                      {containerContents.get(item.id)?.length === 0 && (
                        <tr key={`empty-${item.id}`} style={{ backgroundColor: 'white' }}>
                          <td colSpan={getColspan()} style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center', fontStyle: 'italic', color: '#999' }}>
                            {t.inventory.containerEmpty}
                          </td>
                        </tr>
                      )}
                      {containerContents.get(item.id)?.map((containedItem) => (
                    <React.Fragment key={`contained-${containedItem.id}`}>
                      <tr style={{ backgroundColor: 'white' }}>
                        {visibleColumns.category && (
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
                        )}
                        {!visibleColumns.category && (
                          <td style={{ padding: '10px', border: '1px solid #ccc', paddingLeft: '40px', width: '50px' }}>
                            {isContainer(containedItem) && (
                              <button
                                onClick={() => toggleContainer(containedItem.id)}
                                className="btn-tiny"
                              >
                                {expandedContainers.has(containedItem.id) ? '▼' : '▶'}
                              </button>
                            )}
                          </td>
                        )}
                      {visibleColumns.item && <td style={{ padding: '10px', border: '1px solid #ccc' }}>{containedItem.item}</td>}
                      {visibleColumns.quality && <td style={{ padding: '10px', border: '1px solid #ccc' }}>{containedItem.quality || '-'}</td>}
                      {visibleColumns.description && <td style={{ padding: '10px', border: '1px solid #ccc' }}>{containedItem.description}</td>}
                      {visibleColumns.price && (
                        <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                          {containedItem.gold !== undefined || containedItem.silver !== undefined || containedItem.copper !== undefined
                            ? `${containedItem.gold || 0}g ${containedItem.silver || 0}s ${containedItem.copper || 0}c`
                            : '-'}
                        </td>
                      )}
                      {visibleColumns.quantity && (
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
                      )}
                      {visibleColumns.weight && (
                        <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                          {containedItem.weight ? `${containedItem.weight} ${t.inventory.kg}` : '-'}
                        </td>
                      )}
                      {visibleColumns.added && (
                        <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                          {formatInventoryDate(containedItem.addedYear, containedItem.addedDay, containedItem.addedGodName, containedItem.addedGodMonthNumber, containedItem.addedSeason, t)}
                        </td>
                      )}
                      {visibleColumns.modified && (
                        <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                          {formatInventoryDate(containedItem.modifiedYear, containedItem.modifiedDay, containedItem.modifiedGodName, containedItem.modifiedGodMonthNumber, containedItem.modifiedSeason, t)}
                        </td>
                      )}
                      {visibleColumns.notes && <td style={{ padding: '10px', border: '1px solid #ccc' }}>{containedItem.addedUpdated || '-'}</td>}
                      {visibleColumns.actions && (
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
                      )}
                    </tr>
                    {/* Show nested container contents when expanded */}
                    {isContainer(containedItem) && expandedContainers.has(containedItem.id) && containerContents.get(containedItem.id)?.map((nestedItem) => (
                      <tr key={`nested-${nestedItem.id}`} style={{ backgroundColor: 'white' }}>
                        {visibleColumns.category && (
                          <td style={{ padding: '10px', border: '1px solid #ccc', paddingLeft: '60px' }}>
                            ↳↳ {nestedItem.category}
                          </td>
                        )}
                        {!visibleColumns.category && (
                          <td style={{ padding: '10px', border: '1px solid #ccc', paddingLeft: '60px', width: '50px' }}>
                          </td>
                        )}
                        {visibleColumns.item && <td style={{ padding: '10px', border: '1px solid #ccc' }}>{nestedItem.item}</td>}
                        {visibleColumns.quality && <td style={{ padding: '10px', border: '1px solid #ccc' }}>{nestedItem.quality || '-'}</td>}
                        {visibleColumns.description && <td style={{ padding: '10px', border: '1px solid #ccc' }}>{nestedItem.description}</td>}
                        {visibleColumns.price && (
                          <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                            {nestedItem.gold !== undefined || nestedItem.silver !== undefined || nestedItem.copper !== undefined
                              ? `${nestedItem.gold || 0}g ${nestedItem.silver || 0}s ${nestedItem.copper || 0}c`
                              : '-'}
                          </td>
                        )}
                        {visibleColumns.quantity && (
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
                        )}
                        {visibleColumns.weight && (
                          <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                            {nestedItem.weight ? `${nestedItem.weight} ${t.inventory.kg}` : '-'}
                          </td>
                        )}
                        {visibleColumns.added && (
                          <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                            {formatInventoryDate(nestedItem.addedYear, nestedItem.addedDay, nestedItem.addedGodName, nestedItem.addedGodMonthNumber, nestedItem.addedSeason, t)}
                          </td>
                        )}
                        {visibleColumns.modified && (
                          <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                            {formatInventoryDate(nestedItem.modifiedYear, nestedItem.modifiedDay, nestedItem.modifiedGodName, nestedItem.modifiedGodMonthNumber, nestedItem.modifiedSeason, t)}
                          </td>
                        )}
                        {visibleColumns.notes && <td style={{ padding: '10px', border: '1px solid #ccc' }}>{nestedItem.addedUpdated || '-'}</td>}
                        {visibleColumns.actions && (
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
                        )}
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
