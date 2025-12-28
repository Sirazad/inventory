import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryService } from '../services/api';
import { Inventory } from '../types';

const InventoryPage: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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
    price: '',
    quantity: '1',
    addedUpdated: '',
    weight: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadInventory();
  }, [characterId]);

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
        price: formData.price ? parseFloat(formData.price) : undefined,
        quantity: parseInt(formData.quantity),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
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
        price: '',
        quantity: '1',
        addedUpdated: '',
        weight: '',
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
      price: item.price?.toString() || '',
      quantity: item.quantity.toString(),
      addedUpdated: item.addedUpdated || '',
      weight: item.weight?.toString() || '',
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
            <label>Min Price: </label>
            <input
              type="number"
              step="0.01"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              style={{ padding: '5px', width: '100px' }}
            />
          </div>
          <div>
            <label>Max Weight: </label>
            <input
              type="number"
              step="0.01"
              value={filters.maxWeight}
              onChange={(e) => setFilters({ ...filters, maxWeight: e.target.value })}
              style={{ padding: '5px', width: '100px' }}
            />
          </div>
          <button onClick={handleApplyFilters} style={{ padding: '5px 15px' }}>
            Apply Filters
          </button>
          <button
            onClick={() => {
              setFilters({ category: '', minPrice: '', maxWeight: '' });
              setTimeout(loadInventory, 100);
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
              price: '',
              quantity: '1',
              addedUpdated: '',
              weight: '',
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
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
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
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
              <div>
                <label>Price:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
              <div>
                <label>Weight:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
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
                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ccc' }}>Weight</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Notes</th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{item.category}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{item.item}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{item.quality || '-'}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{item.description}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                    {item.price ? `$${item.price.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>
                    {item.weight ? `${item.weight} lbs` : '-'}
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
