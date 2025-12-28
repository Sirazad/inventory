export interface User {
  username: string;
  email: string;
  token: string;
}

export interface Character {
  id: number;
  name: string;
  createdAt: string;
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
  removed: boolean;
  removedText?: string;
  createdAt: string;
  updatedAt: string;
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
