import { apiClient } from './config';
import { Bid, BidCreate, BidConfirmation, BidSummary } from './types';

export const bidsApi = {
  // POST /bids/
  placeBid: async (data: BidCreate): Promise<BidConfirmation> => {
    return apiClient.post('/bids/', data);
  },

  // GET /bids/item/{item_id}
  getItemBids: async (itemId: number): Promise<BidSummary[]> => {
    return apiClient.get(`/bids/item/${itemId}`);
  },

  // GET /bids/my-bids
  getMyBids: async (skip: number = 0, limit: number = 100): Promise<Bid[]> => {
    return apiClient.get(`/bids/my-bids?skip=${skip}&limit=${limit}`);
  },

  // GET /bids/my-winning-bids
  getMyWinningBids: async (): Promise<Bid[]> => {
    return apiClient.get('/bids/my-winning-bids');
  },

  // GET /bids/{bid_id}
  getBid: async (bidId: number): Promise<Bid> => {
    return apiClient.get(`/bids/${bidId}`);
  },
};