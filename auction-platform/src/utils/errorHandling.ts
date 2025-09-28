// Utility functions for handling API errors in a user-friendly way

export const getErrorMessage = (error: any): string => {
  // Handle network errors
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network and try again.';
  }

  // Handle specific HTTP status codes
  if (error.response?.status) {
    switch (error.response.status) {
      case 400:
        return error.response.data?.detail || 'Invalid request. Please check your input.';
      case 401:
        return 'Invalid credentials. Please check your username and password.';
      case 403:
        return 'Access denied. You may not have permission to perform this action.';
      case 404:
        return 'Service not found. Please try again later.';
      case 409:
        return error.response.data?.detail || 'Conflict. This information may already exist.';
      case 422:
        return error.response.data?.detail || 'Invalid data provided. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return error.response.data?.detail || 'An unexpected error occurred.';
    }
  }

  // Handle fetch/network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Handle timeout errors
  if (error.name === 'TimeoutError' || error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }

  // Return the error message if it's a string, otherwise a generic message
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

export const getRegistrationErrorMessage = (error: any): string => {
  const message = getErrorMessage(error);

  // Handle common registration-specific errors
  if (message.toLowerCase().includes('username')) {
    return 'Username is already taken. Please choose a different username.';
  }

  if (message.toLowerCase().includes('email')) {
    return 'Email address is already registered. Please use a different email.';
  }

  if (message.toLowerCase().includes('afm') || message.toLowerCase().includes('tin')) {
    return 'Tax ID (AFM) is already registered. Please verify your Tax ID.';
  }

  if (message.toLowerCase().includes('password')) {
    return 'Password does not meet requirements. Please ensure it\'s at least 8 characters long.';
  }

  return message;
};

export const getLoginErrorMessage = (error: any): string => {
  const message = getErrorMessage(error);

  // Handle common login-specific errors
  if (message.toLowerCase().includes('credentials') ||
      message.toLowerCase().includes('unauthorized') ||
      message.toLowerCase().includes('password')) {
    return 'Invalid username or password. Please check your credentials and try again.';
  }

  if (message.toLowerCase().includes('inactive') ||
      message.toLowerCase().includes('disabled')) {
    return 'Your account is inactive. Please contact an administrator.';
  }

  if (message.toLowerCase().includes('approved') ||
      message.toLowerCase().includes('pending')) {
    return 'Your account is pending approval. Please wait for admin approval.';
  }

  return message;
};