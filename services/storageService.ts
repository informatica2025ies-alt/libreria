import { Book, User, UserRole } from "../types";
import { supabase } from "./supabaseClient";

// Helpers to map Database snake_case to TypeScript camelCase
const mapUserFromDB = (data: any): User => ({
  id: data.id,
  name: data.name,
  email: data.email,
  password: data.password,
  role: data.role as UserRole,
  createdAt: data.created_at,
});

const mapBookFromDB = (data: any): Book => ({
  id: data.id,
  title: data.title,
  author: data.author,
  category: data.category,
  description: data.description,
  stock: data.stock,
  coverUrl: data.cover_url,
  bookUrl: data.book_url,
  addedBy: data.added_by,
});

// User Operations
export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', error.message, error.details);
      return [];
    }
    return (data || []).map(mapUserFromDB);
  } catch (err) {
    console.error('Unexpected error fetching users:', err);
    return [];
  }
};

export const saveUser = async (user: User): Promise<void> => {
  const dbUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
    created_at: user.createdAt,
  };
  
  const { error } = await supabase.from('users').upsert(dbUser);
  if (error) console.error('Error saving user:', error.message);
};

export const deleteUser = async (userId: string): Promise<void> => {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) console.error('Error deleting user:', error.message);
};

// Book Operations
export const getBooks = async (): Promise<Book[]> => {
  try {
    const { data, error } = await supabase.from('books').select('*');
    if (error) {
      console.error('Error fetching books:', error.message, error.details);
      return [];
    }
    return (data || []).map(mapBookFromDB);
  } catch (err) {
    console.error('Unexpected error fetching books:', err);
    return [];
  }
};

export const saveBook = async (book: Book): Promise<void> => {
  const dbBook = {
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    category: book.category,
    cover_url: book.coverUrl,
    book_url: book.bookUrl,
    stock: book.stock,
    added_by: book.addedBy,
  };

  const { error } = await supabase.from('books').upsert(dbBook);
  if (error) console.error('Error saving book:', error.message);
};

export const deleteBook = async (bookId: string): Promise<void> => {
  const { error } = await supabase.from('books').delete().eq('id', bookId);
  if (error) console.error('Error deleting book:', error.message);
};

// Auth Simulation (Checking against Users table)
export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    // Use maybeSingle instead of single to prevent errors if no match is found
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();

    if (error) {
      console.error('Login error from DB:', error.message);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    return mapUserFromDB(data);
  } catch (err) {
    console.error('Unexpected error during login:', err);
    return null;
  }
};