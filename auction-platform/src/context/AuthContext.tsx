import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { authApi } from '../api';
import type { User as ApiUser } from '../api/types';
import { getLoginErrorMessage, getRegistrationErrorMessage } from '../utils/errorHandling';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'seller' | 'admin';
  isApproved: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
}

interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  country: string;
  tin: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const tokenResponse = await authApi.login({ username, password });

      // Store the token
      localStorage.setItem('authToken', tokenResponse.access_token);

      // Get user information
      const userData = await authApi.getCurrentUser();

      // Transform API user to local User interface
      const transformedUser: User = {
        id: userData.id,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        role: userData.role,
        isApproved: userData.is_approved
      };

      setUser(transformedUser);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      // Clear any existing token on login failure
      localStorage.removeItem('authToken');
      const errorMessage = getLoginErrorMessage(error);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // Transform registerData to API format
      const apiRegisterData = {
        username: userData.username,
        password: userData.password,
        confirm_password: userData.confirmPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        location: userData.location,
        country: userData.country,
        afm: userData.tin // TIN maps to AFM in the API
      };

      await authApi.register(apiRegisterData);
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = getRegistrationErrorMessage(error);
      throw new Error(errorMessage);
    }
  };

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Verify token and get user data
      const userData = await authApi.getCurrentUser();

      // Transform API user to local User interface
      const transformedUser: User = {
        id: userData.id,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        role: userData.role,
        isApproved: userData.is_approved
      };

      setUser(transformedUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status on app load (only once)
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Set up token expiration listener and periodic validation (only once)
  useEffect(() => {
    // Listen for token expiration events
    const handleTokenExpiration = () => {
      console.log('Token expired, logging out user');
      setUser(null);
      localStorage.removeItem('authToken');
    };

    window.addEventListener('tokenExpired', handleTokenExpiration);

    // Set up periodic token validation (every 5 minutes)
    const tokenCheckInterval = setInterval(async () => {
      const token = localStorage.getItem('authToken');
      if (token && userRef.current) {
        try {
          await authApi.verifyToken();
        } catch (error) {
          console.log('Token validation failed, logging out user');
          setUser(null);
          localStorage.removeItem('authToken');
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Cleanup listeners and interval on unmount
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpiration);
      clearInterval(tokenCheckInterval);
    };
  }, []); // Empty dependency array - run only once

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    register,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export type { User, RegisterData };