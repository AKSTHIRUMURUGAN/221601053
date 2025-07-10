'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if we have a client-side token
        const clientToken = Cookies.get('token');
        
        if (clientToken) {
          // Try to get profile with client-side token
          try {
            const profileData = await authAPI.getProfile();
            setUser(profileData.user);
            setProfile(profileData);
            setLoading(false);
            setInitialized(true);
            return;
          } catch (error) {
            // If client-side token fails, clear it
            Cookies.remove('token');
          }
        }

        // If no client-side token or it failed, try HTTP-only cookies
        try {
          const profileData = await authAPI.getProfile();
          setUser(profileData.user);
          setProfile(profileData);
          // Set client-side token as backup
          if (profileData.user) {
            // We don't have the token from HTTP-only cookies, so we'll rely on them
            // The backend should handle authentication via HTTP-only cookies
          }
        } catch (error) {
          // User is not authenticated
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      setUser(response.user);
      
      // Immediately fetch profile data after login
      try {
        const profileData = await authAPI.getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to fetch profile after login:', error);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    try {
      const profileData = await authAPI.getProfile();
      setUser(profileData.user);
      setProfile(profileData);
      return profileData;
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      // If profile refresh fails, user might be logged out
      setUser(null);
      setProfile(null);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    initialized,
    login,
    register,
    logout,
    refreshProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 