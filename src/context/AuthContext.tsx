import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/domain/models/auth.types';
import { authService } from '@/services/auth/authService';
import { resolveRoleName } from '@/utils/roleUtils';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usuario: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Al montar la aplicación, verificamos si hay sesión persistida y normalizamos el rol
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser({
        ...storedUser,
        rol: resolveRoleName(storedUser),
      });
    }
    setIsLoading(false);
  }, []);

  const login = (usuario: User) => {
    const normalizedUser: User = {
      ...usuario,
      rol: resolveRoleName(usuario),
    };
    setUser(normalizedUser);
    authService.setStoredUser(normalizedUser);
  };

  const logout = () => {
    setUser(null);
    authService.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
