import API from './api';

/**
 * User Management API Services
 */

// Search registered users by keyword query (name or email)
export const searchUsersApi = async (query) => {
  if (!query) return { success: true, data: [] };
  const response = await API.get(`/users/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

// Update user profile details (name, status)
export const updateUserProfileApi = async (updateData) => {
  const response = await API.put('/users/profile', updateData);
  return response.data;
};
