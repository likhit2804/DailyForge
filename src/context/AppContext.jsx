import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import api from '../services/api';

const AppContext = createContext();

// Helper to format date as local YYYY-MM-DD without timezone shift
const formatDateLocal = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [habits, setHabits] = useState([]);
  const [tasks, setTasks] = useState({
    urgent_important: [],
    not_urgent_important: [],
    urgent_not_important: [],
    not_urgent_not_important: []
  });
  const [expenses, setExpenses] = useState([]);
  const [financeCategories, setFinanceCategories] = useState([]);
  const [taskCategories, setTaskCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [notes, setNotes] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [achievementCategories, setAchievementCategories] = useState([]);
  const [graphSpan, setGraphSpan] = useState('month');
  // Period navigation state for habits (shared across components)
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month, -1 = last month
  // Derived helpers
  const computeStreak = (completed = []) => {
    let streak = 0;
    for (let i = completed.length - 1; i >= 0; i--) {
      if (completed[i]) streak++; else break;
    }
    return streak;
  };

  // Helper to filter by time span
  const deriveAchievementCategories = useCallback((items = []) => {
    const unique = Array.from(new Set(items.map(item => (item.category || '').trim()).filter(Boolean)));
    return unique.length ? unique : ['General'];
  }, []);

  const normalizeAchievement = useCallback((doc = {}) => {
    const dateEarnedRaw = doc.dateEarned || doc.date_earned;
    const isoDate = dateEarnedRaw
      ? new Date(dateEarnedRaw).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    return {
      id: doc.id,
      title: doc.title || 'Untitled Achievement',
      description: doc.description || '',
      category: doc.category || '',
      dateEarned: isoDate,
      createdAt: doc.createdAt || doc.created_at,
      updatedAt: doc.updatedAt || doc.updated_at,
    };
  }, []);

  const filterBySpan = (arr, dateKey = 'date') => {
    const now = new Date();
    if (graphSpan === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return arr.filter(item => {
        const d = new Date(item[dateKey]);
        return d >= start && d <= end;
      });
    } else if (graphSpan === 'month') {
      return arr.filter(item => {
        const d = new Date(item[dateKey]);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (graphSpan === 'year') {
      return arr.filter(item => {
        const d = new Date(item[dateKey]);
        return d.getFullYear() === now.getFullYear();
      });
    }
    return arr;
  };

  const filterAchievementsByDate = useCallback((date) => {
    if (!date) return [];
    const isoTarget = typeof date === 'string'
      ? date
      : formatDateLocal(date);
    return achievements.filter(item => item.dateEarned === isoTarget);
  }, [achievements]);

  // Mark task complete
  const markTaskComplete = (quadrant, taskId) => {
    setTasks(prev => {
      const updated = { ...prev };
      const idx = updated[quadrant].findIndex(t => t.id === taskId);
      if (idx === -1) return prev;
      const task = updated[quadrant][idx];
      const newTask = { ...task, completed: !task.completed };
      updated[quadrant] = updated[quadrant].map(t => t.id === taskId ? newTask : t);
      updateTaskRemote(taskId, quadrant, newTask);
      return updated;
    });
  };

  // Move task between quadrants
  const moveTask = (fromQuadrant, taskId, toQuadrant) => {
    setTasks(prev => {
      const taskToMove = prev[fromQuadrant].find(t => t.id === taskId);
      if (!taskToMove || fromQuadrant === toQuadrant) return prev;
      const updatedTask = { ...taskToMove, quadrant: toQuadrant };
      const next = {
        ...prev,
        [fromQuadrant]: prev[fromQuadrant].filter(t => t.id !== taskId),
        [toQuadrant]: [...prev[toQuadrant], updatedTask]
      };
      updateTaskRemote(taskId, toQuadrant, updatedTask);
      return next;
    });
  };

  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedFromQuadrant, setDraggedFromQuadrant] = useState(null);

  // Drag event handlers
  const handleDragStart = (quadrant, task) => {
    setDraggedTask(task);
    setDraggedFromQuadrant(quadrant);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (toQuadrant) => {
    if (draggedTask && draggedFromQuadrant && toQuadrant !== draggedFromQuadrant) {
      moveTask(draggedFromQuadrant, draggedTask.id, toQuadrant);
    }
    setDraggedTask(null);
    setDraggedFromQuadrant(null);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const avgStreak = habits.length ? Math.round(habits.reduce((sum, h) => sum + (h.streak ?? computeStreak(h.completed || [])), 0) / habits.length) : 0;

  const checkAuthStatus = useCallback(async () => {
    try {
      const user = await api.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        await reloadAll();
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Initialize authentication and load data
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (username, password) => {
    await api.login({ username, password });
    await checkAuthStatus();
    return true;
  };

  const register = async (userData) => {
    await api.register(userData);
    await checkAuthStatus();
    return true;
  };

  const logout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setHabits([]);
      setTasks({
        urgent_important: [],
        not_urgent_important: [],
        urgent_not_important: [],
        not_urgent_not_important: []
      });
      setExpenses([]);
      setFinanceCategories([]);
      setTaskCategories([]);
      setNotes([]);
      setAchievements([]);
      setAchievementCategories([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const reloadAll = useCallback(async () => {
    console.log('🔁 AppContext.reloadAll: starting full data reload');
    let mounted = true;
    async function load() {
      try {
        const [hb, ex, nt, ac] = await Promise.allSettled([
          api.getHabits(),
          api.getExpenses(),
          api.getNotes(),
          api.getAchievements(),
        ]);

        console.log('📦 reloadAll Promise.allSettled results:', { hb, ex, nt });

        if (mounted && hb.status === 'fulfilled') {
          console.log('✅ reloadAll: raw habits from API:', hb.value);
          // Map backend habits to frontend shape, including date-based logs
          const mapped = hb.value.map(h => {
            const createdAt = h.created_at || h.createdAt || new Date().toISOString().split('T')[0];
            const completedArr = Array.isArray(h.completed) && h.completed.length ? h.completed : Array(7).fill(false);
            const completedByDate = (h.completed_by_date && typeof h.completed_by_date === 'object') ? h.completed_by_date : {};
            const habit = {
              id: h.id,
              name: h.name,
              frequency: h.frequency || 1,
              createdAt,
              completed: completedArr,
              completedByDate,
              streak: computeStreak(completedArr)
            };
            console.log('🧩 reloadAll: mapped habit:', habit);
            return habit;
          });
          console.log('📊 reloadAll: setting habits state with', mapped.length, 'items');
          setHabits(mapped);
        } else if (mounted) {
          console.warn('⚠️ reloadAll: habits load failed or not fulfilled', hb);
        }

        if (mounted && ex.status === 'fulfilled') {
          // Map backend expenses to frontend shape
          const mapped = ex.value.map(e => ({
            id: e.id,
            category: e.category_name || e.title || 'Other',
            categoryId: e.category,
            amount: Number(e.amount),
            date: e.date || new Date().toISOString().split('T')[0],
            time: e.time || '',
            description: e.description || '',
            isRecurring: e.is_recurring || false
          }));
          setExpenses(mapped);
        }

        if (mounted && nt.status === 'fulfilled') {
          console.log('✅ reloadAll: notes from API:', nt.value);
          setNotes(Array.isArray(nt.value) ? nt.value : []);
        }

        if (mounted && ac.status === 'fulfilled') {
          const mapped = (Array.isArray(ac.value) ? ac.value : []).map(normalizeAchievement);
          setAchievements(mapped);
          setAchievementCategories(deriveAchievementCategories(mapped));
        }
      } catch (err) {
        // ignore - keep defaults
        console.warn('💥 reloadAll: Failed loading remote data', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Load data when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      reloadAll();
    }
  }, [isAuthenticated]);

  // Load categories when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let mounted = true;
    (async () => {
      try {
        const cats = await api.getFinanceCategories();
        if (mounted && Array.isArray(cats)) {
          // Keep backend finance categories and UI categories in sync
          setFinanceCategories(cats);
          setCategories(cats);
        }
      } catch (error) {
        console.warn('Failed to load finance categories:', error);
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let mounted = true;
    (async () => {
      try {
        const cats = await api.getTaskCategories();
        if (mounted && Array.isArray(cats)) setTaskCategories(cats);
      } catch (error) {
        console.warn('Failed to load task categories:', error);
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);



  // Load quadrant tasks (Eisenhower matrix) once and group by quadrant
  // Uses dedicated /quadrant-tasks/ API so it doesn't conflict with Todo tasks
  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;
    (async () => {
      try {
        const all = await api.getQuadrantTasks();
        if (!mounted || !Array.isArray(all)) return;
        const grouped = {
          urgent_important: [],
          not_urgent_important: [],
          urgent_not_important: [],
          not_urgent_not_important: []
        };

        all.forEach(t => {
          const q = t.quadrant || 'urgent_important';
          if (grouped[q]) {
            grouped[q].push({
              id: t.id,
              text: t.text,
              quadrant: q,
              deadline: t.deadline || null,
              time: t.time || null,
              completed: !!t.completed,
              created_at: t.created_at,
            });
          }
        });

        setTasks(grouped);
      } catch (err) {
        console.warn('Failed to load quadrant tasks', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  // Sync helpers that call API and update local state
  const addHabitRemote = async (name, frequency = 1) => {
    console.log('➕ addHabitRemote: called with', { name, frequency });
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = { name, frequency, created_at: today };
      console.log('📤 addHabitRemote: payload to API.createHabit:', payload);
      const created = await api.createHabit(payload);
      console.log('📥 addHabitRemote: response from API.createHabit:', created);

      const habit = {
        id: created.id,
        name: created.name,
        frequency: created.frequency || frequency,
        createdAt: created.created_at || today,
        completed: Array(7).fill(false),
        completedByDate: created.completed_by_date || created.completedByDate || {}
      };
      console.log('🧩 addHabitRemote: mapped habit to store:', habit);
      setHabits(prev => {
        const next = [...prev, habit];
        console.log('🧮 addHabitRemote: new habits length:', next.length);
        return next;
      });
      return habit;
    } catch (err) {
      console.warn('💥 addHabitRemote error', err);
      return null;
    }
  };

  const toggleHabitRemote = async (habitId, dayOrDate, value) => {
    console.log('🔁 toggleHabitRemote: called with', { habitId, dayOrDate, value });
    // Support both index-based and date-based toggles; prefer date-based
    const isDateStr = typeof dayOrDate === 'string' && dayOrDate.includes('-');
    const updater = (h) => {
      if (h.id !== habitId) return h;
      const next = { ...h };
      console.log('  🔍 toggleHabitRemote.updater: before update:', h);
      if (isDateStr) {
        next.completedByDate = { ...(h.completedByDate || {}) };
        next.completedByDate[dayOrDate] = !!value;
      } else {
        const completed = [...(h.completed || [])];
        completed[dayOrDate] = value;
        next.completed = completed;
      }
      const arr = next.completed || [];
      next.streak = computeStreak(arr);
      console.log('  ✅ toggleHabitRemote.updater: after update:', next);
      return next;
    };

    setHabits(prev => {
      console.log('🧮 toggleHabitRemote: updating habits state');
      const next = prev.map(updater);
      console.log('🧮 toggleHabitRemote: updated habits snapshot:', next);
      return next;
    });

    try {
      if (isDateStr) {
        console.log('🌐 toggleHabitRemote: calling api.toggleHabitByDate with', { habitId, date: dayOrDate, value });
        await api.toggleHabitByDate(habitId, dayOrDate, value);
      } else {
        console.log('🌐 toggleHabitRemote: calling api.toggleHabit (index-based) with', { habitId, index: dayOrDate, value });
        await api.toggleHabit(habitId, dayOrDate, value);
      }
      console.log('✅ toggleHabitRemote: API call succeeded');
    } catch (err) {
      console.warn('💥 toggleHabitRemote error', err);
    }
  };

  const deleteHabitRemote = async (habitId) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    try { await api.deleteHabit(habitId); } catch (err) { console.warn(err); }
  };

  const addExpenseRemote = async (expense) => {
    // expense: { category (ID or name), amount, date, description, isRecurring, title }
    try {
      // If category is a name, find the ID
      let categoryId = expense.category;
      if (typeof categoryId === 'string') {
        const cat = financeCategories.find(c => c.name === categoryId);
        if (!cat) {
          console.warn(`Category "${categoryId}" not found`);
          return null;
        }
        categoryId = cat.id;
      }
      
      const payload = { 
        category: categoryId,
        title: expense.title || expense.description || 'Expense', 
        amount: expense.amount, 
        date: expense.date, 
        description: expense.description || '', 
        is_recurring: !!expense.isRecurring 
      };
      const created = await api.createExpense(payload);
      const item = { ...expense, id: created.id, date: created.date || expense.date, category: created.category };
      setExpenses(prev => [...prev, item]);
      return item;
    } catch (err) {
      console.warn('addExpenseRemote error', err);
      return null;
    }
  };

  const deleteExpenseRemote = async (expenseId) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    try { await api.deleteExpense(expenseId); } catch (err) { console.warn(err); }
  };

  const updateExpenseRemote = async (expenseId, payload) => {
    try {
      // If category is a name, find the ID
      let categoryId = payload.category;
      if (typeof categoryId === 'string') {
        const cat = financeCategories.find(c => c.name === categoryId);
        if (cat) {
          categoryId = cat.id;
        }
      }
      
      const updateData = { 
        category: categoryId,
        title: payload.title || payload.description || 'Expense',
        amount: payload.amount, 
        date: payload.date, 
        description: payload.description || '', 
        is_recurring: !!payload.isRecurring 
      };
      const updated = await api.updateExpense(expenseId, updateData);
      setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, ...payload, id: updated.id, category: updated.category } : e));
      return updated;
    } catch (err) {
      console.warn('updateExpenseRemote error', err);
      return null;
    }
  };

  const updateHabitRemote = async (habitId, payload) => {
    try {
      const updated = await api.updateHabit(habitId, { name: payload.name, frequency: payload.frequency, created_at: payload.createdAt, completed: payload.completed });
      setHabits(prev => prev.map(h => h.id === habitId ? { ...h, ...payload, streak: computeStreak(payload.completed || h.completed) } : h));
      return updated;
    } catch (err) {
      console.warn('updateHabitRemote error', err);
      return null;
    }
  };

  const addNoteRemote = async (note) => {
    try {
      const created = await api.createNote(note);
      setNotes(prev => [...prev, created]);
      return created;
    } catch (err) {
      console.warn('addNoteRemote error', err);
      return null;
    }
  };

  const updateNoteRemote = async (noteId, payload) => {
    try {
      const updated = await api.updateNote(noteId, payload);
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...payload } : n));
      return updated;
    } catch (err) {
      console.warn('updateNoteRemote error', err);
      return null;
    }
  };

  const deleteNoteRemote = async (noteId) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    try { await api.deleteNote(noteId); } catch (err) { console.warn(err); }
  };

  const addAchievementRemote = async (achievement) => {
    try {
      const payload = {
        title: achievement.title,
        description: achievement.description || '',
        category: achievement.category || '',
        date_earned: achievement.dateEarned || achievement.date_earned,
      };
      const created = await api.createAchievement(payload);
      const normalized = normalizeAchievement(created);
      setAchievements(prev => {
        const next = [...prev, normalized];
        setAchievementCategories(deriveAchievementCategories(next));
        return next;
      });
      return normalized;
    } catch (err) {
      console.warn('addAchievementRemote error', err);
      return null;
    }
  };

  const updateAchievementRemote = async (achievementId, payload) => {
    try {
      const updateData = {
        title: payload.title,
        description: payload.description || '',
        category: payload.category || '',
        date_earned: payload.dateEarned || payload.date_earned,
      };
      const updated = await api.updateAchievement(achievementId, updateData);
      const normalized = normalizeAchievement({ ...updated, id: achievementId });
      setAchievements(prev => {
        const next = prev.map(item => (item.id === achievementId ? normalized : item));
        setAchievementCategories(deriveAchievementCategories(next));
        return next;
      });
      return normalized;
    } catch (err) {
      console.warn('updateAchievementRemote error', err);
      return null;
    }
  };

  const deleteAchievementRemote = async (achievementId) => {
    setAchievements(prev => {
      const next = prev.filter(item => item.id !== achievementId);
      setAchievementCategories(deriveAchievementCategories(next));
      return next;
    });
    try {
      await api.deleteAchievement(achievementId);
    } catch (err) {
      console.warn('deleteAchievementRemote error', err);
    }
  };

  // Category helpers
  const saveFinanceCategoriesRemote = async (cats) => {
    try {
      // Note: This assumes a bulk update endpoint exists
      // For now, we'll just update local state
      setFinanceCategories(cats);
      setCategories(cats);
      return cats;
    } catch (err) {
      console.warn('saveFinanceCategoriesRemote error', err);
      return null;
    }
  };

  // Finance category management
  const addFinanceCategoryRemote = async (categoryData) => {
    try {
      const created = await api.createFinanceCategory({ name: categoryData.name, color: categoryData.color || '#3b82f6', budget: categoryData.budget || 0 });
      const newCat = { id: created.id, name: created.name, color: created.color, budget: created.budget || 0 };
      setFinanceCategories(prev => [...prev, newCat]);
      setCategories(prev => [...prev, newCat]);
      return newCat;
    } catch (err) {
      console.warn('addFinanceCategoryRemote error', err);
      return null;
    }
  };

  const updateFinanceCategoryRemote = async (categoryId, categoryData) => {
    try {
      const updated = await api.updateFinanceCategory(categoryId, categoryData);
      setFinanceCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...updated } : c));
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...updated } : c));
      return updated;
    } catch (err) {
      console.warn('updateFinanceCategoryRemote error', err);
      return null;
    }
  };

  const deleteFinanceCategoryRemote = async (categoryId) => {
    try {
      await api.deleteFinanceCategory(categoryId);
      setFinanceCategories(prev => prev.filter(c => c.id !== categoryId));
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    } catch (err) {
      console.warn('deleteFinanceCategoryRemote error', err);
    }
  };

  // Task category management
  const addTaskCategoryRemote = async (categoryData) => {
    try {
      const created = await api.createTaskCategory({ name: categoryData.name, color: categoryData.color || '#3b82f6' });
      const newCat = { id: created.id, name: created.name, color: created.color };
      setTaskCategories(prev => [...prev, newCat]);
      return newCat;
    } catch (err) {
      console.warn('addTaskCategoryRemote error', err);
      return null;
    }
  };

  const updateTaskCategoryRemote = async (categoryId, categoryData) => {
    try {
      const updated = await api.updateTaskCategory(categoryId, categoryData);
      setTaskCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...updated } : c));
      return updated;
    } catch (err) {
      console.warn('updateTaskCategoryRemote error', err);
      return null;
    }
  };

  const deleteTaskCategoryRemote = async (categoryId) => {
    try {
      await api.deleteTaskCategory(categoryId);
      setTaskCategories(prev => prev.filter(c => c.id !== categoryId));
    } catch (err) {
      console.warn('deleteTaskCategoryRemote error', err);
    }
  };

  // Legacy helper used by Expenses feature to persist UI categories.
  // Currently this just keeps `categories` and `financeCategories` in sync
  // without making extra API calls beyond the per-category endpoints.
  const saveCategoriesRemote = async (cats) => {
    try {
      setCategories(cats);
      setFinanceCategories(cats);
      return cats;
    } catch (err) {
      console.warn('saveCategoriesRemote error', err);
      return null;
    }
  };

  const saveTaskCategoriesRemote = async (cats) => {
    try {
      // Note: This assumes a bulk update endpoint exists
      // For now, we'll just update local state
      setTaskCategories(cats);
      return cats;
    } catch (err) {
      console.warn('saveTaskCategoriesRemote error', err);
      return null;
    }
  };

  // Quadrant task helpers (Eisenhower matrix) - backed by /quadrant-tasks/
  const addTaskRemote = async (task) => {
    try {
      const created = await api.createQuadrantTask({
        text: task.text,
        quadrant: task.quadrant,
        deadline: task.deadline || null,
        time: task.time || null,
        completed: !!task.completed,
      });
      setTasks(prev => ({
        ...prev,
        [created.quadrant]: [
          ...prev[created.quadrant],
          {
            id: created.id,
            text: created.text,
            quadrant: created.quadrant,
            deadline: created.deadline || null,
            time: created.time || null,
            completed: !!created.completed,
            created_at: created.created_at,
          },
        ],
      }));
      return created;
    } catch (err) {
      console.warn('addTaskRemote error', err);
      return null;
    }
  };

  const updateTaskRemote = async (taskId, quadrant, payload) => {
    try {
      const updated = await api.updateQuadrantTask(taskId, {
        text: payload.text,
        quadrant: payload.quadrant,
        deadline: payload.deadline || null,
        time: payload.time || null,
        completed: !!payload.completed,
      });
      setTasks(prev => ({
        ...prev,
        [quadrant]: prev[quadrant].map(t =>
          t.id === taskId
            ? {
                ...t,
                text: updated.text,
                quadrant: updated.quadrant,
                deadline: updated.deadline || null,
                time: updated.time || null,
                completed: !!updated.completed,
              }
            : t
        ),
      }));
      return updated;
    } catch (err) {
      console.warn('updateTaskRemote error', err);
      return null;
    }
  };

  const deleteTaskRemote = async (quadrant, taskId) => {
    setTasks(prev => ({
      ...prev,
      [quadrant]: prev[quadrant].filter(t => t.id !== taskId)
    }));
    try {
      await api.deleteQuadrantTask(taskId);
    } catch (err) {
      console.warn(err);
    }
  };

  const value = {
    // Authentication
    currentUser,
    isAuthenticated,
    authLoading,
    login,
    register,
    logout,
    checkAuthStatus,
    habits,
    setHabits,
    tasks,
    setTasks,
    expenses,
    setExpenses,
    financeCategories,
    setFinanceCategories,
    taskCategories,
    setTaskCategories,
    categories,
    setCategories,
    notes,
    setNotes,
    achievements,
    setAchievements,
    achievementCategories,
    setAchievementCategories,
    graphSpan,
    setGraphSpan,
    weekOffset,
    setWeekOffset,
    monthOffset,
    setMonthOffset,
    filterBySpan,
    markTaskComplete,
    moveTask,
    handleDragStart,
    handleDragOver,
    handleDrop,
    totalExpenses,
    avgStreak,
    // Remote-enabled helpers
    addHabitRemote,
    toggleHabitRemote,
    deleteHabitRemote,
    addExpenseRemote,
    deleteExpenseRemote,
    updateExpenseRemote,
    updateHabitRemote,
    addNoteRemote,
    updateNoteRemote,
    deleteNoteRemote,
    addAchievementRemote,
    updateAchievementRemote,
    deleteAchievementRemote,
    filterAchievementsByDate,
    // Categories
    saveFinanceCategoriesRemote,
    saveCategoriesRemote,
    saveTaskCategoriesRemote,
    addFinanceCategoryRemote,
    updateFinanceCategoryRemote,
    deleteFinanceCategoryRemote,
    addTaskCategoryRemote,
    updateTaskCategoryRemote,
    deleteTaskCategoryRemote,
    // Tasks
    addTaskRemote,
    updateTaskRemote,
    deleteTaskRemote
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProvider;
