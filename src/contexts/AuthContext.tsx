'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { sessionService, userService, authService } from '@/lib/storage';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isVisitor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = async () => {
      setMounted(true);
      await userService.initializeDefaultUsers();
      const savedUser = sessionService.getCurrentUser();
      if (savedUser) {
        setCurrentUser(savedUser);
      } else {
        const hasAdmin = await userService.hasAdmin();
        if (hasAdmin) {
          const users = await userService.getAll();
          const visitor = users.find(u => u.role === 'visitor');
          if (visitor) {
            sessionService.setCurrentUser(visitor);
            setCurrentUser(visitor);
          }
        }
      }
    };
    init();
  }, []);

  const login = async (username: string, password?: string): Promise<boolean> => {
    const user = await authService.login(username, password);
    if (user) {
      sessionService.setCurrentUser(user);
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = async () => {
    sessionService.clearCurrentUser();
    const users = await userService.getAll();
    const visitor = users.find((u: User) => u.role === 'visitor');
    setCurrentUser(visitor || null);
  };

  const isAdmin = currentUser?.role === 'admin';
  const isVisitor = currentUser?.role === 'visitor';

  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAdmin, isVisitor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
