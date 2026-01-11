import React, { useState, useEffect } from 'react';
import EmptyState from '../../shared/components/EmptyState';
import { getTaskCategories, createTaskCategory, updateTaskCategory, deleteTaskCategory, getTasks, createTask, updateTask, deleteTask } from '../../services/api';

// Categories API
const categoriesApi = {
  getTaskCategories: async () => {
    const categories = await getTaskCategories();
    return categories.map(cat => ({
      id: cat.id.toString(),
      name: cat.name,
      icon: '📋', // Default icon
      color: cat.color || '#3b82f6',
      createdAt: new Date().toISOString() // Not stored in Django, use current time
    }));
  },
  
  createTaskCategory: async (categoryData) => {
    const newCat = await createTaskCategory({
      name: categoryData.name,
      color: categoryData.color || '#3b82f6'
    });
    return {
      id: newCat.id.toString(),
      name: newCat.name,
      icon: categoryData.icon || '📋',
      color: newCat.color,
      createdAt: new Date().toISOString()
    };
  },
  
  updateTaskCategory: async (categoryId, categoryData) => {
    const updatedCat = await updateTaskCategory(parseInt(categoryId), {
      name: categoryData.name,
      color: categoryData.color
    });
    return {
      id: updatedCat.id.toString(),
      name: updatedCat.name,
      icon: categoryData.icon || '📋',
      color: updatedCat.color,
      createdAt: new Date().toISOString()
    };
  },
  
  deleteTaskCategory: async (categoryId) => {
    await deleteTaskCategory(parseInt(categoryId));
    return { success: true };
  }
};

// Category Items API
const categoryItemsApi = {
  getTaskCategoryItems: async (categoryId) => {
    const allTasks = await getTasks();
    return allTasks
      .filter(task => task.category.toString() === categoryId)
      .map(task => ({
        id: task.id.toString(),
        categoryId: task.category.toString(),
        text: task.title,
        note: task.description || '',
        completed: task.completed,
        createdAt: task.created_at
      }));
  },
  
  getAllItems: async () => {
    const allTasks = await getTasks();
    return allTasks.map(task => ({
      id: task.id.toString(),
      categoryId: task.category.toString(),
      text: task.title,
      note: task.description || '',
      completed: task.completed,
      createdAt: task.created_at
    }));
  },
  
  createItem: async (itemData) => {
    const newTask = await createTask({
      category: parseInt(itemData.categoryId),
      title: itemData.text,
      description: itemData.note || '',
      completed: itemData.completed || false
    });
    return {
      id: newTask.id.toString(),
      categoryId: newTask.category.toString(),
      text: newTask.title,
      note: newTask.description || '',
      completed: newTask.completed,
      createdAt: newTask.created_at
    };
  },
  
  updateItem: async (itemId, itemData) => {
    const updateData = {};
    if (itemData.text !== undefined) updateData.title = itemData.text;
    if (itemData.note !== undefined) updateData.description = itemData.note;
    if (itemData.completed !== undefined) updateData.completed = itemData.completed;
    if (itemData.categoryId !== undefined) updateData.category = parseInt(itemData.categoryId);
    
    const updatedTask = await updateTask(parseInt(itemId), updateData);
    return {
      id: updatedTask.id.toString(),
      categoryId: updatedTask.category.toString(),
      text: updatedTask.title,
      note: updatedTask.description || '',
      completed: updatedTask.completed,
      createdAt: updatedTask.created_at
    };
  },
  
  deleteItem: async (itemId) => {
    await deleteTask(parseInt(itemId));
    return { success: true };
  },
  
  deleteItemsByCategory: async (categoryId) => {
    const allTasks = await getTasks();
    const tasksToDelete = allTasks.filter(task => task.category.toString() === categoryId);
    await Promise.all(tasksToDelete.map(task => deleteTask(task.id)));
    return { success: true };
  }
};

