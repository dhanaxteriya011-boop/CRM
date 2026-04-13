import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Load user on refresh
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/me');
        setUser(res.data);
      } catch (err) {
        console.error('Auth error:', err);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // 🔹 Login
// Update login function to accept 'login' field (not email)
  const login = async (loginId, password) => {
    const res = await api.post('/login', { login: loginId, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  // 🔹 Logout
  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.warn('Logout API failed, clearing anyway');
    }

    localStorage.removeItem('token');
    setUser(null);
  };

  // 🔹 Role check
  const hasRole = (role) => {
    return user?.roles?.some((r) => r.name === role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 🔹 Custom Hook
export const useAuth = () => useContext(AuthContext);