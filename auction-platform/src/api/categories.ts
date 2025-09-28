import { apiClient } from './config';
import { Category, CategoryCreate, CategoryUpdate } from './types';

export const categoriesApi = {
  // GET /categories/
  getAllCategories: async (): Promise<Category[]> => {
    return apiClient.get('/categories/');
  },

  // POST /categories/ (admin only)
  createCategory: async (data: CategoryCreate): Promise<Category> => {
    return apiClient.post('/categories/', data);
  },

  // GET /categories/{category_id}
  getCategory: async (categoryId: number): Promise<Category> => {
    return apiClient.get(`/categories/${categoryId}`);
  },

  // PUT /categories/{category_id} (admin only)
  updateCategory: async (categoryId: number, data: CategoryUpdate): Promise<Category> => {
    return apiClient.put(`/categories/${categoryId}`, data);
  },

  // DELETE /categories/{category_id} (admin only)
  deleteCategory: async (categoryId: number): Promise<{ message: string }> => {
    return apiClient.delete(`/categories/${categoryId}`);
  },
};