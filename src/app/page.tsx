"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Calendar, Clock, Filter, Search, CalendarDays } from 'lucide-react';

interface Todo {
  _id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

const TodoApp: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Omit<Todo, '_id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: '',
    completed: false,
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0]
  });

  // Generate unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Load todos from memory state (simulating persistence)
  useEffect(() => {
    setIsLoading(true);
    // Simulate loading delay
    const timer = setTimeout(() => {
      // Initialize with empty array if no todos exist
      setTodos([]);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const createTodo = async (todo: Omit<Todo, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const newTodo: Todo = {
        ...todo,
        _id: generateId(),
        createdAt: now,
        updatedAt: now
      };
      
      setTodos(prev => [newTodo, ...prev]);
      resetForm();
    } catch (error) {
      console.error('Error creating todo:', error);
      alert('Gagal membuat task baru. Silakan coba lagi.');
    }
  };

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    try {
      const now = new Date().toISOString();
      setTodos(prev => prev.map(t => 
        t._id === id ? { ...t, ...updates, updatedAt: now } : t
      ));
      resetForm();
    } catch (error) {
      console.error('Error updating todo:', error);
      alert('Gagal mengupdate task. Silakan coba lagi.');
    }
  };

  const deleteTodo = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus task ini?')) {
      return;
    }

    try {
      setTodos(prev => prev.filter(t => t._id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Gagal menghapus task. Silakan coba lagi.');
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    await updateTodo(id, { completed });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      completed: false,
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0]
    });
    setEditingTodo(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    if (editingTodo) {
      await updateTodo(editingTodo._id, formData);
    } else {
      await createTodo(formData);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      priority: todo.priority,
      dueDate: todo.dueDate
    });
    setShowForm(true);
  };

  // Date filtering functions
  const isToday = (date: string) => {
    const today = new Date();
    const taskDate = new Date(date);
    return taskDate.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: string) => {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    const taskDate = new Date(date);
    
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);
    
    return taskDate >= weekStart && taskDate <= weekEnd;
  };

  const isThisMonth = (date: string) => {
    const today = new Date();
    const taskDate = new Date(date);
    return taskDate.getMonth() === today.getMonth() && taskDate.getFullYear() === today.getFullYear();
  };

  const isInCustomRange = (date: string) => {
    if (!customDateFrom && !customDateTo) return true;
    
    const taskDate = new Date(date);
    const fromDate = customDateFrom ? new Date(customDateFrom) : new Date('1970-01-01');
    const toDate = customDateTo ? new Date(customDateTo) : new Date('2099-12-31');
    
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    
    return taskDate >= fromDate && taskDate <= toDate;
  };

  const filteredTodos = todos
    .filter(todo => {
      // Status filter
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .filter(todo => {
      // Date filter based on createdAt
      switch (dateFilter) {
        case 'today':
          return isToday(todo.createdAt);
        case 'week':
          return isThisWeek(todo.createdAt);
        case 'month':
          return isThisMonth(todo.createdAt);
        case 'custom':
          return isInCustomRange(todo.createdAt);
        default:
          return true;
      }
    })
    .filter(todo =>
      // Text search
      todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string, completed: boolean) => {
    return !completed && new Date(dueDate) < new Date();
  };

  // Get counts for different date filters
  const getDateFilterCounts = () => {
    const todayCount = todos.filter(todo => isToday(todo.createdAt)).length;
    const weekCount = todos.filter(todo => isThisWeek(todo.createdAt)).length;
    const monthCount = todos.filter(todo => isThisMonth(todo.createdAt)).length;
    
    return { todayCount, weekCount, monthCount };
  };

  const { todayCount, weekCount, monthCount } = getDateFilterCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Daftar Kegiatan
          </h1>
          <p className="text-gray-600">atur kegiatan harian dengan lebih efisien</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{todos.length}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {todos.filter(t => t.completed).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {todos.filter(t => !t.completed).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Filtered</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredTodos.length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Filter className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <div className="space-y-4">
            {/* First Row: Add Task Button and Status Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-4 items-center w-full md:w-auto">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </button>
                
                <div className="flex gap-2">
                  {(['all', 'active', 'completed'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === f
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Second Row: Date Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filter by Created Date:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === 'all'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === 'today'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Today ({todayCount})
                </button>
                <button
                  onClick={() => setDateFilter('week')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === 'week'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  This Week ({weekCount})
                </button>
                <button
                  onClick={() => setDateFilter('month')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === 'month'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  This Month ({monthCount})
                </button>
                <button
                  onClick={() => setDateFilter('custom')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === 'custom'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Custom Range
                </button>
              </div>
            </div>

            {/* Third Row: Custom Date Range Inputs (shown when custom is selected) */}
            {dateFilter === 'custom' && (
              <div className="flex flex-col md:flex-row gap-4 items-center bg-blue-50 p-4 rounded-lg">
                <span className="text-sm font-medium text-blue-700">Custom Date Range:</span>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="From"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="To"
                  />
                  <button
                    onClick={() => {
                      setCustomDateFrom('');
                      setCustomDateTo('');
                    }}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingTodo ? 'Edit Task' : 'Add New Task'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Todo['priority'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSubmit}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                    >
                      {editingTodo ? 'Update Task' : 'Add Task'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Todo List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading tasks...</p>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {todos.length === 0 ? 'No tasks yet. Create your first task!' : 'No tasks found'}
              </p>
              {(dateFilter !== 'all' || searchTerm || filter !== 'all') && todos.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your filters or search terms
                </p>
              )}
            </div>
          ) : (
            filteredTodos.map(todo => (
              <div
                key={todo._id}
                className={`bg-white rounded-xl shadow-md border transition-all duration-200 hover:shadow-lg ${
                  todo.completed ? 'border-green-200' : isOverdue(todo.dueDate, todo.completed) ? 'border-red-200' : 'border-gray-100'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleComplete(todo._id, !todo.completed)}
                      className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        todo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-indigo-500'
                      }`}
                    >
                      {todo.completed && <Check className="h-3 w-3" />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`text-lg font-semibold ${
                          todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                          {todo.title}
                        </h3>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(todo.priority)}`}>
                            {todo.priority}
                          </span>
                          <button
                            onClick={() => startEdit(todo)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTodo(todo._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {todo.description && (
                        <p className={`text-gray-600 mb-3 ${todo.completed ? 'line-through' : ''}`}>
                          {todo.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span className={isOverdue(todo.dueDate, todo.completed) ? 'text-red-600' : ''}>
                            Due: {formatDate(todo.dueDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Created: {formatDateTime(todo.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoApp;