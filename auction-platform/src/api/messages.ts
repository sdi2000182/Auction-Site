import { apiClient } from './config';
import { Message, MessageCreate, MessageSummary, MessageMarkRead } from './types';

export const messagesApi = {
  // POST /messages/
  sendMessage: async (data: MessageCreate): Promise<Message> => {
    return apiClient.post('/messages/', data);
  },

  // GET /messages/
  getMessages: async (
    folder: 'inbox' | 'sent' | 'all' = 'inbox',
    skip: number = 0,
    limit: number = 100
  ): Promise<MessageSummary[]> => {
    return apiClient.get(`/messages/?folder=${folder}&skip=${skip}&limit=${limit}`);
  },

  // GET /messages/unread-count
  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    return apiClient.get('/messages/unread-count');
  },

  // GET /messages/conversation/{other_user_id}
  getConversation: async (otherUserId: number, itemId?: number): Promise<Message[]> => {
    const params = itemId ? `?item_id=${itemId}` : '';
    return apiClient.get(`/messages/conversation/${otherUserId}${params}`);
  },

  // PUT /messages/mark-read
  markMessagesAsRead: async (data: MessageMarkRead): Promise<{ message: string }> => {
    return apiClient.put('/messages/mark-read', data);
  },

  // GET /messages/{message_id}
  getMessage: async (messageId: number): Promise<Message> => {
    return apiClient.get(`/messages/${messageId}`);
  },

  // DELETE /messages/{message_id}
  deleteMessage: async (messageId: number): Promise<{ message: string }> => {
    return apiClient.delete(`/messages/${messageId}`);
  },
};