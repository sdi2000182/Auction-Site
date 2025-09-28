import { apiClient } from './config';
import { LoginRequest, RegisterRequest, Token, User } from './types';

export const authApi = {
  // POST /auth/register
  register: async (data: RegisterRequest): Promise<{ message: string; user_id: number }> => {
    return apiClient.post('/auth/register', data);
  },

  // POST /auth/login
  login: async (data: LoginRequest): Promise<Token> => {
    return apiClient.post('/auth/login', data);
  },

  // GET /auth/me
  getCurrentUser: async (): Promise<User> => {
    return apiClient.get('/auth/me');
  },

  // GET /auth/verify-token
  verifyToken: async (): Promise<{
    valid: boolean;
    user_id: number;
    username: string;
    role: string;
    is_approved: boolean;
  }> => {
    return apiClient.get('/auth/verify-token');
  },
};