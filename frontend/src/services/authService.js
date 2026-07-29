import API from './api';

/**
 * Authentication & User API Service Handlers
 */

// Register a new user account
export const registerUserApi = async (userData) => {
  const response = await API.post('/auth/register', userData);
  return response.data;
};

// Login existing user
export const loginUserApi = async (credentials) => {
  const response = await API.post('/auth/login', credentials);
  return response.data;
};

// Fetch current user profile
export const getUserProfileApi = async () => {
  const response = await API.get('/users/profile');
  return response.data;
};

// Update user profile details
export const updateUserProfileApi = async (updateData) => {
  const response = await API.put('/users/profile', updateData);
  return response.data;
};
