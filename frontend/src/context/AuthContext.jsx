import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check token on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    
    const formData = new URLSearchParams();
    formData.append('username', cleanEmail);
    formData.append('password', password);

    // 1. Submit login request
    const res = await authAPI.login(formData);
    const { access_token, user_role } = res.data;

    // 2. Store access token
    localStorage.setItem('token', access_token);

    // 3. Fetch user details (the interceptor in api.js will attach the token)
    const userRes = await authAPI.getMe();
    setUser(userRes.data);

    return { success: true, role: user_role };
  };

  const register = async (data) => {
    const cleanData = { 
      ...data, 
      email: data.email.trim().toLowerCase() 
    };
    const res = await authAPI.register(cleanData);
    return { success: true, user: res.data };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}