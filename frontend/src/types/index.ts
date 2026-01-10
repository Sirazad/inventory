export interface User {
  username: string;
  email: string;
  token: string;
}

export interface Character {
  id: number;
  name: string;
  createdAt: string;
  currentYear?: number;
  currentDay?: number;
  godName?: string; // God associated with the current month
  godMonthNumber?: number; // Which month this is for that god (1st, 2nd, 3rd, etc.)
  season?: string; // Season for the current month
}

export interface Inventory {
  id: number;
  category: string;
  item: string;
  quality?: string;
  description: string;
  priceInCopper?: number;
  gold?: number;
  silver?: number;
  copper?: number;
  quantity: number;
  addedUpdated?: string;
  weight?: number;
  containerId?: number;
  removed: boolean;
  removedText?: string;
  createdAt: string;
  updatedAt: string;
  addedYear?: number;
  addedDay?: number;
  modifiedYear?: number;
  modifiedDay?: number;
  removedYear?: number;
  removedDay?: number;
  addedGodName?: string;
  addedGodMonthNumber?: number;
  addedSeason?: string;
  modifiedGodName?: string;
  modifiedGodMonthNumber?: number;
  modifiedSeason?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
}

export interface InventoryCreateRequest {
  category: string;
  item: string;
  quality?: string;
  description: string;
  gold?: number;
  silver?: number;
  copper?: number;
  quantity: number;
  addedUpdated?: string;
  weight?: number;
  containerId?: number;
}

export interface InventoryUpdateRequest {
  category: string;
  item: string;
  quality?: string;
  description: string;
  gold?: number;
  silver?: number;
  copper?: number;
  quantity: number;
  addedUpdated?: string;
  weight?: number;
  containerId?: number;
}

export interface ContainerDetailsResponse {
  contents: Inventory[];
  totalWeight: number;
}

export interface Category {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRequest {
  name: string;
}

export interface ItemTemplate {
  id: number;
  name: string;
  category: string;
  item: string;
  quality?: string;
  description: string;
  priceInCopper?: number;
  gold?: number;
  silver?: number;
  copper?: number;
  quantity: number;
  weight?: number;
  isContainer: boolean;
  contents?: TemplateContent[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateContent {
  id: number;
  referencedTemplateId?: number;
  referencedTemplateName?: string;
  quantityOverride?: number;
  category?: string;
  item?: string;
  quality?: string;
  description?: string;
  priceInCopper?: number;
  gold?: number;
  silver?: number;
  copper?: number;
  quantity?: number;
  weight?: number;
}

export interface TemplateRequest {
  name: string;
  category: string;
  item: string;
  quality?: string;
  description: string;
  gold?: number;
  silver?: number;
  copper?: number;
  quantity: number;
  weight?: number;
  isContainer?: boolean;
  contents?: TemplateContentRequest[];
}

export interface TemplateContentRequest {
  referencedTemplateId?: number;
  quantityOverride?: number;
  category?: string;
  item?: string;
  quality?: string;
  description?: string;
  gold?: number;
  silver?: number;
  copper?: number;
  quantity?: number;
  weight?: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
