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
      setCategories(data);
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
    } catch (err) {
      console.error('Failed to load inventory', err);
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
    } catch (err) {
      alert('Failed to save inventory item');
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
      
      // Load container contents if not already loaded
      if (!containerContents.has(itemId)) {
        try {
          const contents = await inventoryService.getContainerContents(Number(characterId), itemId);
          setContainerContents(new Map(containerContents).set(itemId, contents));
        } catch (err) {
          console.error('Failed to load container contents', err);
        }
      }
      
      // Load total weight
      try {
        const totalWeight = await inventoryService.getTotalWeight(itemId);
        setContainerWeights(new Map(containerWeights).set(itemId, totalWeight));
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
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
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
          style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white' }}
        >
          {showAddForm ? 'Cancel' : 'Add New Item'}
        </button>
      </div>

      {showAddForm && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '2px solid #28a745', backgroundColor: '#f0fff0' }}>
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
                    style={{ 
                      padding: '8px 15px', 
                      backgroundColor: '#dc3545', 
                      color: 'white', 
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
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
                    style={{ 
                      padding: '8px 15px', 
                      backgroundColor: '#28a745', 
                      color: 'white', 
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
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
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white' }}>
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
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
             <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
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
                  <tr style={{ backgroundColor: isContainer(item) ? '#e8f5e9' : 'white' }}>
                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                      {isContainer(item) && (
                        <button
                          onClick={() => toggleContainer(item.id)}
                          style={{
                            marginRight: '5px',
                            padding: '2px 8px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
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
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleQuantityChange(item, -1)}
                          style={{ 
                            padding: '4px 10px', 
                            backgroundColor: '#dc3545', 
                            color: 'white', 
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            borderRadius: '3px'
                          }}
                          title="Decrease quantity"
                        >
                          −
                        </button>
                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 'bold' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item, +1)}
                          style={{ 
                            padding: '4px 10px', 
                            backgroundColor: '#28a745', 
                            color: 'white', 
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            borderRadius: '3px'
                          }}
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
                        style={{ padding: '5px 10px', marginRight: '5px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white' }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                  {/* Show container contents when expanded */}
                  {isContainer(item) && expandedContainers.has(item.id) && containerContents.get(item.id)?.map((containedItem) => (
                    <tr key={`contained-${containedItem.id}`} style={{ backgroundColor: '#f5f5f5' }}>
                      <td style={{ padding: '10px', border: '1px solid #ccc', paddingLeft: '40px' }}>
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
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleQuantityChange(containedItem, -1)}
                            style={{ 
                              padding: '4px 10px', 
                              backgroundColor: '#dc3545', 
                              color: 'white', 
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              borderRadius: '3px'
                            }}
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 'bold' }}>
                            {containedItem.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(containedItem, +1)}
                            style={{ 
                              padding: '4px 10px', 
                              backgroundColor: '#28a745', 
                              color: 'white', 
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              borderRadius: '3px'
                            }}
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
                          style={{ padding: '5px 10px', marginRight: '5px' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemove(containedItem.id)}
                          style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
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
