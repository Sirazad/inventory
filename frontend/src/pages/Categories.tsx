import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryService } from '../services/api';
import { Category } from '../types';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await categoryService.updateCategory(editingId, formData);
        setEditingId(null);
      } else {
        await categoryService.createCategory(formData);
      }
      setFormData({ name: '' });
      setShowAddForm(false);
      loadCategories();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to save category';
      setError(errorMessage);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name });
    setEditingId(category.id);
    setShowAddForm(true);
    setError('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }
    try {
      await categoryService.deleteCategory(id);
      loadCategories();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete category';
      alert(errorMessage);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '50px auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/characters')} style={{ padding: '10px 20px' }}>
          Back to Characters
        </button>
      </div>

      <h2>Category Management</h2>

      {/* Add/Edit Form */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
            setFormData({ name: '' });
            setError('');
          }}
          style={{ padding: '10px 20px', backgroundColor: '#7AB8C0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {showAddForm ? 'Cancel' : 'Add New Category'}
        </button>
      </div>

      {showAddForm && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '2px solid #7AB8C0', backgroundColor: 'white' }}>
          <h3>{editingId ? 'Edit Category' : 'Add New Category'}</h3>
          {error && (
            <div style={{ color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffeeee' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div>
              <label>Category Name*:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            <div style={{ marginTop: '15px' }}>
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#7AB8C0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {editingId ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div>
        <h3>Categories</h3>
        {categories.length === 0 ? (
          <p>No categories found. Add some above!</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Created</th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>{category.name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                    {new Date(category.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(category)}
                      style={{ padding: '5px 10px', marginRight: '5px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      style={{ padding: '5px 10px', backgroundColor: '#7AB8C0', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Delete
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

export default Categories;
