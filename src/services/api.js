// Switch to Django backend API calls
const API_BASE = 'http://localhost:8000/api';

// Helper to build a correct full URL regardless of leading/trailing slashes
const buildUrl = (endpoint) => `${API_BASE}${endpoint && endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
console.log('🚀 API_BASE set to:', API_BASE);

// CSRF token handling
const getCSRFToken = () => {
  const name = 'csrftoken';
  let cookieValue = null;
  console.log('🔍 Looking for CSRF cookie...');
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
  if (!cookieValue) console.log('⚠️ No CSRF cookie found');
  return cookieValue;
};

// Initialize CSRF token by hitting the endpoint so Django sets the cookie
const initializeCSRF = async () => {
  try {
    const url = buildUrl('/auth/csrf/');
    console.log('➡️ initializeCSRF ->', url);
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    console.log('⬅️ initializeCSRF status:', response.status);
    // log response headers (CORS related)
    try { console.log('headers:', Object.fromEntries(response.headers.entries())); } catch (e) {}
    if (response.ok) {
      console.log('✅ CSRF token initialized (server set cookie if configured)');
      console.log('📥 document.cookie after init:', document.cookie);
    } else {
      console.warn('❌ Failed to initialize CSRF token, status:', response.status);
    }
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
    console.log(`🔄 Making ${method} request to: ${url}`);
    console.log('🧭 Request config:', config);
    console.log('📤 Request data:', data);
    console.log('🍪 CSRF token:', getCSRFToken());

    const response = await fetch(url, config);
    let responseData = {};
    try {
      responseData = await response.json();
    } catch (e) {
      console.warn('⚠️ Response JSON parse failed, falling back to empty object', e);
      // try to get text for debugging
      try {
        const text = await response.text();
        console.log('📜 Response text:', text);
      } catch (te) {}
    }

    console.log(`📥 Response status: ${response.status}`);
    console.log('📄 Response data:', responseData);
    
    if (!response.ok) {
      console.error(`❌ API Error: ${method} ${endpoint}`, {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      alert(`API Error: ${response.status} - ${responseData.detail || responseData.error || 'Unknown error'}`);
      throw new Error(responseData.detail || responseData.error || `HTTP ${response.status}`);
    }
    console.log(`✅ API Success: ${method} ${endpoint}`);
    return responseData;
  } catch (error) {
    console.error(`💥 API request failed: ${method} ${endpoint}`, error);
    try { console.log('📤 Last request config for debugging:', config); } catch (e) {}
    alert(`API Failed: ${error.message}`);
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
  console.log('🔐 Attempting login for:', username);
  alert(`🔐 Logging in as ${username}...`);
  const result = await request('POST', '/auth/login/', { username, password });
  console.log('✅ Login result:', result);
  alert(`✅ Login successful for ${username}`);
  // Initialize CSRF token after login
  await initializeCSRF();
  return result;
};

export const logout = async () => {
  return request('POST', '/auth/logout/');
};

export const getCurrentUser = async () => {
  console.log('👤 Checking current user...');
  alert('👤 Checking if you are logged in...');
  const result = await request('GET', '/auth/user/');
  console.log('✅ Current user result:', result);
  alert(`✅ You are logged in as ${result.username}`);
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
export const getCategories = async () => {
  const docs = await request('GET', 'categories/');
  return Array.isArray(docs) ? docs : [];
};

export const createCategory = async (categoryData) => {
  console.log('📁 Creating category:', categoryData);
  alert(`📁 Creating category: ${categoryData.name}`);
  const result = await request('POST', 'categories/', categoryData);
  console.log('✅ Category created:', result);
  alert(`✅ Category "${result.name}" created successfully!`);
  return result;
};

export const updateCategory = async (categoryId, categoryData) => {
  return request('PATCH', `categories/${categoryId}/`, categoryData);
};

export const deleteCategory = async (categoryId) => {
  return request('DELETE', `categories/${categoryId}/`);
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

// Timer Sessions
export const getTimerSessions = async () => {
  return request('GET', 'timer-sessions/');
};

export const createTimerSession = async (sessionData) => {
  return request('POST', 'timer-sessions/', sessionData);
};

export default {
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
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
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
  getTimerSessions,
  createTimerSession
};