// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  country: string;
  afm: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  location?: string;
  country?: string;
  afm: string;
  role: 'user' | 'seller' | 'admin';
  is_active: boolean;
  is_approved: boolean;
  bidder_rating: number;
  seller_rating: number;
  created_at: string;
  status?: 'pending' | 'approved' | 'rejected';
  rating?: number;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  location?: string;
  country?: string;
  afm?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  location?: string;
  country?: string;
  bidder_rating: number;
  seller_rating: number;
  created_at: string;
}

export interface UserApproval {
  user_id: number;
  is_approved: boolean;
}

// Item types
export interface Item {
  id: number;
  name: string;
  description?: string;
  currently: number;
  first_bid: number;
  buy_price?: number;
  number_of_bids: number;
  location?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  started?: string;
  ends: string;
  status: 'draft' | 'active' | 'ended';
  images?: string[];
  seller_id: number;
  seller: User;
  categories: Category[];
  bids: Bid[];
}

export interface ItemCreate {
  name: string;
  description?: string;
  first_bid: number;
  buy_price?: number;
  location?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  started?: string;
  ends: string;
  images?: string[];
  category_ids?: number[];
}

export interface ItemUpdate {
  name?: string;
  description?: string;
  first_bid?: number;
  buy_price?: number;
  location?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  started?: string;
  ends?: string;
  images?: string[];
  category_ids?: number[];
}

export interface ItemSearch {
  query?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  location?: string;
  status?: 'draft' | 'active' | 'ended';
  page?: number;
  size?: number;
}

export interface ItemSummary {
  id: number;
  name: string;
  currently: number;
  first_bid?: number;
  number_of_bids: number;
  ends: string;
  status: 'draft' | 'active' | 'ended';
  images?: string[];
  location?: string;
  seller: {
    id: number;
    username: string;
    seller_rating: number;
  };
  categories: { id: number; name: string; }[];
}

export interface SearchResult {
  items: ItemSummary[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Bid types
export interface Bid {
  id: number;
  amount: number;
  time: string;
  bidder_id: number;
  item_id: number;
  bidder: User;
  item: Item;
}

export interface BidCreate {
  item_id: number;
  amount: number;
}

export interface BidConfirmation {
  message: string;
  bid: Bid;
  is_winning: boolean;
  is_buy_now: boolean;
}

export interface BidSummary {
  id: number;
  amount: number;
  time: string;
  bidder_username: string;
  bidder_location?: string;
  bidder_country?: string;
  bidder_rating: number;
  bidder?: {
    username: string;
    rating?: number;
  };
}

// Message types
export interface Message {
  id: number;
  subject: string;
  content: string;
  is_read: boolean;
  sender_id: number;
  receiver_id: number;
  item_id?: number;
  created_at: string;
  sender_username: string;
  receiver_username: string;
  item_name?: string;
  sender?: {
    username: string;
  };
  receiver?: {
    username: string;
  };
  item?: {
    id: number;
    name: string;
  };
}

export interface MessageCreate {
  receiver_id?: number;
  receiver_username?: string;
  subject: string;
  content: string;
  item_id?: number;
}

export interface MessageSummary {
  id: number;
  subject: string;
  sender_username: string;
  receiver_username: string;
  is_read: boolean;
  created_at: string;
  item_name?: string;
  content?: string;
  sender?: {
    username: string;
  };
  receiver?: {
    username: string;
  };
  item?: {
    id: number;
    name: string;
  };
}

export interface MessageMarkRead {
  message_ids: number[];
}

// Category types
export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface CategoryCreate {
  name: string;
  description?: string;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
}

// Admin types
export interface AdminDashboard {
  popular_items: any[];
  ending_soon: any[];
  category_stats: any[];
  user_stats: any;
  top_sellers: any[];
  recent_registrations: any[];
}

export interface AdminStatistics {
  auctions: {
    total: number;
    active: number;
    completed: number;
    draft: number;
  };
  bids: {
    total: number;
    total_value: number;
    average_value: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  messages: {
    total: number;
    unread: number;
    read: number;
  };
}

// Data Management types
export interface DataStatistics {
  user_statistics: Record<string, number>;
  item_statistics: Record<string, number>;
  top_categories: { name: string; items: number; }[];
  bidding_statistics: {
    total_bids: number;
    unique_bidders: number;
    avg_bids_per_item: number;
    total_bid_value: number;
  };
  recommendation_readiness: boolean;
}