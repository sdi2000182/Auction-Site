import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  isApproved: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
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

  // Mock authentication - in real app, this would call an API
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful login
      if (username && password) {
        const mockUser: User = {
          id: '1',
          username: username,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          role: username === 'admin' ? 'admin' : 'user',
          isApproved: true,
        };
        setUser(mockUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock registration success
      console.log('Registration data:', userData);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export type { User, RegisterData };