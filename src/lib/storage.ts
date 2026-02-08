import { Person, User } from '@/types';

const API_BASE = '/api';

// Person CRUD operations - using backend API
export const peopleService = {
  getAll: async (): Promise<Person[]> => {
    const response = await fetch(`${API_BASE}/people`);
    if (!response.ok) throw new Error('Failed to fetch people');
    return response.json();
  },

  getById: async (id: string): Promise<Person | undefined> => {
    const response = await fetch(`${API_BASE}/people/${id}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch person');
    return response.json();
  },

  create: async (person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): Promise<Person> => {
    const response = await fetch(`${API_BASE}/people`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person),
    });
    if (!response.ok) throw new Error('Failed to create person');
    return response.json();
  },

  update: async (id: string, updates: Partial<Person>): Promise<Person | null> => {
    const response = await fetch(`${API_BASE}/people/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to update person');
    return response.json();
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE}/people/${id}`, {
      method: 'DELETE',
    });
    if (response.status === 404) return false;
    if (!response.ok) throw new Error('Failed to delete person');
    return true;
  },

  getVisiblePeople: async (userId?: string, isAdmin?: boolean): Promise<Person[]> => {
    const people = await peopleService.getAll();
    // Admin sees all people, visitor sees all people (for privacy feature simplification)
    if (!userId || isAdmin) return people;
    return people.filter(p => p.visibleTo.includes(userId) || p.visibleTo.includes('all'));
  },
};

// User CRUD operations - using backend API
export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  getById: async (id: string): Promise<User | undefined> => {
    const users = await userService.getAll();
    return users.find(u => u.id === id);
  },

  create: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  initializeDefaultUsers: async (): Promise<void> => {
    await fetch(`${API_BASE}/init`, { method: 'POST' });
  },

  hasAdmin: async (): Promise<boolean> => {
    const users = await userService.getAll();
    return users.some(u => u.role === 'admin');
  },
};

// Auth operations
export const authService = {
  login: async (username: string, password?: string): Promise<User | null> => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.user as User;
  },
};

// Current user session management
const STORAGE_KEYS = {
  CURRENT_USER: 'birthday_reminder_current_user',
} as const;

export const sessionService = {
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  clearCurrentUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
};

// Initialize default data
export const initializeApp = async (): Promise<void> => {
  await userService.initializeDefaultUsers();
};
