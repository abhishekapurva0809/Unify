import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom Hook: useAuth
 * Convenient hook for accessing global authentication context state and actions
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
