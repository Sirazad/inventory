import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateService } from '../services/api';
import { ItemTemplate, Page } from '../types';
import { getGold, getSilver, getCopper } from '../utils/currencyUtils';
import { useLanguage } from '../i18n/LanguageContext';

const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [templates, setTemplates] = useState<Page<ItemTemplate> | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
  
  const [filters, setFilters] = useState({
    name: '',
    isContainer: undefined as boolean | undefined,
    category: ''
  });

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sortBy, sortDir]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await templateService.searchTemplates(
        filters.name || undefined,
        filters.isContainer,
        filters.category || undefined,
        page,
        size,
        sortBy,
        sortDir
      );
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates', err);
      alert(t.templates.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0); // Reset to first page when searching
    loadTemplates();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(t.templates.confirmDelete)) {
      return;
    }

    try {
      await templateService.deleteTemplate(id);
      alert(t.templates.deleteSuccess);
      loadTemplates();
    } catch (err: any) {
      if (err.response?.data?.error) {
        alert('Error: ' + err.response.data.error);
      } else {
        alert(t.templates.deleteFailed);
      }
      console.error('Failed to delete template', err);
    }
  };

  const formatPrice = (priceInCopper?: number) => {
    if (!priceInCopper) return '-';
    const gold = getGold(priceInCopper);
    const silver = getSilver(priceInCopper);
    const copper = getCopper(priceInCopper);
    const parts = [];
    if (gold > 0) parts.push(`${gold}g`);
    if (silver > 0) parts.push(`${silver}s`);
    if (copper > 0) parts.push(`${copper}c`);
    return parts.join(' ') || '0c';
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortDir('ASC');
    }
  };

  const getSortIndicator = (field: string) => {
    if (sortBy !== field) return '';
    return sortDir === 'ASC' ? ' ▲' : ' ▼';
  };

  return (
    <div className="page-container max-width-1200">
      <div className="mb-20" style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => navigate('/characters')} className="btn-primary">
          ← Back to Characters
        </button>
        <button onClick={() => navigate('/templates/new')} className="btn-primary" style={{ backgroundColor: '#5cb85c' }}>
          + Create New Template
        </button>
      </div>

      <h2>Template Management</h2>

      {/* Search and Filters */}
      <div className="filter-container mb-20">
        <h3>Search Templates</h3>
        <div className="flex-row flex-gap-10" style={{ flexWrap: 'wrap', marginBottom: '15px' }}>
          <div>
            <label>Name: </label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              placeholder="Search by name..."
              className="form-input-small"
            />
          </div>
          <div>
            <label>Category: </label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              placeholder="Search by category..."
              className="form-input-small"
            />
          </div>
          <div>
            <label>Type: </label>
            <select
              value={filters.isContainer === undefined ? '' : filters.isContainer.toString()}
              onChange={(e) => setFilters({ 
                ...filters, 
                isContainer: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              className="form-input-small"
            >
              <option value="">All</option>
              <option value="false">Simple Items</option>
              <option value="true">Containers</option>
            </select>
          </div>
          <div>
            <label>Page Size: </label>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              className="form-input-small"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <button onClick={handleSearch} className="btn-small">
            Search
          </button>
          <button
            onClick={() => {
              setFilters({ name: '', isContainer: undefined, category: '' });
              setPage(0);
            }}
            className="btn-small"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Create Template Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/templates/create')}
          className="btn-primary"
        >
          + Create New Template
        </button>
      </div>

      {/* Templates Table */}
      {loading ? (
        <p>Loading...</p>
      ) : templates && templates.content.length > 0 ? (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th 
                  style={{ padding: '10px', border: '1px solid #ccc', cursor: 'pointer' }}
                  onClick={() => toggleSort('name')}
                >
                  Name{getSortIndicator('name')}
                </th>
                <th 
                  style={{ padding: '10px', border: '1px solid #ccc', cursor: 'pointer' }}
                  onClick={() => toggleSort('category')}
                >
                  Category{getSortIndicator('category')}
                </th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Item</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Type</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Price</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Qty</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.content.map((template) => (
                <tr key={template.id}>
                  <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold' }}>
                    {template.name}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                    {template.category}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                    {template.item}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                    {template.isContainer ? (
                      <span style={{ color: '#7AB8C0', fontWeight: 'bold' }}>
                        Container ({template.contents?.length || 0} items)
                      </span>
                    ) : (
                      'Simple Item'
                    )}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                    {formatPrice(template.priceInCopper)}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                    {template.quantity}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                    <button
                      onClick={() => navigate(`/templates/${template.id}`)}
                      className="btn-small"
                      style={{ marginRight: '5px' }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/templates/${template.id}/edit`)}
                      className="btn-small"
                      style={{ marginRight: '5px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id, template.name)}
                      className="btn-small"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              Showing {templates.content.length} of {templates.totalElements} templates
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="btn-small"
              >
                Previous
              </button>
              <span>
                Page {page + 1} of {templates.totalPages || 1}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= templates.totalPages - 1}
                className="btn-small"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <p>No templates found. Create your first template to get started!</p>
      )}
    </div>
  );
};

export default TemplatesPage;
