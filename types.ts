export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, never store plain text passwords
  role: UserRole;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  coverUrl: string;
  bookUrl?: string; // New field for external book link
  stock: number;
  addedBy: string; // User ID of admin who added it
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface GeneratedBookDetails {
  description: string;
  category: string;
}