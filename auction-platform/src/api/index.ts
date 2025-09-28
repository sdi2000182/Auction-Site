// Main API exports
export { apiClient, apiConfig, getAuthHeaders } from './config';

// API modules
import { authApi } from './auth';
import { usersApi } from './users';
import { itemsApi } from './items';
import { bidsApi } from './bids';
import { messagesApi } from './messages';
import { categoriesApi } from './categories';
import { adminApi } from './admin';
import { dataManagementApi } from './dataManagement';
import { recommendationsApi } from './recommendations';

// Re-export API modules
export { authApi, usersApi, itemsApi, bidsApi, messagesApi, categoriesApi, adminApi, dataManagementApi, recommendationsApi };

// Types
export * from './types';

// Convenience object with all APIs
export const api = {
  auth: authApi,
  users: usersApi,
  items: itemsApi,
  bids: bidsApi,
  messages: messagesApi,
  categories: categoriesApi,
  admin: adminApi,
  dataManagement: dataManagementApi,
  recommendations: recommendationsApi,
};

export default api;