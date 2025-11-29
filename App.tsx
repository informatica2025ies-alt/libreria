import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { User, Book, UserRole } from './types';
import * as storage from './services/storageService';
import { generateBookMetadata } from './services/geminiService';
import { Loader2, Plus, Edit2, Trash2, Search, Wand2, UserPlus, BookOpen, Link as LinkIcon, ExternalLink, Image as ImageIcon, Filter } from 'lucide-react';

// --- CONSTANTS ---
const COMMON_CATEGORIES = [
  "Ficción", "No Ficción", "Ciencia Ficción", "Fantasía", "Misterio", 
  "Terror", "Romance", "Historia", "Biografía", "Ciencia", 
  "Tecnología", "Negocios", "Autoayuda", "Salud", "Infantil", 
  "Arte", "Cocina", "Viajes", "Religión", "Política"
];

// --- SUB-COMPONENTS ---

// 1. Auth Page (Login/Register)
const AuthPage: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const user = await storage.loginUser(email, password);
        if (user) {
          onLogin(user);
        } else {
          setError('Credenciales inválidas o error de conexión');
        }
      } else {
        if (!email || !password || !name) {
          setError('Todos los campos son obligatorios');
          setLoading(false);
          return;
        }
        
        // Check existing via logic handled mostly by DB constraints, but here manually
        const existingUsers = await storage.getUsers();
        if (existingUsers.some(u => u.email === email)) {
          setError('El email ya está registrado');
          setLoading(false);
          return;
        }

        const newUser: User = {
          id: crypto.randomUUID(),
          name,
          email,
          password,
          role: UserRole.USER,
          createdAt: new Date().toISOString()
        };
        await storage.saveUser(newUser);
        onLogin(newUser);
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Asegúrate de que las tablas en Supabase existan.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">Librería IA</h1>
          <p className="text-slate-500 mt-2">{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-500/30 flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 font-semibold hover:underline"
          >
            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Book Modal (Add/Edit)
const BookModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (book: Book) => Promise<void>;
  initialBook?: Book | null;
  currentUserId: string;
}> = ({ isOpen, onClose, onSave, initialBook, currentUserId }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState(1);
  const [bookUrl, setBookUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialBook) {
      setTitle(initialBook.title);
      setAuthor(initialBook.author);
      setDescription(initialBook.description);
      setCategory(initialBook.category);
      setStock(initialBook.stock);
      setBookUrl(initialBook.bookUrl || '');
      setCoverUrl(initialBook.coverUrl || '');
    } else {
      resetForm();
    }
  }, [initialBook, isOpen]);

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setDescription('');
    setCategory('');
    setStock(1);
    setBookUrl('');
    setCoverUrl('');
  };

  const handleGenerate = async () => {
    if (!title || !author) return;
    setIsGenerating(true);
    try {
      const data = await generateBookMetadata(title, author);
      setDescription(data.description);
      setCategory(data.category);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const book: Book = {
      id: initialBook?.id || crypto.randomUUID(),
      title,
      author,
      description,
      category,
      stock,
      bookUrl,
      // Use provided cover URL or generate a random one if empty
      coverUrl: coverUrl || `https://picsum.photos/seed/${encodeURIComponent(title)}/300/400`,
      addedBy: initialBook?.addedBy || currentUserId
    };
    await onSave(book);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            {initialBook ? 'Editar Libro' : 'Nuevo Libro'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Título</label>
                <input
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Autor</label>
                <input
                  required
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* AI Generation Button */}
            {!initialBook && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !title || !author}
                className="w-full flex items-center justify-center py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md text-sm font-medium disabled:opacity-50 hover:shadow-lg transition"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Autocompletar con IA
              </button>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Categoría</label>
              <input
                list="categories-list"
                required
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Selecciona o escribe una categoría"
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <datalist id="categories-list">
                {COMMON_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Descripción</label>
              <textarea
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Cantidad</label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={e => setStock(parseInt(e.target.value))}
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* URL Inputs Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">URL de Portada (Imagen)</label>
                <div className="relative">
                    <input
                        type="url"
                        value={coverUrl}
                        onChange={e => setCoverUrl(e.target.value)}
                        placeholder="https://.../imagen.jpg"
                        className="w-full mt-1 p-2 pl-8 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <ImageIcon className="w-4 h-4 absolute left-2.5 top-3.5 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Dejar vacío para generar automáticamente</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">URL del Libro (PDF/Web)</label>
                <div className="relative">
                    <input
                        type="url"
                        value={bookUrl}
                        onChange={e => setBookUrl(e.target.value)}
                        placeholder="https://.../libro.pdf"
                        className="w-full mt-1 p-2 pl-8 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <LinkIcon className="w-4 h-4 absolute left-2.5 top-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md">Cancelar</button>
              <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center">
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// 3. User Modal (Admin adds user)
const UserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => Promise<void>;
  initialUser?: User | null;
}> = ({ isOpen, onClose, onSave, initialUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setName(initialUser.name);
      setEmail(initialUser.email);
      setRole(initialUser.role);
      setPassword(initialUser.password || '');
    } else {
      setName('');
      setEmail('');
      setRole(UserRole.USER);
      setPassword('');
    }
  }, [initialUser, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const user: User = {
      id: initialUser?.id || crypto.randomUUID(),
      name,
      email,
      role,
      password: password, 
      createdAt: initialUser?.createdAt || new Date().toISOString()
    };
    await onSave(user);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">{initialUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full p-2 border rounded" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} required />
          <input className="w-full p-2 border rounded" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full p-2 border rounded" type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
          <select className="w-full p-2 border rounded" value={role} onChange={e => setRole(e.target.value as UserRole)}>
            <option value={UserRole.USER}>Usuario</option>
            <option value={UserRole.ADMIN}>Administrador</option>
          </select>
          <div className="flex justify-end gap-3 pt-4">
             <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600">Cancelar</button>
             <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center">
               {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
               Guardar
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- MAIN APP ---

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState('user-home'); 
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Modal States
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Load Data on Mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoadingData(true);
    const [fetchedBooks, fetchedUsers] = await Promise.all([
      storage.getBooks(),
      storage.getUsers()
    ]);
    setBooks(fetchedBooks);
    setUsers(fetchedUsers);
    setIsLoadingData(false);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView(loggedInUser.role === UserRole.ADMIN ? 'admin-books' : 'user-home');
    refreshData(); // Fetch fresh data on login
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
    setBooks([]); // Clear data
    setUsers([]);
    setSearchTerm('');
    setSelectedCategory('Todas');
  };

  // CRUD Handlers
  const handleSaveBook = async (book: Book) => {
    await storage.saveBook(book);
    await refreshData();
  };

  const handleDeleteBook = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este libro?')) {
      await storage.deleteBook(id);
      await refreshData();
    }
  };

  const handleSaveUser = async (u: User) => {
    await storage.saveUser(u);
    await refreshData();
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('¿Eliminar usuario?')) {
      await storage.deleteUser(id);
      await refreshData();
    }
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  // Filter books
  const filteredBooks = books.filter(b => {
    const matchesSearch = 
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Todas' || b.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Extract unique categories from actual books for the filter dropdown
  const availableCategories = Array.from(new Set(books.map(b => b.category).filter(Boolean))).sort();

  return (
    <Layout user={user} onLogout={handleLogout} currentView={view} onChangeView={setView}>
      
      {isLoadingData && (
        <div className="fixed top-0 left-0 w-full h-1 bg-indigo-100 z-50">
          <div className="h-full bg-indigo-600 animate-pulse w-1/3 mx-auto"></div>
        </div>
      )}

      {/* 1. ADMIN BOOKS VIEW */}
      {view === 'admin-books' && user.role === UserRole.ADMIN && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Libros</h1>
            <button 
              onClick={() => { setEditingBook(null); setIsBookModalOpen(true); }}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Libro
            </button>
          </div>
          
          {books.length === 0 && !isLoadingData ? (
             <div className="text-center py-10 text-slate-500">
               <p>No hay libros en la base de datos de Supabase.</p>
               <p className="text-xs mt-2">Asegúrate de haber creado la tabla 'books'.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map(book => (
                <div key={book.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition">
                  <div className="h-48 overflow-hidden relative">
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                      {book.category}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-slate-800 truncate" title={book.title}>{book.title}</h3>
                    <p className="text-sm text-slate-500 mb-2">{book.author}</p>
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">{book.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-sm font-medium text-slate-600">Stock: {book.stock}</span>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingBook(book); setIsBookModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteBook(book.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. ADMIN USERS VIEW */}
      {view === 'admin-users' && user.role === UserRole.ADMIN && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">Usuarios del Sistema</h1>
            <button 
              onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Registrar Usuario
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Nombre</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Rol</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">{u.name}</td>
                      <td className="px-6 py-4 text-slate-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="text-blue-600 hover:underline">Editar</button>
                          {u.id !== user.id && ( // Prevent self-delete
                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:underline">Eliminar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. USER HOME VIEW */}
      {view === 'user-home' && (
        <div className="space-y-8">
          <div className="bg-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">Bienvenido a la Librería, {user.name}</h1>
              <p className="text-indigo-100 mb-6">Explora nuestra colección de títulos cuidadosamente seleccionados.</p>
              
              <div className="flex flex-col md:flex-row gap-4 max-w-2xl">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Buscar por título, autor..." 
                    className="w-full pl-12 pr-4 py-3 rounded-lg text-slate-900 focus:ring-4 focus:ring-indigo-400 outline-none shadow-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                </div>

                {/* Category Filter */}
                <div className="relative w-full md:w-48">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-10 pr-8 py-3 rounded-lg text-slate-900 focus:ring-4 focus:ring-indigo-400 outline-none shadow-xl appearance-none cursor-pointer"
                  >
                    <option value="Todas">Todas</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Filter className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

            </div>
            {/* Decorative background circle */}
            <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-indigo-500 rounded-full opacity-50 blur-3xl"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredBooks.length > 0 ? filteredBooks.map(book => (
              <div key={book.id} className="group bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                <div className="h-64 overflow-hidden relative rounded-t-xl bg-slate-200">
                   <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                   <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-indigo-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {book.category}
                   </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-xl text-slate-800 mb-1 leading-tight">{book.title}</h3>
                  <p className="text-sm font-medium text-slate-500 mb-3">{book.author}</p>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">{book.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <span className={`text-sm font-medium ${book.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {book.stock > 0 ? 'Disponible' : 'Agotado'}
                    </span>
                    {book.bookUrl ? (
                        <a 
                            href={book.bookUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition flex items-center"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Leer / Descargar
                        </a>
                    ) : (
                        <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed">
                            Sin Versión Digital
                        </button>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-12 text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No se encontraron libros en esta categoría.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <BookModal 
        isOpen={isBookModalOpen} 
        onClose={() => setIsBookModalOpen(false)} 
        onSave={handleSaveBook} 
        initialBook={editingBook}
        currentUserId={user.id}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        initialUser={editingUser}
      />
      
    </Layout>
  );
}

export default App;