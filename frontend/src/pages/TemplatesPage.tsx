import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateService } from '../services/api';
import { ItemTemplate, Page } from '../types';
import { getGold, getSilver, getCopper } from '../utils/currencyUtils';
import { useLanguage } from '../i18n/LanguageContext';
import { getApiErrorMessage } from '../utils/errorUtils';

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

  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    isContainer: undefined as boolean | undefined,
    category: ''
  });

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sortBy, sortDir, appliedFilters]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await templateService.searchTemplates(
        appliedFilters.name || undefined,
        appliedFilters.isContainer,
        appliedFilters.category || undefined,
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
    setAppliedFilters({ ...filters });
    setPage(0);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(t.templates.confirmDelete)) {
      return;
    }

    try {
      await templateService.deleteTemplate(id);
      alert(t.templates.deleteSuccess);
      loadTemplates();
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, t.templates.deleteFailed));
      console.error('Failed to delete template', err);
    }
  };

  const formatPrice = (priceInCopper?: number) => {
    if (!priceInCopper) return '-';
    const gold = getGold(priceInCopper);
    const silver = getSilver(priceInCopper);
    const copper = getCopper(priceInCopper);
    const parts: string[] = [];
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
          ← {t.templates.backToCharacters}
        </button>
        <button onClick={() => navigate('/templates/new')} className="btn-primary" style={{ backgroundColor: '#5cb85c' }}>
          + {t.templates.createNew}
        </button>
      </div>

      <h2>{t.templates.title}</h2>

      {/* Search and Filters */}
      <div className="filter-container mb-20">
        <h3>{t.templates.searchTemplates}</h3>
        <div className="flex-row flex-gap-10" style={{ flexWrap: 'wrap', marginBottom: '15px' }}>
          <div>
            <label>{t.templates.name}: </label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              placeholder={t.templates.searchByName}
              className="form-input-small"
            />
          </div>
          <div>
            <label>{t.templates.category}: </label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              placeholder={t.templates.searchByCategory}
              className="form-input-small"
            />
          </div>
          <div>
            <label>{t.templates.type}: </label>
            <select
              value={filters.isContainer === undefined ? '' : filters.isContainer.toString()}
              onChange={(e) => setFilters({
                ...filters,
                isContainer: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              className="form-input-small"
            >
              <option value="">{t.templates.all}</option>
              <option value="false">{t.templates.simpleItems}</option>
              <option value="true">{t.templates.containers}</option>
            </select>
          </div>
          <div>
            <label>{t.templates.pageSize}: </label>
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
            {t.templates.search}
          </button>
          <button
            onClick={() => {
              const empty = { name: '', isContainer: undefined as boolean | undefined, category: '' };
              setFilters(empty);
              setAppliedFilters(empty);
              setPage(0);
            }}
            className="btn-small"
          >
            {t.templates.clear}
          </button>
        </div>
      </div>

      {/* Templates Table */}
      {loading ? (
        <p>{t.templates.loading}</p>
      ) : templates && templates.content.length > 0 ? (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th
                  style={{ padding: '10px', border: '1px solid #ccc', cursor: 'pointer' }}
                  onClick={() => toggleSort('name')}
                >
                  {t.templates.name}{getSortIndicator('name')}
                </th>
                <th
                  style={{ padding: '10px', border: '1px solid #ccc', cursor: 'pointer' }}
                  onClick={() => toggleSort('category')}
                >
                  {t.templates.category}{getSortIndicator('category')}
                </th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>{t.templates.item}</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>{t.templates.type}</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>{t.templates.price}</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>{t.templates.quantity}</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>{t.templates.actions}</th>
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
                        {t.templates.containerWithItems.replace('{count}', String(template.contents?.length || 0))}
                      </span>
                    ) : (
                      t.templates.simpleItem
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
                      {t.templates.view}
                    </button>
                    <button
                      onClick={() => navigate(`/templates/${template.id}/edit`)}
                      className="btn-small"
                      style={{ marginRight: '5px' }}
                    >
                      {t.templates.edit}
                    </button>
                    <button
                      onClick={() => handleDelete(template.id, template.name)}
                      className="btn-small"
                    >
                      {t.templates.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {t.templates.showing
                .replace('{count}', String(templates.content.length))
                .replace('{total}', String(templates.totalElements))}
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="btn-small"
              >
                {t.templates.previous}
              </button>
              <span>
                {t.templates.page} {page + 1} {t.templates.of} {templates.totalPages || 1}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= templates.totalPages - 1}
                className="btn-small"
              >
                {t.templates.next}
              </button>
            </div>
          </div>
        </>
      ) : (
        <p>{t.templates.noTemplatesFound}</p>
      )}
    </div>
  );
};

export default TemplatesPage;
