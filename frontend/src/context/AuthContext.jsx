import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('supportDeskToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    authService
      .getCurrentUser()
      .then((response) => {
        setUser(response.data.user);
      })
      .catch(() => {
        localStorage.removeItem('supportDeskToken');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (payload) => {
    const response = await authService.login(payload);
    const { token: nextToken, user: nextUser } = response.data;
    localStorage.setItem('supportDeskToken', nextToken);
    setToken(nextToken);
    setUser(nextUser);
    return response.data;
  };

  const register = async (payload) => {
    const response = await authService.register(payload);
    const { token: nextToken, user: nextUser } = response.data;
    localStorage.setItem('supportDeskToken', nextToken);
    setToken(nextToken);
    setUser(nextUser);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('supportDeskToken');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, setUser }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
