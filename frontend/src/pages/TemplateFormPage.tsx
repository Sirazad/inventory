import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { templateService, categoryService } from '../services/api';
import { ItemTemplate, TemplateContentRequest, Category } from '../types';

const TemplateFormPage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const isEditMode = !!templateId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [allTemplates, setAllTemplates] = useState<ItemTemplate[]>([]);
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
  }>>([]);

  useEffect(() => {
    loadCategories();
    loadAllTemplates();
    if (isEditMode) {
      loadTemplate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadAllTemplates = async () => {
    try {
      const response = await templateService.getAllTemplates(0, 1000, 'name', 'ASC');
      setAllTemplates(response.content);
    } catch (err) {
      console.error('Failed to load templates', err);
    }
  };

  const loadTemplate = async () => {
    try {
      const template = await templateService.getTemplate(Number(templateId));
      
      // Calculate gold, silver, copper from priceInCopper
      const gold = template.priceInCopper ? Math.floor(template.priceInCopper / 10000) : 0;
      const silver = template.priceInCopper ? Math.floor((template.priceInCopper % 10000) / 100) : 0;
      const copper = template.priceInCopper ? template.priceInCopper % 100 : 0;

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
            const g = content.priceInCopper ? Math.floor(content.priceInCopper / 10000) : 0;
            const s = content.priceInCopper ? Math.floor((content.priceInCopper % 10000) / 100) : 0;
            const c = content.priceInCopper ? content.priceInCopper % 100 : 0;

            return {
              id: content.id,
              category: content.category,
              item: content.item,
              quality: content.quality || '',
              description: content.description,
              gold: g > 0 ? g.toString() : '',
              silver: s > 0 ? s.toString() : '',
              copper: c > 0 ? c.toString() : '',
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
      alert('Failed to load template');
      navigate('/templates');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate price in copper
    const gold = parseInt(formData.gold) || 0;
    const silver = parseInt(formData.silver) || 0;
    const copper = parseInt(formData.copper) || 0;
    const priceInCopper = gold * 10000 + silver * 100 + copper;

    const contents: TemplateContentRequest[] = formData.isContainer ? contentItems.map(item => {
      if (item.isReference) {
        return {
          referencedTemplateId: item.referencedTemplateId!,
          quantityOverride: item.quantityOverride,
        };
      } else {
        const g = parseInt(item.gold || '0') || 0;
        const s = parseInt(item.silver || '0') || 0;
        const c = parseInt(item.copper || '0') || 0;
        const itemPrice = g * 10000 + s * 100 + c;

        return {
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
      if (isEditMode) {
        await templateService.updateTemplate(Number(templateId), request);
        alert('Template updated successfully!');
      } else {
        await templateService.createTemplate(request);
        alert('Template created successfully!');
      }
      navigate('/templates');
    } catch (err: any) {
      console.error('Failed to save template', err);
      alert('Failed to save template: ' + (err.response?.data?.message || err.message));
    }
  };

  const addContentItem = () => {
    setContentItems([...contentItems, { isReference: false, category: '', item: '', description: '', quantity: '1' }]);
  };

  const removeContentItem = (index: number) => {
    setContentItems(contentItems.filter((_, i) => i !== index));
  };

  const updateContentItem = (index: number, field: string, value: any) => {
    const updated = [...contentItems];
    updated[index] = { ...updated[index], [field]: value };
    setContentItems(updated);
  };

  return (
    <div className="page-container max-width-1200">
      <div className="mb-20">
        <button onClick={() => navigate('/templates')} className="btn-primary">
          ← Back to Templates
        </button>
      </div>

      <h2>{isEditMode ? 'Edit Template' : 'Create New Template'}</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px', padding: '20px', border: '2px solid #7AB8C0', backgroundColor: 'white' }}>
          <h3>Template Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>Name (unique) *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                placeholder="e.g., Healing Kit, Health Potion"
              />
            </div>
            <div>
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Item *</label>
              <input
                type="text"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                placeholder="e.g., Leather Pouch, Potion Bottle"
              />
            </div>
            <div>
              <label>Quality</label>
              <input
                type="text"
                value={formData.quality}
                onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                placeholder="e.g., Common, Rare"
              />
            </div>
            <div>
              <label>Quantity *</label>
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
              <label>Price</label>
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
              <label>Weight (kg)</label>
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
                Is Container
              </label>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                Check if this template can contain other items
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Description *</label>
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
            <h3>Container Contents</h3>
            {contentItems.map((content, index) => (
              <div key={index} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>Content Item #{index + 1}</h4>
                  <button type="button" onClick={() => removeContentItem(index)} className="btn-small" style={{ backgroundColor: '#d9534f', color: 'white' }}>
                    Remove
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
                    Reference Existing Template
                  </label>
                </div>

                {content.isReference ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                    <div>
                      <label>Select Template *</label>
                      <select
                        value={content.referencedTemplateId || ''}
                        onChange={(e) => updateContentItem(index, 'referencedTemplateId', parseInt(e.target.value))}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      >
                        <option value="">Select a template</option>
                        {allTemplates
                          .filter(t => t.id !== Number(templateId)) // Don't allow self-reference
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.category} - {t.item})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label>Quantity Override</label>
                      <input
                        type="number"
                        min="1"
                        value={content.quantityOverride || ''}
                        onChange={(e) => updateContentItem(index, 'quantityOverride', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Leave empty to use template quantity"
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label>Category *</label>
                      <select
                        value={content.category || ''}
                        onChange={(e) => updateContentItem(index, 'category', e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Item *</label>
                      <input
                        type="text"
                        value={content.item || ''}
                        onChange={(e) => updateContentItem(index, 'item', e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      />
                    </div>
                    <div>
                      <label>Quality</label>
                      <input
                        type="text"
                        value={content.quality || ''}
                        onChange={(e) => updateContentItem(index, 'quality', e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      />
                    </div>
                    <div>
                      <label>Quantity *</label>
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
                      <label>Price</label>
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
                      <label>Weight (kg)</label>
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
                      <label>Description</label>
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
              + Add Content Item
            </button>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <button type="submit" className="btn-primary" style={{ marginRight: '10px' }}>
            {isEditMode ? 'Update Template' : 'Create Template'}
          </button>
          <button type="button" onClick={() => navigate('/templates')} className="btn-primary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateFormPage;
