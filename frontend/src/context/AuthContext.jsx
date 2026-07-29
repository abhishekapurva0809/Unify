import React, { createContext, useState, useEffect } from 'react';
import { registerUserApi, loginUserApi, getUserProfileApi } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('userInfo');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Sync user profile on mount if token exists
  useEffect(() => {
    const verifyUserSession = async () => {
      if (token) {
        try {
          const profileData = await getUserProfileApi();
          if (profileData.success) {
            setUser(profileData.data);
            localStorage.setItem('userInfo', JSON.stringify(profileData.data));
          }
        } catch (error) {
          console.error('Session verification failed:', error.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUserSession();
  }, [token]);

  /**
   * Register User Action
   */
  const register = async (userData) => {
    const response = await registerUserApi(userData);
    if (response.success) {
      const { token: userToken, ...userInfo } = response.data;
      setToken(userToken);
      setUser(userInfo);
      localStorage.setItem('token', userToken);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    }
    return response;
  };

  /**
   * Login User Action
   */
  const login = async (credentials) => {
    const response = await loginUserApi(credentials);
    if (response.success) {
      const { token: userToken, ...userInfo } = response.data;
      setToken(userToken);
      setUser(userInfo);
      localStorage.setItem('token', userToken);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    }
    return response;
  };

  /**
   * Logout User Action
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
