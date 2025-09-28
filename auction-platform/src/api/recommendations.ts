import { apiClient } from './config';

export interface RecommendedItem {
  id: number;
  name: string;
  description: string;
  currently: number;
  first_bid: number;
  buy_price?: number;
  ends: string;
  images: string[];
  categories: Array<{
    id: number;
    name: string;
  }>;
  seller: {
    id: number;
    username: string;
  };
  recommendation_score: number;
  number_of_bids: number;
}

export interface SimilarItem {
  id: number;
  name: string;
  description: string;
  currently: number;
  first_bid: number;
  buy_price?: number;
  ends: string;
  images: string[];
  categories: Array<{
    id: number;
    name: string;
  }>;
  seller: {
    id: number;
    username: string;
  };
  similarity_score: number;
  number_of_bids: number;
}

export const recommendationsApi = {
  // GET /dashboard/recommendations
  getUserRecommendations: async (limit: number = 10): Promise<RecommendedItem[]> => {
    return apiClient.get(`/dashboard/recommendations?limit=${limit}`);
  },

  // GET /dashboard/recommendations/category
  getCategoryRecommendations: async (limit: number = 10): Promise<RecommendedItem[]> => {
    return apiClient.get(`/dashboard/recommendations/category?limit=${limit}`);
  },

  // GET /dashboard/similar-items/{item_id}
  getSimilarItems: async (itemId: number, limit: number = 6): Promise<SimilarItem[]> => {
    return apiClient.get(`/dashboard/similar/${itemId}?limit=${limit}`);
  },

  // GET /dashboard/trending-items
  getTrendingItems: async (limit: number = 10): Promise<RecommendedItem[]> => {
    return apiClient.get(`/dashboard/popular?limit=${limit}`);
  },
};