import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { templateService, categoryService } from '../services/api';
import { ItemTemplate, Category } from '../types';
import Notification from '../components/Notification';
import { useLanguage } from '../i18n/LanguageContext';
import { toCopperValue, getGold, getSilver, getCopper } from '../utils/currencyUtils';
import { getApiErrorMessage } from '../utils/errorUtils';

const TemplateFormPage: React.FC = () => {
  const { templateId: rawTemplateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const parsedTemplateId = rawTemplateId ? Number(rawTemplateId) : undefined;
  const isEditMode = parsedTemplateId !== undefined;

  useEffect(() => {
    if (rawTemplateId !== undefined && (parsedTemplateId === undefined || isNaN(parsedTemplateId))) {
      navigate('/templates', { replace: true });
    }
  }, [rawTemplateId, parsedTemplateId, navigate]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [allTemplates, setAllTemplates] = useState<ItemTemplate[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    item: '',
    quality: '',
    description: '',
    gold: '',
    silver: '',
    copper: '',
    quantity: '1',
    weight: '',
    isContainer: false,
  });
  const [contentItems, setContentItems] = useState<Array<{
    id?: number;
    referencedTemplateId?: number;
    quantityOverride?: number;
    category?: string;
    item?: string;
    quality?: string;
    description?: string;
    gold?: string;
    silver?: string;
    copper?: string;
    quantity?: string;
    weight?: string;
    isReference: boolean;
    templateFilter?: string;
  }>>([]);

  useEffect(() => {
    loadCategories();
    loadTemplates();
    if (isEditMode && parsedTemplateId !== undefined) {
      loadTemplate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawTemplateId]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadTemplates = useCallback(async () => {
    try {
      const response = await templateService.searchTemplates(undefined, undefined, undefined, 0, 100, 'name', 'ASC');
      setAllTemplates(response.content);
    } catch (err) {
      console.error('Failed to load templates', err);
    }
  }, []);

  const loadTemplate = async () => {
    if (parsedTemplateId === undefined || isNaN(parsedTemplateId)) return;
    try {
      const template = await templateService.getTemplate(parsedTemplateId);
      
      // Calculate gold, silver, copper from priceInCopper using utility
      const gold = getGold(template.priceInCopper);
      const silver = getSilver(template.priceInCopper);
      const copper = getCopper(template.priceInCopper);

      setFormData({
        name: template.name,
        category: template.category,
        item: template.item,
        quality: template.quality || '',
        description: template.description,
        gold: gold > 0 ? gold.toString() : '',
        silver: silver > 0 ? silver.toString() : '',
        copper: copper > 0 ? copper.toString() : '',
        quantity: template.quantity.toString(),
        weight: template.weight ? template.weight.toString() : '',
        isContainer: template.isContainer,
      });

      // Load content items if it's a container
      if (template.contents && template.contents.length > 0) {
        const items = template.contents.map(content => {
          if (content.referencedTemplateId) {
            return {
              id: content.id,
              referencedTemplateId: content.referencedTemplateId,
              quantityOverride: content.quantityOverride,
              isReference: true,
            };
          } else {
            const gold = getGold(content.priceInCopper);
            const silver = getSilver(content.priceInCopper);
            const copper = getCopper(content.priceInCopper);

            return {
              id: content.id,
              category: content.category,
              item: content.item,
              quality: content.quality || '',
              description: content.description,
              gold: gold > 0 ? gold.toString() : '',
              silver: silver > 0 ? silver.toString() : '',
              copper: copper > 0 ? copper.toString() : '',
              quantity: content.quantity?.toString() || '1',
              weight: content.weight ? content.weight.toString() : '',
              isReference: false,
            };
          }
        });
        setContentItems(items);
      }
    } catch (err) {
      console.error('Failed to load template', err);
      setNotification({ message: t.templateForm.loadFailed, type: 'error' });
      setTimeout(() => navigate('/templates'), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate price in copper using utility
    const gold = parseInt(formData.gold) || 0;
    const silver = parseInt(formData.silver) || 0;
    const copper = parseInt(formData.copper) || 0;
    const priceInCopper = toCopperValue(gold, silver, copper);

    const contents = formData.isContainer ? contentItems.map(item => {
      if (item.isReference) {
        return {
          id: item.id,
          referencedTemplateId: item.referencedTemplateId!,
          quantityOverride: item.quantityOverride,
        };
      } else {
        const goldValue = parseInt(item.gold || '0') || 0;
        const silverValue = parseInt(item.silver || '0') || 0;
        const copperValue = parseInt(item.copper || '0') || 0;
        const itemPrice = toCopperValue(goldValue, silverValue, copperValue);

        return {
          id: item.id,
          category: item.category!,
          item: item.item!,
          quality: item.quality || undefined,
          description: item.description || undefined,
          priceInCopper: itemPrice > 0 ? itemPrice : undefined,
          quantity: parseInt(item.quantity || '1'),
          weight: item.weight ? parseFloat(item.weight) : undefined,
        };
      }
    }) : [];

    const request = {
      name: formData.name,
      category: formData.category,
      item: formData.item,
      quality: formData.quality || undefined,
      description: formData.description,
      priceInCopper: priceInCopper > 0 ? priceInCopper : undefined,
      quantity: parseInt(formData.quantity),
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      isContainer: formData.isContainer,
      contents: contents.length > 0 ? contents : undefined,
    };

    try {
      if (isEditMode && parsedTemplateId !== undefined) {
        await templateService.updateTemplate(parsedTemplateId, request);
        setNotification({ message: t.templateForm.updateSuccess, type: 'success' });
        setTimeout(() => navigate('/templates'), 1500);
      } else {
        await templateService.createTemplate(request);
        setNotification({ message: t.templateForm.createSuccess, type: 'success' });
        setTimeout(() => navigate('/templates'), 1500);
      }
    } catch (err: unknown) {
      console.error('Failed to save template', err);
      setNotification({
        message: getApiErrorMessage(err, isEditMode ? t.templateForm.updateFailed : t.templateForm.createFailed),
        type: 'error',
      });
    }
  };

  const addContentItem = () => {
    setContentItems([...contentItems, { isReference: false, category: '', item: '', description: '', quantity: '1' }]);
  };

  const removeContentItem = (index: number) => {
    setContentItems(contentItems.filter((_, i) => i !== index));
  };

  const updateContentItem = (index: number, field: string, value: string | number | boolean | undefined) => {
    const updated = [...contentItems];
    updated[index] = { ...updated[index], [field]: value };
    setContentItems(updated);
  };

  return (
    <div className="page-container max-width-1200">
      <div className="mb-20">
        <button onClick={() => navigate('/templates')} className="btn-primary">
          ← {t.templateForm.backToTemplates}
        </button>
      </div>

      <h2>{isEditMode ? t.templateForm.editTemplate : t.templateForm.createNewTemplate}</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px', padding: '20px', border: '2px solid #7AB8C0', backgroundColor: 'white' }}>
          <h3>{t.templateForm.templateInformation}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>{t.templateForm.nameUnique}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                placeholder={t.templateForm.namePlaceholder}
              />
            </div>
            <div>
              <label>{t.templateForm.categoryLabel}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              >
                <option value="">{t.templateForm.selectCategory}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>{t.templateForm.itemLabel}</label>
              <input
                type="text"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                placeholder={t.templateForm.itemPlaceholder}
              />
            </div>
            <div>
              <label>{t.templateForm.quality}</label>
              <input
                type="text"
                value={formData.quality}
                onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                placeholder={t.templateForm.qualityPlaceholder}
              />
            </div>
            <div>
              <label>{t.templateForm.quantityLabel}</label>
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
              <label>{t.templateForm.priceLabel}</label>
              <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                <input
                  type="number"
                  min="0"
                  placeholder={t.templateForm.gold}
                  value={formData.gold}
                  onChange={(e) => setFormData({ ...formData, gold: e.target.value })}
                  style={{ width: '30%', padding: '8px' }}
                />
                <span style={{ alignSelf: 'center' }}>g</span>
                <input
                  type="number"
                  min="0"
                  placeholder={t.templateForm.silver}
                  value={formData.silver}
                  onChange={(e) => setFormData({ ...formData, silver: e.target.value })}
                  style={{ width: '30%', padding: '8px' }}
                />
                <span style={{ alignSelf: 'center' }}>s</span>
                <input
                  type="number"
                  min="0"
                  placeholder={t.templateForm.copper}
                  value={formData.copper}
                  onChange={(e) => setFormData({ ...formData, copper: e.target.value })}
                  style={{ width: '30%', padding: '8px' }}
                />
                <span style={{ alignSelf: 'center' }}>c</span>
              </div>
            </div>
            <div>
              <label>{t.templateForm.weightKg}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isContainer}
                  onChange={(e) => setFormData({ ...formData, isContainer: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                {t.templateForm.isContainer}
              </label>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                {t.templateForm.isContainerHelp}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>{t.templateForm.description}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
          </div>
        </div>

        {/* Container Contents */}
        {formData.isContainer && (
          <div style={{ marginBottom: '20px', padding: '20px', border: '2px solid #7AB8C0', backgroundColor: 'white' }}>
            <h3>{t.templateForm.containerContents}</h3>
            {contentItems.map((content, index) => (
              <div key={index} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>{t.templateForm.contentItem.replace('{number}', String(index + 1))}</h4>
                  <button type="button" onClick={() => removeContentItem(index)} className="btn-small" style={{ backgroundColor: '#d9534f', color: 'white' }}>
                    {t.templateForm.remove}
                  </button>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={content.isReference}
                      onChange={(e) => updateContentItem(index, 'isReference', e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    {t.templateForm.referenceExistingTemplate}
                  </label>
                </div>

                {content.isReference ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                    <div>
                      <label>{t.templateForm.selectTemplate}</label>
                      <input
                        type="text"
                        placeholder={t.templateForm.filterTemplates}
                        value={content.templateFilter || ''}
                        onChange={(e) => updateContentItem(index, 'templateFilter', e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '4px', boxSizing: 'border-box' }}
                      />
                      <select
                        value={content.referencedTemplateId || ''}
                        onChange={(e) => updateContentItem(index, 'referencedTemplateId', parseInt(e.target.value))}
                        required
                        style={{ width: '100%', padding: '8px' }}
                      >
                        <option value="">{t.templateForm.selectATemplate}</option>
                        {allTemplates
                          .filter(tmpl => tmpl.id !== parsedTemplateId)
                          .filter(tmpl => !content.templateFilter ||
                            tmpl.name.toLowerCase().includes(content.templateFilter.toLowerCase()) ||
                            tmpl.item.toLowerCase().includes(content.templateFilter.toLowerCase()))
                          .map((tmpl) => (
                            <option key={tmpl.id} value={tmpl.id}>
                              {tmpl.name} ({tmpl.category} - {tmpl.item})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label>{t.templateForm.quantityOverride}</label>
                      <input
                        type="number"
                        min="1"
                        value={content.quantityOverride || ''}
                        onChange={(e) => updateContentItem(index, 'quantityOverride', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder={t.templateForm.quantityOverrideHelp}
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label>{t.templateForm.categoryRequired}</label>
                      <select
                        value={content.category || ''}
                        onChange={(e) => updateContentItem(index, 'category', e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      >
                        <option value="">{t.templateForm.selectCategory}</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>{t.templateForm.itemRequired}</label>
                      <input
                        type="text"
                        value={content.item || ''}
                        onChange={(e) => updateContentItem(index, 'item', e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      />
                    </div>
                    <div>
                      <label>{t.templateForm.quality}</label>
                      <input
                        type="text"
                        value={content.quality || ''}
                        onChange={(e) => updateContentItem(index, 'quality', e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      />
                    </div>
                    <div>
                      <label>{t.templateForm.quantityRequired}</label>
                      <input
                        type="number"
                        min="1"
                        value={content.quantity || '1'}
                        onChange={(e) => updateContentItem(index, 'quantity', e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      />
                    </div>
                    <div>
                      <label>{t.templateForm.priceLabel}</label>
                      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        <input
                          type="number"
                          min="0"
                          placeholder="G"
                          value={content.gold || ''}
                          onChange={(e) => updateContentItem(index, 'gold', e.target.value)}
                          style={{ width: '30%', padding: '8px' }}
                        />
                        <span style={{ alignSelf: 'center' }}>g</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="S"
                          value={content.silver || ''}
                          onChange={(e) => updateContentItem(index, 'silver', e.target.value)}
                          style={{ width: '30%', padding: '8px' }}
                        />
                        <span style={{ alignSelf: 'center' }}>s</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="C"
                          value={content.copper || ''}
                          onChange={(e) => updateContentItem(index, 'copper', e.target.value)}
                          style={{ width: '30%', padding: '8px' }}
                        />
                        <span style={{ alignSelf: 'center' }}>c</span>
                      </div>
                    </div>
                    <div>
                      <label>{t.templateForm.weightKg}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={content.weight || ''}
                        onChange={(e) => updateContentItem(index, 'weight', e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label>{t.templateForm.description}</label>
                      <input
                        type="text"
                        value={content.description || ''}
                        onChange={(e) => updateContentItem(index, 'description', e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button type="button" onClick={addContentItem} className="btn-primary">
              + {t.templateForm.addContentItem}
            </button>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <button type="submit" className="btn-primary" style={{ marginRight: '10px' }}>
            {isEditMode ? t.templateForm.updateTemplate : t.templateForm.createTemplate}
          </button>
          <button type="button" onClick={() => navigate('/templates')} className="btn-primary">
            {t.templateForm.cancel}
          </button>
        </div>
      </form>
      
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default TemplateFormPage;
