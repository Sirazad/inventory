import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryService } from '../services/api';
import { Category } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getApiErrorMessage } from '../utils/errorUtils';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { t } = useLanguage();

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
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t.categories.failedSave));
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name });
    setEditingId(category.id);
    setShowAddForm(true);
    setError('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t.categories.confirmDelete)) {
      return;
    }
    try {
      await categoryService.deleteCategory(id);
      loadCategories();
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, t.categories.failedDelete));
    }
  };

  return (
    <div className="page-container max-width-1000">
      <div className="mb-20">
        <button onClick={() => navigate('/characters')} className="btn-primary">
          {t.categories.backToCharacters}
        </button>
      </div>

      <h2>{t.categories.categoryManagement}</h2>

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
          {showAddForm ? t.categories.cancel : t.categories.addNewCategory}
        </button>
      </div>

      {showAddForm && (
        <div className="form-border mb-20">
          <h3>{editingId ? t.categories.editCategory : t.categories.addNewCategory}</h3>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label-block">{t.categories.categoryNameLabel}</label>
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
                {editingId ? t.categories.updateCategory : t.categories.addCategory}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div>
        <h3>{t.categories.title}</h3>
        {categories.length === 0 ? (
          <p>{t.categories.noCategories}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="table-cell">{t.categories.name}</th>
                <th className="table-cell">{t.categories.created}</th>
                <th className="table-cell-center">{t.categories.actions}</th>
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
                      {t.categories.edit}
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="btn-delete"
                    >
                      {t.categories.delete}
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
