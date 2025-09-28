const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Token expiration handler
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];
let isNotificationShown = false;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

const handleTokenExpiration = () => {
  // Clear the expired token
  localStorage.removeItem('authToken');

  // Dispatch a custom event to notify the auth context
  window.dispatchEvent(new CustomEvent('tokenExpired'));

  // Show user-friendly notification (only once)
  const showNotification = () => {
    if (isNotificationShown) return;
    isNotificationShown = true;

    // Create a notification element
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 300px;
      ">
        <div style="font-weight: 600; margin-bottom: 4px;">Session Expired</div>
        <div>Your session has expired. You will be redirected to login.</div>
      </div>
    `;

    document.body.appendChild(notification);

    // Remove notification after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  };

  showNotification();

  // Redirect to login page after a short delay
  setTimeout(() => {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, 2000);
};

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${apiConfig.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...apiConfig.headers,
        ...getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle token expiration
      if (response.status === 401) {
        const token = localStorage.getItem('authToken');

        // Only handle token expiration if we actually had a token
        if (token && !isRefreshing) {
          isRefreshing = true;

          try {
            // For now, just handle expiration by logging out
            // In the future, this is where refresh token logic would go
            handleTokenExpiration();

            isRefreshing = false;
            processQueue(new Error('Token expired'), null);

            const error = await response.json().catch(() => ({ detail: 'Authentication failed' }));
            throw new Error(error.detail || 'Authentication failed - please log in again');
          } catch (refreshError) {
            isRefreshing = false;
            processQueue(refreshError, null);
            throw refreshError;
          }
        }

        if (isRefreshing) {
          // If we're already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            // Retry the original request after refresh
            return this.request(endpoint, options);
          });
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  },

  get(endpoint: string, options?: RequestInit): Promise<any> {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint: string, data?: any, options?: RequestInit): Promise<any> {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put(endpoint: string, data?: any, options?: RequestInit): Promise<any> {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete(endpoint: string, options?: RequestInit): Promise<any> {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
};