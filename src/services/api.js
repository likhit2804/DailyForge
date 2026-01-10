// Switch to Django backend API calls
// Use relative URL for production deployment
const API_BASE = '/api';

// Helper to build a correct full URL regardless of leading/trailing slashes
const buildUrl = (endpoint) => `${API_BASE}${endpoint && endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

// CSRF token handling
const getCSRFToken = () => {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        console.log('🔑 Found CSRF cookie:', cookieValue);
        break;
      }
    }
  }
  return cookieValue;
};

// Initialize CSRF token by hitting the endpoint so Django sets the cookie
const initializeCSRF = async () => {
  try {
    const url = buildUrl('/auth/csrf/');
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    // log response headers (CORS related)
    try { console.log('headers:', Object.fromEntries(response.headers.entries())); } catch (e) {}
    
  } catch (error) {
    console.warn('CSRF initialization error:', error);
  }
};

// Call initializeCSRF on module load
initializeCSRF();

const request = async (method, endpoint, data = null) => {
  const url = buildUrl(endpoint);
  console.log(`🔗 Full URL: ${url}`);
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (method !== 'GET' && method !== 'HEAD') {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    } else {
      console.warn(`No CSRF token found for ${method} ${endpoint}`);
    }
  }

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    let responseData = {};
    try {
      responseData = await response.json();
    } catch (e) {
      // try to get text for debugging
      try {
        const text = await response.text();
      } catch (te) {}
    }

    
    if (!response.ok) {
      console.error(`❌ API Error: ${method} ${endpoint}`, {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      throw new Error(responseData.detail || responseData.error || `HTTP ${response.status}`);
    }
    return responseData;
  } catch (error) {
    console.error(`💥 API request failed: ${method} ${endpoint}`, error);
    try { console.log('📤 Last request config for debugging:', config); } catch (e) {}
    throw error;
  }
};

// Authentication
export const register = async ({ username, email, password, name }) => {
  const result = await request('POST', '/auth/register/', { username, email, password, name });
  // Initialize CSRF token after register
  await initializeCSRF();
  return result;
};

export const login = async ({ username, password }) => {
  
  const result = await request('POST', '/auth/login/', { username, password });

  // Initialize CSRF token after login
  await initializeCSRF();
  return result;
};

export const logout = async () => {
  return request('POST', '/auth/logout/');
};

export const getCurrentUser = async () => {
  const result = await request('GET', '/auth/user/');
  return result;
};

// Habits
export const getHabits = async () => {
  return request('GET', 'habits/');
};

export const createHabit = async (habitData) => {
  return request('POST', 'habits/', habitData);
};

export const updateHabit = async (habitId, habitData) => {
  return request('PATCH', `habits/${habitId}/`, habitData);
};

export const deleteHabit = async (habitId) => {
  return request('DELETE', `habits/${habitId}/`);
};

export const toggleHabit = async (habitId, date) => {
  console.log('🛰️ api.toggleHabit (index-based likely) called with:', { habitId, date });
  return request('POST', `habits/${habitId}/toggle/`, { date });
};

// Explicit date-based toggle (used by AppContext.toggleHabitRemote)
export const toggleHabitByDate = async (habitId, date, value = true) => {
  console.log('🛰️ api.toggleHabitByDate called with:', { habitId, date, value });
  return request('POST', `habits/${habitId}/toggle/`, { date, value });
};

// Expenses
export const getExpenses = async () => {
  return request('GET', 'expenses/');
};

export const createExpense = async (expenseData) => {
  return request('POST', 'expenses/', expenseData);
};

export const updateExpense = async (expenseId, expenseData) => {
  return request('PATCH', `expenses/${expenseId}/`, expenseData);
};

export const deleteExpense = async (expenseId) => {
  return request('DELETE', `expenses/${expenseId}/`);
};

// Categories
export const getFinanceCategories = async () => {
  const docs = await request('GET', 'finance-categories/');
  return Array.isArray(docs) ? docs : [];
};

export const createFinanceCategory = async (categoryData) => {
  console.log('📁 Creating category:', categoryData);
  const result = await request('POST', 'finance-categories/', categoryData);
  console.log('✅ Category created:', result);
  return result;
};

export const updateFinanceCategory = async (categoryId, categoryData) => {
  return request('PATCH', `finance-categories/${categoryId}/`, categoryData);
};

export const deleteFinanceCategory = async (categoryId) => {
  return request('DELETE', `finance-categories/${categoryId}/`);
};

export const getTaskCategories = async () => {
  const docs = await request('GET', 'task-categories/');
  return Array.isArray(docs) ? docs : [];
};

export const createTaskCategory = async (categoryData) => {
  return request('POST', 'task-categories/', categoryData);
};

export const updateTaskCategory = async (categoryId, categoryData) => {
  return request('PATCH', `task-categories/${categoryId}/`, categoryData);
};

export const deleteTaskCategory = async (categoryId) => {
  return request('DELETE', `task-categories/${categoryId}/`);
};

// Tasks
export const getTasks = async () => {
  const docs = await request('GET', 'tasks/');
  return Array.isArray(docs) ? docs : [];
};

export const createTask = async (taskData) => {
  return request('POST', 'tasks/', taskData);
};

export const updateTask = async (taskId, taskData) => {
  return request('PATCH', `tasks/${taskId}/`, taskData);
};

export const deleteTask = async (taskId) => {
  return request('DELETE', `tasks/${taskId}/`);
};

// Quadrant Tasks (Eisenhower matrix) - kept separate from Todo tasks
export const getQuadrantTasks = async () => {
  const docs = await request('GET', 'quadrant-tasks/');
  return Array.isArray(docs) ? docs : [];
};

export const createQuadrantTask = async (taskData) => {
  // taskData: { text, quadrant, deadline?, time?, completed? }
  return request('POST', 'quadrant-tasks/', taskData);
};

export const updateQuadrantTask = async (taskId, taskData) => {
  return request('PATCH', `quadrant-tasks/${taskId}/`, taskData);
};

export const deleteQuadrantTask = async (taskId) => {
  return request('DELETE', `quadrant-tasks/${taskId}/`);
};

// Notes
export const getNotes = async () => {
  return request('GET', 'notes/');
};

export const createNote = async (noteData) => {
  return request('POST', 'notes/', noteData);
};

export const updateNote = async (noteId, noteData) => {
  return request('PATCH', `notes/${noteId}/`, noteData);
};

export const deleteNote = async (noteId) => {
  return request('DELETE', `notes/${noteId}/`);
};

// Default export aggregating all API helpers for existing imports
const api = {
  register,
  login,
  logout,
  getCurrentUser,
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabit,
  toggleHabitByDate,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getFinanceCategories,
  createFinanceCategory,
  updateFinanceCategory,
  deleteFinanceCategory,
  getTaskCategories,
  createTaskCategory,
  updateTaskCategory,
  deleteTaskCategory,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getQuadrantTasks,
  createQuadrantTask,
  updateQuadrantTask,
  deleteQuadrantTask,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
};

export default api;
