import { apiClient, apiConfig, getAuthHeaders } from './config';
import { DataStatistics } from './types';

export const dataManagementApi = {
  // POST /data-management/load-xml-file (admin only)
  loadXMLFile: async (file: File, makeActive: boolean = false): Promise<{
    message: string;
    items_loaded: number;
    users_created: number;
    categories_created: number;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('make_active', makeActive.toString());

    const authHeaders = getAuthHeaders();
    const response = await fetch(`${apiConfig.baseURL}/data-management/load-xml-file`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },

  // POST /data-management/load-sample-data (admin only)
  loadSampleData: async (makeActive: boolean = false): Promise<{
    message: string;
    items_loaded: number;
    users_created: number;
    categories_created: number;
  }> => {
    const formData = new FormData();
    formData.append('make_active', makeActive.toString());

    const authHeaders = getAuthHeaders();
    const response = await fetch(`${apiConfig.baseURL}/data-management/load-sample-data`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },

  // POST /data-management/train-recommendations (admin only)
  trainRecommendationModel: async (): Promise<{
    message: string;
    training_stats: {
      users: number;
      items: number;
      interactions: number;
      training_status: string;
    };
  }> => {
    return apiClient.post('/data-management/train-recommendations');
  },

  // GET /data-management/data-statistics (admin only)
  getDataStatistics: async (): Promise<DataStatistics> => {
    return apiClient.get('/data-management/data-statistics');
  },

  // POST /data-management/cleanup-test-data (admin only)
  cleanupTestData: async (confirm: boolean = false): Promise<{
    message: string;
    deleted: {
      items: number;
      users: number;
      bids: string;
    };
  }> => {
    const formData = new FormData();
    formData.append('confirm', confirm.toString());

    const authHeaders = getAuthHeaders();
    const response = await fetch(`${apiConfig.baseURL}/data-management/cleanup-test-data`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },
};