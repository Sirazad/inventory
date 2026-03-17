export interface VisibleColumns {
  category: boolean;
  item: boolean;
  quality: boolean;
  description: boolean;
  price: boolean;
  quantity: boolean;
  weight: boolean;
  added: boolean;
  modified: boolean;
  notes: boolean;
  actions: boolean;
}

export interface InventoryFormData {
  category: string;
  item: string;
  quality: string;
  description: string;
  gold: string;
  silver: string;
  copper: string;
  quantity: string;
  addedUpdated: string;
  weight: string;
  containerId: string;
}

export interface InventoryFiltersState {
  category: string;
  minPrice: string;
  maxWeight: string;
  itemName: string;
}

export const EMPTY_FORM_DATA: InventoryFormData = {
  category: '',
  item: '',
  quality: '',
  description: '',
  gold: '',
  silver: '',
  copper: '',
  quantity: '1',
  addedUpdated: '',
  weight: '',
  containerId: '',
};

export const EMPTY_FILTERS: InventoryFiltersState = {
  category: '',
  minPrice: '',
  maxWeight: '',
  itemName: '',
};

export const DEFAULT_VISIBLE_COLUMNS: VisibleColumns = {
  category: true,
  item: true,
  quality: true,
  description: true,
  price: true,
  quantity: true,
  weight: true,
  added: true,
  modified: true,
  notes: true,
  actions: true,
};