const CustomCategoryToDo = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📋');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newItemText, setNewItemText] = useState({});
  const [newItemNote, setNewItemNote] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState('');
  const [editNote, setEditNote] = useState('');
  const [filterCompleted, setFilterCompleted] = useState('all');
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const loadedCategories = await categoriesApi.getTaskCategories();
      
      if (loadedCategories.length === 0) {
        // Initialize with sample categories
        const defaultCategories = [
          
        ];
        
        for (const cat of defaultCategories) {
          await categoriesApi.createTaskCategory(cat);
        }
        
        const reloadedCategories = await categoriesApi.getTaskCategories();
        setCategories(reloadedCategories);
      } else {
        setCategories(loadedCategories);
      }
      
      // Load all items and group by category
      const allItems = await categoryItemsApi.getAllItems();
      const groupedItems = {};
      
      allItems.forEach(item => {
        if (!groupedItems[item.categoryId]) {
          groupedItems[item.categoryId] = [];
        }
        groupedItems[item.categoryId].push(item);
      });
      
      setItems(groupedItems);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTaskCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await categoriesApi.createTaskCategory({
        name: newCategoryName,
        icon: newCategoryIcon,
        color: newCategoryColor
      });
      
      await loadData();
      setNewCategoryName('');
      setNewCategoryIcon('📋');
      setNewCategoryColor('#3b82f6');
      setShowCategoryForm(false);
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!confirm('Delete this category and all its items?')) return;
    
    try {
      await categoriesApi.deleteCategory(categoryId);
      await categoryItemsApi.deleteItemsByCategory(categoryId);
      await loadData();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const addItem = async (categoryId) => {
    const text = newItemText[categoryId];
    if (!text || !text.trim()) return;

    try {
      await categoryItemsApi.createItem({
        categoryId: categoryId,
        text: text,
        note: newItemNote[categoryId] || '',
        completed: false
      });
      
      await loadData();
      setNewItemText({ ...newItemText, [categoryId]: '' });
      setNewItemNote({ ...newItemNote, [categoryId]: '' });
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const toggleItemComplete = async (categoryId, itemId) => {
    try {
      const item = items[categoryId]?.find(i => i.id === itemId);
      if (item) {
        await categoryItemsApi.updateItem(itemId, {
          ...item,
          completed: !item.completed
        });
        await loadData();
      }
    } catch (err) {
      console.error('Error toggling item:', err);
    }
  };

  const deleteItem = async (categoryId, itemId) => {
    try {
      await categoryItemsApi.deleteItem(itemId);
      await loadData();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const startEdit = (categoryId, item) => {
    setEditingItem({ categoryId, itemId: item.id });
    setEditText(item.text);
    setEditNote(item.note || '');
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;

    try {
      const { categoryId, itemId } = editingItem;
      const item = items[categoryId]?.find(i => i.id === itemId);
      
      if (item) {
        await categoryItemsApi.updateItem(itemId, {
          ...item,
          text: editText,
          note: editNote
        });
        
        await loadData();
        setEditingItem(null);
        setEditText('');
        setEditNote('');
      }
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const getFilteredItems = (categoryItems) => {
    if (!categoryItems) return [];
    
    let filtered = categoryItems;
    if (filterCompleted === 'active') filtered = filtered.filter(i => !i.completed);
    if (filterCompleted === 'completed') filtered = filtered.filter(i => i.completed);
    
    return filtered.sort((a, b) => {
      if (a.completed === b.completed) return new Date(b.createdAt) - new Date(a.createdAt);
      return a.completed ? 1 : -1;
    });
  };

  const getTaskCategoryStats = (categoryId) => {
    const categoryItems = items[categoryId] || [];
    return {
      total: categoryItems.length,
      completed: categoryItems.filter(i => i.completed).length,
      active: categoryItems.filter(i => !i.completed).length
    };
  };

  const iconOptions = ['📋', '🎬', '📚', '🛒', '✈️', '🎮', '🍔', '💼', '🏋️', '🎨', '🎵', '📱', '🏠', '🚗', '💰', '🎯'];
  const colorOptions = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>Loading your lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: 'clamp(12px, 3vw, 24px)' }}>
      <div style={{ width: '100%', maxWidth: '2000px', margin: '0 auto' }}>
        {/* Header */}
        <div className="section-card" style={{ marginBottom: 'clamp(12px, 3vw, 24px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: '800', margin: '0 0 8px 0', color: '#1f2937' }}>
                📝 Custom Lists
              </h1>
              <p style={{ fontSize: 'clamp(12px, 2vw, 14px)', color: '#6b7280', margin: 0 }}>
                Organize anything with custom categories
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '6px', background: '#f3f4f6', padding: '4px', borderRadius: '8px', flexWrap: 'wrap' }}>
                {['all', 'active', 'completed'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setFilterCompleted(filter)}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      background: filterCompleted === filter ? 'white' : 'transparent',
                      color: filterCompleted === filter ? '#667eea' : '#6b7280',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s',
                      boxShadow: filterCompleted === filter ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                style={{
                  padding: '10px 20px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {showCategoryForm ? '✕ Cancel' : '➕ New Category'}
              </button>
            </div>
          </div>

          {/* New Category Form */}
          {showCategoryForm && (
            <div style={{
              background: '#f9fafb',
              padding: '20px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>
                Create New Category
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createTaskCategory()}
                  placeholder="Category name (e.g., Movies to Watch)"
                  style={{
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', display: 'block' }}>
                      Icon
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
                      {iconOptions.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewCategoryIcon(icon)}
                          style={{
                            padding: '10px',
                            border: newCategoryIcon === icon ? '3px solid #667eea' : '2px solid #e5e7eb',
                            background: 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '20px',
                            transition: 'all 0.2s'
                          }}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', display: 'block' }}>
                      Color
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewCategoryColor(color)}
                          style={{
                            padding: '20px',
                            border: newCategoryColor === color ? '3px solid #1f2937' : '2px solid #e5e7eb',
                            background: color,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={createTaskCategory}
                  style={{
                    padding: '12px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  Create Category
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', marginBottom: '12px' }}>
            <div className="section-card">
              <EmptyState icon="📂" title="No categories" subtitle="Create a category to start organizing lists." actionLabel="New Category" onAction={() => setShowCategoryForm(true)} />
            </div>
          </div>
        ) : null}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap: 'clamp(12px, 3vw, 20px)'
        }}>
          {categories.map(category => {
            const stats = getTaskCategoryStats(category.id);
            const categoryItems = getFilteredItems(items[category.id]);

            return (
              <div
                key={category.id}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '600px',
                  position: 'relative'
                }}
              >
                {/* Decorative gradient */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '6px',
                  background: category.color,
                  borderRadius: '16px 16px 0 0'
                }} />

                {/* Category Header */}
                <div style={{ marginBottom: '20px', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '36px' }}>{category.icon}</span>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#1f2937' }}>
                          {category.name}
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: '600' }}>
                          <span style={{ color: category.color }}>{stats.active} active</span>
                          <span style={{ color: '#6b7280' }}>• {stats.completed} done</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        color: '#ef4444',
                        padding: '4px 8px',
                        opacity: 0.6,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = 1}
                      onMouseLeave={(e) => e.target.style.opacity = 0.6}
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Add Item Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      value={newItemText[category.id] || ''}
                      onChange={(e) => setNewItemText({ ...newItemText, [category.id]: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && addItem(category.id)}
                      placeholder={`Add to ${category.name}...`}
                      style={{
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        fontWeight: '500'
                      }}
                      onFocus={(e) => e.target.style.borderColor = category.color}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={newItemNote[category.id] || ''}
                        onChange={(e) => setNewItemNote({ ...newItemNote, [category.id]: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && addItem(category.id)}
                        placeholder="Optional note..."
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => addItem(category.id)}
                        style={{
                          padding: '10px 16px',
                          background: category.color,
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '14px',
                          boxShadow: `0 4px 12px ${category.color}40`,
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                      >
                        ➕
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  paddingRight: '6px',
                  minHeight: 0
                }}>
                  {categoryItems.length === 0 ? (
                    <div style={{ padding: '20px' }}>
                      <EmptyState icon={category.icon} title="No items yet" subtitle={`Add items to ${category.name}`} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {categoryItems.map(item => (
                        <div
                          key={item.id}
                          style={{
                            background: '#f9fafb',
                            padding: '16px',
                            borderRadius: '10px',
                            border: `2px solid ${category.color}20`,
                            opacity: item.completed ? 0.6 : 1,
                            transition: 'all 0.2s'
                          }}
                        >
                          {editingItem?.itemId === item.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                                style={{
                                  padding: '10px',
                                  border: '2px solid #e5e7eb',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  fontWeight: '500'
                                }}
                                autoFocus
                              />
                              <input
                                type="text"
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="Note..."
                                style={{
                                  padding: '8px',
                                  border: '2px solid #e5e7eb',
                                  borderRadius: '6px',
                                  fontSize: '12px'
                                }}
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={saveEdit}
                                  style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px'
                                  }}
                                >
                                  ✓ Save
                                </button>
                                <button
                                  onClick={() => setEditingItem(null)}
                                  style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px'
                                  }}
                                >
                                  ✕ Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={() => toggleItemComplete(category.id, item.id)}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    cursor: 'pointer',
                                    accentColor: category.color,
                                    marginTop: '2px'
                                  }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div
                                    style={{
                                      fontSize: '15px',
                                      fontWeight: '600',
                                      color: '#1f2937',
                                      textDecoration: item.completed ? 'line-through' : 'none',
                                      marginBottom: item.note ? '6px' : 0,
                                      wordBreak: 'break-word'
                                    }}
                                    onDoubleClick={() => startEdit(category.id, item)}
                                  >
                                    {item.text}
                                  </div>
                                  {item.note && (
                                    <div style={{
                                      fontSize: '13px',
                                      color: '#6b7280',
                                      fontStyle: 'italic',
                                      paddingLeft: '12px',
                                      borderLeft: `3px solid ${category.color}40`
                                    }}>
                                      {item.note}
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    onClick={() => startEdit(category.id, item)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '16px',
                                      padding: '4px 8px',
                                      opacity: 0.6,
                                      transition: 'opacity 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.opacity = 1}
                                    onMouseLeave={(e) => e.target.style.opacity = 0.6}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => deleteItem(category.id, item.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '16px',
                                      color: '#ef4444',
                                      padding: '4px 8px',
                                      opacity: 0.6,
                                      transition: 'opacity 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.opacity = 1}
                                    onMouseLeave={(e) => e.target.style.opacity = 0.6}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CustomCategoryToDo;