import React from 'react';
import { InventoryFormData, EMPTY_FORM_DATA } from './types';
import { Category, Inventory, ItemTemplate } from '../../types';
import { templateService } from '../../services/api';
import { getApiErrorMessage } from '../../utils/errorUtils';
import { TranslationKeys } from '../../i18n/translations';

interface Props {
  formData: InventoryFormData;
  onFormDataChange: (data: InventoryFormData) => void;
  editingId: number | null;
  categories: Category[];
  availableContainers: Inventory[];
  onSubmit: (e: React.FormEvent, saveAsTemplate: boolean) => void;
  onCancel: () => void;
  characterId: number;
  onInventoryAdded: () => void;
  t: TranslationKeys;
}

const InventoryForm: React.FC<Props> = ({
  formData,
  onFormDataChange,
  editingId,
  categories,
  availableContainers,
  onSubmit,
  onCancel,
  characterId,
  onInventoryAdded,
  t,
}) => {
  const [addMode, setAddMode] = React.useState<'custom' | 'template'>('custom');
  const [saveAsTemplate, setSaveAsTemplate] = React.useState(false);
  const [templateSearch, setTemplateSearch] = React.useState('');
  const [templates, setTemplates] = React.useState<ItemTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState<ItemTemplate | null>(null);

  const resetTemplateState = () => {
    setAddMode('custom');
    setSaveAsTemplate(false);
    setSelectedTemplate(null);
    setTemplateSearch('');
    setTemplates([]);
  };

  const handleTemplateSearch = async () => {
    if (!templateSearch.trim()) {
      setTemplates([]);
      return;
    }
    try {
      const response = await templateService.searchTemplates(templateSearch, undefined, undefined, 0, 20, 'name', 'ASC');
      setTemplates(response.content);
    } catch (err) {
      console.error('Failed to search templates', err);
      alert('Failed to search templates');
    }
  };

  const handleSelectTemplate = async (template: ItemTemplate) => {
    try {
      const fullTemplate = await templateService.getTemplate(template.id);
      setSelectedTemplate(fullTemplate);
    } catch (err) {
      console.error('Failed to load template details', err);
      alert('Failed to load template details');
    }
  };

  const handleAddTemplateToInventory = async () => {
    if (!selectedTemplate) return;
    try {
      await templateService.addTemplateToInventory(characterId, selectedTemplate.id);
      alert(`Template "${selectedTemplate.name}" added to inventory successfully!`);
      resetTemplateState();
      onCancel();
      onInventoryAdded();
    } catch (err: unknown) {
      console.error('Failed to add template to inventory', err);
      alert(getApiErrorMessage(err, 'Failed to add template to inventory'));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    await onSubmit(e, saveAsTemplate);
    setSaveAsTemplate(false);
  };

  return (
    <div style={{ marginBottom: '20px', padding: '20px', border: '2px solid #7AB8C0', backgroundColor: 'white' }}>
      <h3>{editingId ? t.inventory.editItem : t.inventory.addNewItem}</h3>

      {/* Tabs for Custom vs Template (only show when adding new, not editing) */}
      {!editingId && (
        <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #ccc' }}>
          <button
            type="button"
            onClick={() => setAddMode('custom')}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: addMode === 'custom' ? '#7AB8C0' : 'transparent',
              color: addMode === 'custom' ? 'white' : '#333',
              cursor: 'pointer',
              fontWeight: addMode === 'custom' ? 'bold' : 'normal',
            }}
          >
            Custom Item
          </button>
          <button
            type="button"
            onClick={() => setAddMode('template')}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: addMode === 'template' ? '#7AB8C0' : 'transparent',
              color: addMode === 'template' ? 'white' : '#333',
              cursor: 'pointer',
              fontWeight: addMode === 'template' ? 'bold' : 'normal',
            }}
          >
            From Template
          </button>
        </div>
      )}

      {/* Template Selection Mode */}
      {addMode === 'template' && !editingId && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <label>Search Templates</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTemplateSearch();
                  }
                }}
                placeholder="Search by template name..."
                style={{ flex: 1, padding: '8px' }}
              />
              <button type="button" onClick={handleTemplateSearch} className="btn-primary">
                Search
              </button>
            </div>
          </div>

          {/* Template Results */}
          {templates.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4>Search Results</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    style={{
                      padding: '10px',
                      marginBottom: '10px',
                      border: selectedTemplate?.id === template.id ? '2px solid #7AB8C0' : '1px solid #ddd',
                      backgroundColor: selectedTemplate?.id === template.id ? '#f0f8ff' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{template.name}</div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      {template.category} - {template.item}
                      {template.isContainer && ' (Container)'}
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#888' }}>{template.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Template Preview */}
          {selectedTemplate && (
            <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #5cb85c', backgroundColor: '#f0fff0' }}>
              <h4>Selected Template: {selectedTemplate.name}</h4>
              <div><strong>Category:</strong> {selectedTemplate.category}</div>
              <div><strong>Item:</strong> {selectedTemplate.item}</div>
              {selectedTemplate.quality && <div><strong>Quality:</strong> {selectedTemplate.quality}</div>}
              <div><strong>Description:</strong> {selectedTemplate.description}</div>
              <div><strong>Quantity:</strong> {selectedTemplate.quantity}</div>
              {selectedTemplate.weight && <div><strong>Weight:</strong> {selectedTemplate.weight} kg</div>}
              {selectedTemplate.isContainer && selectedTemplate.contents && selectedTemplate.contents.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Contains {selectedTemplate.contents.length} items:</strong>
                  <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                    {selectedTemplate.contents.map((content, idx) => (
                      <li key={idx}>
                        {content.item || 'Referenced Template'} (x{content.quantity || content.quantityOverride || 1})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                onClick={handleAddTemplateToInventory}
                className="btn-primary"
                style={{ marginTop: '15px', backgroundColor: '#5cb85c' }}
              >
                Add to Inventory
              </button>
            </div>
          )}
        </div>
      )}

      {/* Custom Item Form */}
      {addMode === 'custom' && (
        <form onSubmit={handleFormSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>{t.inventory.categoryRequired}</label>
              <select
                value={formData.category}
                onChange={(e) => onFormDataChange({ ...formData, category: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              >
                <option value="">{t.inventory.selectCategory}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                {t.inventory.containerHelp}
              </div>
            </div>
            <div>
              <label>{t.inventory.itemRequired}</label>
              <input
                type="text"
                value={formData.item}
                onChange={(e) => onFormDataChange({ ...formData, item: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            <div>
              <label>{t.inventory.qualityLabel}</label>
              <input
                type="text"
                value={formData.quality}
                onChange={(e) => onFormDataChange({ ...formData, quality: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            <div>
              <label>{t.inventory.quantityRequired}</label>
              <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const newQty = Math.max(1, parseInt(formData.quantity || '1') - 1);
                    onFormDataChange({ ...formData, quantity: newQty.toString() });
                  }}
                  className="btn-form-quantity"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => onFormDataChange({ ...formData, quantity: e.target.value })}
                  required
                  style={{ flex: 1, padding: '8px', textAlign: 'center' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newQty = parseInt(formData.quantity || '1') + 1;
                    onFormDataChange({ ...formData, quantity: newQty.toString() });
                  }}
                  className="btn-form-quantity"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label>{t.inventory.priceLabel}</label>
              <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                <input
                  type="number"
                  min="0"
                  placeholder={t.inventory.gold}
                  value={formData.gold}
                  onChange={(e) => onFormDataChange({ ...formData, gold: e.target.value })}
                  style={{ width: '30%', padding: '8px' }}
                />
                <span style={{ alignSelf: 'center' }}>g</span>
                <input
                  type="number"
                  min="0"
                  placeholder={t.inventory.silver}
                  value={formData.silver}
                  onChange={(e) => onFormDataChange({ ...formData, silver: e.target.value })}
                  style={{ width: '30%', padding: '8px' }}
                />
                <span style={{ alignSelf: 'center' }}>s</span>
                <input
                  type="number"
                  min="0"
                  placeholder={t.inventory.copper}
                  value={formData.copper}
                  onChange={(e) => onFormDataChange({ ...formData, copper: e.target.value })}
                  style={{ width: '30%', padding: '8px' }}
                />
                <span style={{ alignSelf: 'center' }}>c</span>
              </div>
            </div>
            <div>
              <label>{t.inventory.weightLabel}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={t.inventory.kilograms}
                value={formData.weight}
                onChange={(e) => onFormDataChange({ ...formData, weight: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            <div>
              <label>{t.inventory.containerOptional}</label>
              <select
                value={formData.containerId}
                onChange={(e) => onFormDataChange({ ...formData, containerId: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              >
                <option value="">{t.inventory.noContainer}</option>
                {availableContainers.map((container) => (
                  <option key={container.id} value={container.id}>
                    {container.item}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                {t.inventory.containerItemHelp}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>{t.inventory.descriptionRequired}</label>
              <textarea
                value={formData.description}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                required
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>{t.inventory.notesLabel}</label>
              <input
                type="text"
                value={formData.addedUpdated}
                onChange={(e) => onFormDataChange({ ...formData, addedUpdated: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
          </div>

          {/* Save as Template checkbox (only show when adding new item, not editing) */}
          {!editingId && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f8ff', border: '1px solid #7AB8C0' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <strong>Save as Template</strong>
              </label>
              <div style={{ fontSize: '0.85em', color: '#666', marginTop: '5px', marginLeft: '24px' }}>
                Also create a reusable template from this item for future use
              </div>
            </div>
          )}

          <div style={{ marginTop: '15px' }}>
            <button type="submit" className="btn-primary">
              {editingId ? t.inventory.updateItem : t.inventory.addItem}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default InventoryForm;
