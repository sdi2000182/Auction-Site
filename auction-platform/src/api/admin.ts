import { apiClient, apiConfig, getAuthHeaders } from './config';
import { AdminDashboard, AdminStatistics } from './types';

export const adminApi = {
  // GET /admin/dashboard (admin only)
  getDashboard: async (): Promise<AdminDashboard> => {
    return apiClient.get('/admin/dashboard');
  },

  // GET /admin/export/xml (admin only)
  exportAuctionsXML: async (): Promise<Blob> => {
    const authHeaders = getAuthHeaders();
    console.log('Calling XML export:', `${apiConfig.baseURL}/admin/export/xml`);
    const response = await fetch(`${apiConfig.baseURL}/admin/export/xml`, {
      method: 'GET',
      headers: authHeaders,
    });

    console.log('XML export response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('XML export error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.blob();
  },

  // GET /admin/export/json (admin only)
  exportAuctionsJSON: async (): Promise<Blob> => {
    const authHeaders = getAuthHeaders();
    console.log('Calling JSON export:', `${apiConfig.baseURL}/admin/export/json`);
    const response = await fetch(`${apiConfig.baseURL}/admin/export/json`, {
      method: 'GET',
      headers: authHeaders,
    });

    console.log('JSON export response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('JSON export error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.blob();
  },

  // GET /admin/statistics (admin only)
  getDetailedStatistics: async (): Promise<AdminStatistics> => {
    return apiClient.get('/admin/statistics');
  },
};