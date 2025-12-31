import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryService, categoryService } from '../services/api';
import { Inventory, Category } from '../types';

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
        alert(`Cannot load inventory. Please check that you have permission to access this character.`);
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
        alert('Error: ' + err.response.data.error);
      } else if (err.response?.status === 400) {
        alert('Invalid request. Please check your input.');
      } else if (err.response?.status === 403) {
        alert('Access denied. Please log in again.');
      } else {
        alert('Failed to save inventory item');
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
    const removalText = prompt('Enter removal reason:');
    if (removalText !== null) {
      try {
        await inventoryService.removeInventory(Number(characterId), id, removalText);
        loadInventory();
      } catch (err) {
        alert('Failed to remove item');
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
      alert('Failed to update quantity');
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
        alert('Failed to load container contents. Please try again.');
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
    <div style={{ maxWidth: '1200px', margin: '50px auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/characters')} style={{ padding: '10px 20px' }}>
          Back to Characters
        </button>
      </div>

      <h2>Inventory Management</h2>

      {/* Filters */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #d0d0d0', backgroundColor: 'white' }}>
        <h3>Filters</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div>
            <label>Category: </label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{ padding: '5px' }}
            />
          </div>
          <div>
            <label>Min Price (copper): </label>
            <input
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              style={{ padding: '5px', width: '100px' }}
              placeholder="Total copper"
            />
          </div>
          <div>
            <label>Max Weight (kg): </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={filters.maxWeight}
              onChange={(e) => setFilters({ ...filters, maxWeight: e.target.value })}
              style={{ padding: '5px', width: '100px' }}
              placeholder="Per item"
            />
          </div>
          <button onClick={handleApplyFilters} style={{ padding: '5px 15px' }}>
            Apply Filters
          </button>
          <button
            onClick={() => {
              setFilters({ category: '', minPrice: '', maxWeight: '' });
            }}
            style={{ padding: '5px 15px' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div style={{ marginBottom: '20px' }}>
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
          {showAddForm ? 'Cancel' : 'Add New Item'}
        </button>
      </div>

      {showAddForm && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '2px solid #7AB8C0', backgroundColor: 'white' }}>
          <h3>{editingId ? 'Edit Item' : 'Add New Item'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label>Category*:</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                  Select "container" to make this item a bag/pouch that can hold other items
                </div>
              </div>
              <div>
                <label>Item*:</label>
                <input
                  type="text"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
              <div>
                <label>Quality:</label>
                <input
                  type="text"
                  value={formData.quality}
                  onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
              <div>
                <label>Quantity*:</label>
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
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label>Price:</label>
                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="Gold"
                    value={formData.gold}
                    onChange={(e) => setFormData({ ...formData, gold: e.target.value })}
                    style={{ width: '30%', padding: '8px' }}
                  />
                  <span style={{ alignSelf: 'center' }}>g</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Silver"
                    value={formData.silver}
                    onChange={(e) => setFormData({ ...formData, silver: e.target.value })}
                    style={{ width: '30%', padding: '8px' }}
                  />
                  <span style={{ alignSelf: 'center' }}>s</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Copper"
                    value={formData.copper}
                    onChange={(e) => setFormData({ ...formData, copper: e.target.value })}
                    style={{ width: '30%', padding: '8px' }}
                  />
                  <span style={{ alignSelf: 'center' }}>c</span>
                </div>
              </div>
              <div>
                <label>Weight (kg per item):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Kilograms"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
              <div>
                <label>Container (optional):</label>
                <select
                  value={formData.containerId}
                  onChange={(e) => setFormData({ ...formData, containerId: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                >
                  <option value="">No container</option>
                  {getAvailableContainers().map((container) => (
                    <option key={container.id} value={container.id}>
                      {container.item}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                  Put this item inside a bag/pouch (must have category "container")
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Description*:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Added/Updated Notes:</label>
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
                {editingId ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory List */}
      <div>
        <h3>Inventory Items</h3>
        {inventory.length === 0 ? (
          <p>No items in inventory. Add some above!</p>
        ) : inventory.filter(item => !item.containerId).length === 0 ? (
          <p>All items are inside containers. Expand a container above to see items.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
             <thead>
              <tr style={{ backgroundColor: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Category</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Item</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Quality</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Description</th>
                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ccc' }}>Price</th>
                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ccc' }}>Qty</th>
                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ccc' }}>Weight (kg)</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Added</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Modified</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Notes</th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>Actions</th>
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
                          title="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="quantity-value">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item, +1)}
                          className="btn-quantity"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                      {isContainer(item) && containerWeights.has(item.id) ? (
                        <strong>{containerWeights.get(item.id)?.toFixed(2)} kg (total)</strong>
                      ) : item.weight ? (
                        `${item.weight} kg`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                      {item.formattedAddedDate || '-'}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                      {item.formattedModifiedDate || '-'}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>{item.addedUpdated || '-'}</td>
                    <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                      <button
                        onClick={() => handleEdit(item)}
                        className="btn-small mr-5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="btn-delete"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                  {/* Show container contents when expanded */}
                  {isContainer(item) && expandedContainers.has(item.id) && (
                    <>
                      {containerContents.get(item.id)?.length === 0 && (
                        <tr key={`empty-${item.id}`} style={{ backgroundColor: 'white' }}>
                          <td colSpan={11} style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center', fontStyle: 'italic', color: '#999' }}>
                            This container is empty
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
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="quantity-value">
                            {containedItem.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(containedItem, +1)}
                            className="btn-quantity"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                        {containedItem.weight ? `${containedItem.weight} kg` : '-'}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                        {containedItem.formattedAddedDate || '-'}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                        {containedItem.formattedModifiedDate || '-'}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>{containedItem.addedUpdated || '-'}</td>
                      <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEdit(containedItem)}
                          className="btn-small mr-5"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemove(containedItem.id)}
                          className="btn-delete"
                        >
                          Remove
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
                              title="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="quantity-value">
                              {nestedItem.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(nestedItem, +1)}
                              className="btn-quantity"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                          {nestedItem.weight ? `${nestedItem.weight} kg` : '-'}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                          {nestedItem.formattedAddedDate || '-'}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ccc', fontSize: '0.9em' }}>
                          {nestedItem.formattedModifiedDate || '-'}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ccc' }}>{nestedItem.addedUpdated || '-'}</td>
                        <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                          <button
                            onClick={() => handleEdit(nestedItem)}
                            className="btn-small mr-5"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemove(nestedItem.id)}
                            className="btn-delete"
                          >
                            Remove
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
