import { apiClient } from './config';
import { Item, ItemCreate, ItemUpdate, ItemSearch, ItemSummary, SearchResult } from './types';

export const itemsApi = {
  // Test endpoint without auth
  testUpload: async (files: File[]): Promise<any> => {
    console.log('Testing upload with files:', files);
    const formData = new FormData();
    files.forEach((file, index) => {
      console.log(`Appending file ${index}:`, file.name, file.type, file.size);
      formData.append('files', file);
    });

    console.log('FormData has files:', formData.has('files'));
    console.log('FormData keys:', Array.from(formData.keys()));
    console.log('FormData values count:', Array.from(formData.values()).length);

    return apiClient.post('/items/test-upload', formData);
  },

  // POST /items/upload-images
  uploadImages: async (files: File[]): Promise<{ image_urls: string[] }> => {
    console.log('Uploading files:', files);

    // Convert files to base64
    const images = await Promise.all(
      files.map(async (file) => {
        return new Promise<{ filename: string; content: string; content_type: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]; // Remove data:image/...;base64, prefix
            resolve({
              filename: file.name,
              content: base64,
              content_type: file.type
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );

    return apiClient.post('/items/upload-images', { images });
  },

  // POST /items/
createItem: async (data: ItemCreate, files?: File[]): Promise<Item> => {
  let itemData = { ...data };

  if (files && files.length > 0) {
    // First upload images to get URLs
    const uploadResponse = await itemsApi.uploadImages(files);
    itemData.images = uploadResponse.image_urls;
  }

  // Create item with image URLs
  return apiClient.post('/items/', itemData);
}
,
  // GET /items/search
  searchItems: async (params: ItemSearch): Promise<SearchResult> => {
    const searchParams = new URLSearchParams();

    if (params.query) searchParams.append('query', params.query);
    if (params.category_id) searchParams.append('category_id', params.category_id.toString());
    if (params.min_price) searchParams.append('min_price', params.min_price.toString());
    if (params.max_price) searchParams.append('max_price', params.max_price.toString());
    if (params.location) searchParams.append('location', params.location);
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.size) searchParams.append('size', params.size.toString());

    const queryString = searchParams.toString();
    return apiClient.get(`/items/search${queryString ? `?${queryString}` : ''}`);
  },

  // GET /items/active
  getActiveItems: async (skip: number = 0, limit: number = 100): Promise<ItemSummary[]> => {
    return apiClient.get(`/items/active?skip=${skip}&limit=${limit}`);
  },

  // GET /items/my-items
  getMyItems: async (skip: number = 0, limit: number = 100): Promise<Item[]> => {
    return apiClient.get(`/items/my-items?skip=${skip}&limit=${limit}`);
  },

  // GET /items/category/{category_id}
  getItemsByCategory: async (categoryId: number, skip: number = 0, limit: number = 100): Promise<ItemSummary[]> => {
    return apiClient.get(`/items/category/${categoryId}?skip=${skip}&limit=${limit}`);
  },

  // GET /items/{item_id}
  getItem: async (itemId: number): Promise<Item> => {
    return apiClient.get(`/items/${itemId}`);
  },

  // PUT /items/{item_id}
  updateItem: async (itemId: number, data: ItemUpdate): Promise<Item> => {
    return apiClient.put(`/items/${itemId}`, data);
  },

  // POST /items/{item_id}/start
  startAuction: async (itemId: number): Promise<{ message: string; item_id: number }> => {
    return apiClient.post(`/items/${itemId}/start`);
  },

  // DELETE /items/{item_id}
  deleteItem: async (itemId: number): Promise<{ message: string }> => {
    return apiClient.delete(`/items/${itemId}`);
  },
};