import { apiClient } from './config';
import { User, UserUpdate, UserApproval, UserProfile } from './types';

export const usersApi = {
  // GET /users/me
  getCurrentUserProfile: async (): Promise<User> => {
    return apiClient.get('/users/me');
  },

  // PUT /users/me
  updateCurrentUser: async (data: UserUpdate): Promise<User> => {
    console.log('UPDATE DATA:', data);
    return apiClient.put('/users/me', data);
  },

  // GET /users/ (admin only)
  getAllUsers: async (skip: number = 0, limit: number = 100): Promise<User[]> => {
    return apiClient.get(`/users/?skip=${skip}&limit=${limit}`);
  },

  // GET /users/pending (admin only)
  getPendingUsers: async (): Promise<User[]> => {
    return apiClient.get('/users/pending');
  },

  // POST /users/approve (admin only)
  approveUser: async (data: UserApproval): Promise<{ message: string }> => {
    return apiClient.post('/users/approve', data);
  },

  // GET /users/{user_id}
  getUserProfile: async (userId: number): Promise<UserProfile> => {
    return apiClient.get(`/users/${userId}`);
  },

  // DELETE /users/{user_id} (admin only)
  deactivateUser: async (userId: number): Promise<{ message: string }> => {
    return apiClient.delete(`/users/${userId}`);
  },
};