import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest, InventoryCreateRequest, InventoryUpdateRequest, Category, CategoryRequest, ItemTemplate, TemplateRequest, Page } from '../types';

const API_URL = 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },

  deleteAccount: async (password: string): Promise<void> => {
    await axiosInstance.delete('/auth/account', { data: { password } });
  },
};

export const characterService = {
  getCharacters: async () => {
    const response = await axiosInstance.get('/characters');
    return response.data;
  },

  createCharacter: async (name: string) => {
    const response = await axiosInstance.post('/characters', { name });
    return response.data;
  },

  updateCharacter: async (id: number, name: string, currentYear?: number, currentDay?: number) => {
    const response = await axiosInstance.put(`/characters/${id}`, { 
      name,
      currentYear,
      currentDay
    });
    return response.data;
  },

  deleteCharacter: async (id: number) => {
    await axiosInstance.delete(`/characters/${id}`);
  },

  incrementDay: async (id: number) => {
    const response = await axiosInstance.post(`/characters/${id}/increment-day`);
    return response.data;
  },

  decrementDay: async (id: number) => {
    const response = await axiosInstance.post(`/characters/${id}/decrement-day`);
    return response.data;
  },
};

export const inventoryService = {
  getInventory: async (
    characterId: number,
    category?: string,
    minPrice?: number,
    maxWeight?: number,
    itemName?: string
  ) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
    if (maxWeight !== undefined) params.append('maxWeight', maxWeight.toString());
    if (itemName) params.append('itemName', itemName);

    const response = await axiosInstance.get(
      `/characters/${characterId}/inventory?${params.toString()}`
    );
    return response.data;
  },

  createInventory: async (characterId: number, data: InventoryCreateRequest) => {
    const response = await axiosInstance.post(
      `/characters/${characterId}/inventory`,
      data
    );
    return response.data;
  },

  updateInventory: async (characterId: number, inventoryId: number, data: InventoryUpdateRequest) => {
    const response = await axiosInstance.put(
      `/characters/${characterId}/inventory/${inventoryId}`,
      data
    );
    return response.data;
  },

  removeInventory: async (
    characterId: number,
    inventoryId: number,
    removalText: string
  ) => {
    await axiosInstance.delete(
      `/characters/${characterId}/inventory/${inventoryId}`,
      { data: { removalText } }
    );
  },

  updateQuantity: async (
    characterId: number,
    inventoryId: number,
    quantityChange: number
  ) => {
    const response = await axiosInstance.patch(
      `/characters/${characterId}/inventory/${inventoryId}/quantity`,
      { quantityChange }
    );
    return response.data;
  },

  getContainerContents: async (characterId: number, inventoryId: number) => {
    const response = await axiosInstance.get(
      `/characters/${characterId}/inventory/${inventoryId}/contents`
    );
    return response.data;
  },

  getTotalWeight: async (characterId: number, inventoryId: number) => {
    const response = await axiosInstance.get(
      `/characters/${characterId}/inventory/${inventoryId}/total-weight`
    );
    return response.data.totalWeight;
  },

  cloneInventory: async (
    characterId: number,
    inventoryId: number,
    includeContents: boolean
  ) => {
    const response = await axiosInstance.post(
      `/characters/${characterId}/inventory/${inventoryId}/clone?includeContents=${includeContents}`
    );
    return response.data;
  },
};

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await axiosInstance.get('/categories');
    return response.data;
  },

  createCategory: async (data: CategoryRequest): Promise<Category> => {
    const response = await axiosInstance.post('/categories', data);
    return response.data;
  },

  updateCategory: async (id: number, data: CategoryRequest): Promise<Category> => {
    const response = await axiosInstance.put(`/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/categories/${id}`);
  },
};

export const templateService = {
  getAllTemplates: async (page: number = 0, size: number = 20, sortBy: string = 'name', sortDir: string = 'ASC'): Promise<Page<ItemTemplate>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('sortDir', sortDir);
    const response = await axiosInstance.get(`/templates?${params.toString()}`);
    return response.data;
  },

  searchTemplates: async (
    name?: string,
    isContainer?: boolean,
    category?: string,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'name',
    sortDir: string = 'ASC'
  ): Promise<Page<ItemTemplate>> => {
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (isContainer !== undefined) params.append('isContainer', isContainer.toString());
    if (category) params.append('category', category);
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('sortDir', sortDir);
    const response = await axiosInstance.get(`/templates/search?${params.toString()}`);
    return response.data;
  },

  getTemplate: async (id: number): Promise<ItemTemplate> => {
    const response = await axiosInstance.get(`/templates/${id}`);
    return response.data;
  },

  createTemplate: async (data: TemplateRequest): Promise<ItemTemplate> => {
    const response = await axiosInstance.post('/templates', data);
    return response.data;
  },

  updateTemplate: async (id: number, data: TemplateRequest): Promise<ItemTemplate> => {
    const response = await axiosInstance.put(`/templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/templates/${id}`);
  },

  addTemplateToInventory: async (characterId: number, templateId: number) => {
    const response = await axiosInstance.post(`/templates/${templateId}/add-to-character/${characterId}`);
    return response.data;
  },
};
