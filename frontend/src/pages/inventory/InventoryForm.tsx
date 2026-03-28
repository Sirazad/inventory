import React from 'react';
import { InventoryFormData } from './types';
import { Category, Inventory, ItemTemplate } from '../../types';
import { templateService } from '../../services/api';
import { getApiErrorMessage } from '../../utils/errorUtils';
import { TranslationKeys } from '../../i18n/translations';
import styles from './InventoryForm.module.css';

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
    <div className="form-container">
      <h3>{editingId ? t.inventory.editItem : t.inventory.addNewItem}</h3>

      {/* Tabs for Custom vs Template (only show when adding new, not editing) */}
      {!editingId && (
        <div className={styles.tabBar}>
          <button
            type="button"
            onClick={() => setAddMode('custom')}
            className={styles.tabButton}
            style={{
              backgroundColor: addMode === 'custom' ? '#7AB8C0' : 'transparent',
              color: addMode === 'custom' ? 'white' : '#333',
              fontWeight: addMode === 'custom' ? 'bold' : 'normal',
            }}
          >
            Custom Item
          </button>
          <button
            type="button"
            onClick={() => setAddMode('template')}
            className={styles.tabButton}
            style={{
              backgroundColor: addMode === 'template' ? '#7AB8C0' : 'transparent',
              color: addMode === 'template' ? 'white' : '#333',
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
          <div className="mb-20">
            <label>Search Templates</label>
            <div className={styles.templateSearchRow}>
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
                className={styles.templateSearchInput}
              />
              <button type="button" onClick={handleTemplateSearch} className="btn-primary">
                Search
              </button>
            </div>
          </div>

          {/* Template Results */}
          {templates.length > 0 && (
            <div className="mb-20">
              <h4>Search Results</h4>
              <div className={styles.templateResultsBox}>
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={styles.templateResultItem}
                    style={{
                      border: selectedTemplate?.id === template.id ? '2px solid #7AB8C0' : '1px solid #ddd',
                      backgroundColor: selectedTemplate?.id === template.id ? '#f0f8ff' : 'white',
                    }}
                  >
                    <div className="font-bold">{template.name}</div>
                    <div className={styles.templateResultMeta}>
                      {template.category} - {template.item}
                      {template.isContainer && ' (Container)'}
                    </div>
                    <div className={styles.templateResultDesc}>{template.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Template Preview */}
          {selectedTemplate && (
            <div className={styles.templatePreview}>
              <h4>Selected Template: {selectedTemplate.name}</h4>
              <div><strong>Category:</strong> {selectedTemplate.category}</div>
              <div><strong>Item:</strong> {selectedTemplate.item}</div>
              {selectedTemplate.quality && <div><strong>Quality:</strong> {selectedTemplate.quality}</div>}
              <div><strong>Description:</strong> {selectedTemplate.description}</div>
              <div><strong>Quantity:</strong> {selectedTemplate.quantity}</div>
              {selectedTemplate.weight && <div><strong>Weight:</strong> {selectedTemplate.weight} kg</div>}
              {selectedTemplate.isContainer && selectedTemplate.contents && selectedTemplate.contents.length > 0 && (
                <div className={styles.templatePreviewContents}>
                  <strong>Contains {selectedTemplate.contents.length} items:</strong>
                  <ul className={styles.templatePreviewList}>
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
                className={`btn-primary ${styles.btnSuccess} mt-10`}
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
          <div className={styles.formGrid}>
            <div>
              <label>{t.inventory.categoryRequired}</label>
              <select
                value={formData.category}
                onChange={(e) => onFormDataChange({ ...formData, category: e.target.value })}
                required
                className="form-input-full"
              >
                <option value="">{t.inventory.selectCategory}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="form-help-text">
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
                className="form-input-full"
              />
            </div>
            <div>
              <label>{t.inventory.qualityLabel}</label>
              <input
                type="text"
                value={formData.quality}
                onChange={(e) => onFormDataChange({ ...formData, quality: e.target.value })}
                className="form-input-full"
              />
            </div>
            <div>
              <label>{t.inventory.quantityRequired}</label>
              <div className={styles.quantityRow}>
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
                  className={styles.quantityInput}
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
              <div className={styles.priceRow}>
                <input
                  type="number"
                  min="0"
                  placeholder={t.inventory.gold}
                  value={formData.gold}
                  onChange={(e) => onFormDataChange({ ...formData, gold: e.target.value })}
                  className={styles.priceInput}
                />
                <span>g</span>
                <input
                  type="number"
                  min="0"
                  placeholder={t.inventory.silver}
                  value={formData.silver}
                  onChange={(e) => onFormDataChange({ ...formData, silver: e.target.value })}
                  className={styles.priceInput}
                />
                <span>s</span>
                <input
                  type="number"
                  min="0"
                  placeholder={t.inventory.copper}
                  value={formData.copper}
                  onChange={(e) => onFormDataChange({ ...formData, copper: e.target.value })}
                  className={styles.priceInput}
                />
                <span>c</span>
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
                className="form-input-full"
              />
            </div>
            <div>
              <label>{t.inventory.containerOptional}</label>
              <select
                value={formData.containerId}
                onChange={(e) => onFormDataChange({ ...formData, containerId: e.target.value })}
                className="form-input-full"
              >
                <option value="">{t.inventory.noContainer}</option>
                {availableContainers.map((container) => (
                  <option key={container.id} value={container.id}>
                    {container.item}
                  </option>
                ))}
              </select>
              <div className="form-help-text">
                {t.inventory.containerItemHelp}
              </div>
            </div>
            <div className={styles.fullRow}>
              <label>{t.inventory.descriptionRequired}</label>
              <textarea
                value={formData.description}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                required
                rows={3}
                className="form-input-full"
              />
            </div>
            <div className={styles.fullRow}>
              <label>{t.inventory.notesLabel}</label>
              <input
                type="text"
                value={formData.addedUpdated}
                onChange={(e) => onFormDataChange({ ...formData, addedUpdated: e.target.value })}
                className="form-input-full"
              />
            </div>
          </div>

          {/* Save as Template checkbox (only show when adding new item, not editing) */}
          {!editingId && (
            <div className={styles.saveAsTemplateBox}>
              <label className={styles.saveAsTemplateLabel}>
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className={styles.saveAsTemplateCheckbox}
                />
                <strong>Save as Template</strong>
              </label>
              <div className={styles.saveAsTemplateHint}>
                Also create a reusable template from this item for future use
              </div>
            </div>
          )}

          <div className="form-actions">
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
