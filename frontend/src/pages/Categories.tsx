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
    <div className="page-container max-width-1000">
      <div className="mb-20">
        <button onClick={() => navigate('/characters')} className="btn-primary">
          Back to Characters
        </button>
      </div>

      <h2>Category Management</h2>

      {/* Add/Edit Form */}
      <div className="mb-20">
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
            setFormData({ name: '' });
            setError('');
          }}
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : 'Add New Category'}
        </button>
      </div>

      {showAddForm && (
        <div className="form-border mb-20">
          <h3>{editingId ? 'Edit Category' : 'Add New Category'}</h3>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label-block">Category Name*:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                required
                className="form-input-full"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">
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
          <table className="data-table">
            <thead>
              <tr>
                <th className="table-cell">Name</th>
                <th className="table-cell">Created</th>
                <th className="table-cell-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="table-cell">{category.name}</td>
                  <td className="table-cell">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </td>
                  <td className="table-cell-center">
                    <button
                      onClick={() => handleEdit(category)}
                      className="btn-small mr-5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="btn-delete"
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
