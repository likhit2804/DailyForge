import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import '../../styles.css'; // Import shared CSS
import EmptyState from '../../shared/components/EmptyState';
export default function ExpenseTracker() {
  const { expenses, setExpenses, categories, setCategories, filterBySpan, graphSpan, setGraphSpan, addExpenseRemote, deleteExpenseRemote, updateExpenseRemote, saveCategoriesRemote, addFinanceCategoryRemote, updateFinanceCategoryRemote, deleteFinanceCategoryRemote } = useAppContext();

  console.log('💰 Expenses component - expenses:', expenses, 'is array?', Array.isArray(expenses), 'length:', expenses?.length);
  console.log('💰 Expenses component - categories:', categories, 'is array?', Array.isArray(categories), 'length:', categories?.length);

  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    date: '',
    time: '',
    description: '',
    isIncome: false,
    isRecurring: false,
    recurringDuration: 1
  });
  const [newCategory, setNewCategory] = useState({ name: '', color: '#cbd5e0', budget: 0 });
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editForm, setEditForm] = useState({});
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Helper to get category name from ID
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Other';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Other';
  };

  const totalExpenses = useMemo(() => {
    return filterBySpan(expenses)
      .filter(e => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0)
      .toFixed(0);
  }, [expenses, graphSpan]);

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses.filter(exp => {
      const catName = getCategoryName(exp.category);
      const matchesSearch = exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           catName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || catName === filterCategory;
      return matchesSearch && matchesCategory;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch(sortBy) {
        case 'date-desc': return new Date(b.date) - new Date(a.date);
        case 'date-asc': return new Date(a.date) - new Date(b.date);
        case 'amount-desc': return Math.abs(b.amount) - Math.abs(a.amount);
        case 'amount-asc': return Math.abs(a.amount) - Math.abs(b.amount);
        case 'category': return a.category.localeCompare(b.category);
        default: return 0;
      }
    });
    return sorted;
  }, [expenses, searchTerm, sortBy, filterCategory]);

  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const catExpenses = filterBySpan(expenses).filter(e => e.category === cat.id && e.amount < 0);
      const total = catExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
      const avg = catExpenses.length ? total / catExpenses.length : 0;
      return { ...cat, total, avg, count: catExpenses.length };
    });
  }, [expenses, categories, graphSpan]);

  // Responsive chart dimensions (computed on client)
  const [chartDims, setChartDims] = useState({ height: 280, radius: 100 });
  useEffect(() => {
    const update = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const height = Math.min(320, Math.max(220, Math.round(w * 0.28)));
      const radius = Math.min(120, Math.max(70, Math.round(w * 0.08)));
      setChartDims({ height, radius });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
// Load categories from storage on mount
// Persist categories when they change
useEffect(() => {
  if (categories && categories.length > 0) {
    saveCategoriesRemote(categories);
  }
}, [categories]);
  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.date) return;

    // Ensure amount parses to a valid number
    const parsedAmount = parseFloat(newExpense.amount);
    if (Number.isNaN(parsedAmount)) return;

    // Default category to the selected one, or first available, or create 'Other'
    let categoryToUse = newExpense.category || (categories[0] && categories[0].name);
    
    // If no category exists, create a default 'Other' category
    if (!categoryToUse || !categories.find(c => c.name === categoryToUse)) {
      categoryToUse = categoryToUse || 'Other';
      const fallback = { name: categoryToUse, color: '#cbd5e0', budget: 0 };
      const created = await addFinanceCategoryRemote(fallback);
      if (!created) {
        alert('Failed to create category. Please try again.');
        return;
      }
      categoryToUse = created.name;
    }
    
    const expenseToAdd = {
      id: Date.now(),
      category: categoryToUse,
      title: categoryToUse,
      date: newExpense.date,
      time: newExpense.time,
      description: newExpense.description || '',
      amount: newExpense.isIncome ? Math.abs(parsedAmount) : -Math.abs(parsedAmount),
      isRecurring: newExpense.isRecurring,
      recurringDuration: newExpense.recurringDuration
    };
    
    await addExpenseRemote(expenseToAdd);
    setNewExpense({ amount: '', category: '', date: '', time: '', description: '', isIncome: false, isRecurring: false, recurringDuration: 1 });
    setShowAddExpenseModal(false);
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) return;
    if (editingCategory) {
      const catToUpdate = categories.find(c => c.name === editingCategory);
      if (catToUpdate) {
        await updateFinanceCategoryRemote(catToUpdate.id, { name: newCategory.name, color: newCategory.color, budget: newCategory.budget });
        // Update expenses that use this category
        const expensesToUpdate = expenses.filter(exp => exp.category === editingCategory);
        for (const exp of expensesToUpdate) {
          await updateExpenseRemote(exp.id, { ...exp, category: newCategory.name });
        }
      }
      setEditingCategory(null);
    } else {
      await addFinanceCategoryRemote(newCategory);
    }
    setNewCategory({ name: '', color: '#cbd5e0', budget: 0 });
    setShowAddCategoryModal(false);
  };

  const handleSaveEdit = (expenseId) => {
    // Find the original expense to preserve its income/expense sign if user didn't indicate
    const original = expenses.find(e => e.id === expenseId);
    const parsed = editForm.amount !== undefined ? parseFloat(editForm.amount) : (original ? Math.abs(original.amount) : 0);
    const sign = original && original.amount > 0 ? 1 : -1;
    const updated = {
      amount: sign * Math.abs(parsed),
      category: editForm.category,
      date: editForm.date,
      time: editForm.time,
      description: editForm.description,
      isRecurring: editForm.isRecurring
    };
    updateExpenseRemote(expenseId, updated).then(() => {
      setEditingExpense(null);
      setEditForm({});
    });
  };

  return (
    <div style={{
      height: 'calc(100vh - 250px)',
      width: '100%',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
      gridTemplateRows: 'auto 1fr',
      gap: 'clamp(12px, 2vw, 20px)',
      padding: 'clamp(8px, 2vw, 20px)',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Header */}
      <div className="section-card" style={{ gridColumn: '1 / -1', marginBottom: 'clamp(8px, 2vw, 16px)' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="card-title d-flex align-items-center gap-3 mb-0">
            <span className="badge bg-success rounded-pill p-2" style={{fontSize: 'clamp(14px, 2.5vw, 18px)'}}>💰</span>
            <span className="text-gradient fw-bold" style={{fontSize: 'clamp(18px, 3vw, 24px)'}}>Expense Tracker</span>
          </h2>
          
        </div>
        
        <div className="mb-3">
          <label className="form-label fw-bold">Time Period</label>
          <div className="d-flex gap-2 mb-2">
            <button type="button" className={`btn ${graphSpan === 'week' ? 'btn-custom-primary' : 'btn-outline-primary'} btn-sm`} onClick={() => setGraphSpan('week')}>Week</button>
            <button type="button" className={`btn ${graphSpan === 'month' ? 'btn-custom-primary' : 'btn-outline-primary'} btn-sm`} onClick={() => setGraphSpan('month')}>Month</button>
            <button type="button" className={`btn ${graphSpan === 'year' ? 'btn-custom-primary' : 'btn-outline-primary'} btn-sm`} onClick={() => setGraphSpan('year')}>Year</button>
            <button type="button" className={`btn ${graphSpan === 'all' ? 'btn-custom-primary' : 'btn-outline-primary'} btn-sm`} onClick={() => setGraphSpan('all')}>All</button>
            <button type="button" className={`btn ${graphSpan === 'custom' ? 'btn-custom-primary' : 'btn-outline-primary'} btn-sm`} onClick={() => setGraphSpan('custom')}>Custom</button>
            {graphSpan === 'custom' && (
              <input type="date" className="form-control form-control-sm" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} placeholder="Start Date" />
            )}
            {graphSpan === 'custom' && (
              <input type="date" className="form-control form-control-sm" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} placeholder="End Date" />
            )}
            <button className="btn btn-custom-primary btn-sm" onClick={() => setShowAddExpenseModal(true)}>➕ Add Expense</button>
            <button className="btn btn-custom-secondary btn-sm" onClick={() => setShowAddCategoryModal(true)}>🏷️ Add Category</button>
          </div>
        </div>
      </div>

      {/* Left Column - Analytics */}
      <div className="section-card" style={{ overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 'clamp(16px, 3vw, 24px)' }}>
        {/* Left Analytics - Stats */}
        <div>
          <h3 style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span>📊</span> Analytics
          </h3>
          
          {/* Stats Grid - 2x2 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'clamp(8px, 1.5vw, 12px)',
            marginBottom: 'clamp(12px, 2vw, 20px)'
          }}>
            <div style={{
              padding: 'clamp(10px, 2vw, 16px)',
              backgroundColor: '#f8f9fa',
              borderRadius: 'clamp(4px, 1vw, 8px)',
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{fontSize: 'clamp(9px, 1.5vw, 12px)', color: '#6c757d', marginBottom: 'clamp(2px, 0.5vw, 6px)'}}>Total Expenses</div>
              <div style={{fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 'bold'}}>{filterBySpan(expenses).filter(e => e.amount < 0).length}</div>
            </div>
            <div style={{
              padding: 'clamp(10px, 2vw, 16px)',
              backgroundColor: '#f8f9fa',
              borderRadius: 'clamp(4px, 1vw, 8px)',
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{fontSize: 'clamp(9px, 1.5vw, 12px)', color: '#6c757d', marginBottom: 'clamp(2px, 0.5vw, 6px)'}}>Total Income</div>
              <div style={{fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 'bold'}}>{filterBySpan(expenses).filter(e => e.amount > 0).length}</div>
            </div>
            <div style={{
              padding: 'clamp(10px, 2vw, 16px)',
              backgroundColor: '#f8f9fa',
              borderRadius: 'clamp(4px, 1vw, 8px)',
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{fontSize: 'clamp(9px, 1.5vw, 12px)', color: '#6c757d', marginBottom: 'clamp(2px, 0.5vw, 6px)'}}>Avg Expense</div>
              <div style={{fontSize: 'clamp(16px, 2.5vw, 24px)', fontWeight: 'bold'}}>₹{filterBySpan(expenses).filter(e => e.amount < 0).length ? (filterBySpan(expenses).filter(e => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0) / filterBySpan(expenses).filter(e => e.amount < 0).length).toFixed(0) : '0'}</div>
            </div>
            <div style={{
              padding: 'clamp(10px, 2vw, 16px)',
              backgroundColor: '#f8f9fa',
              borderRadius: 'clamp(4px, 1vw, 8px)',
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{fontSize: 'clamp(9px, 1.5vw, 12px)', color: '#6c757d', marginBottom: 'clamp(2px, 0.5vw, 6px)'}}>Highest Expense</div>
              <div style={{fontSize: 'clamp(16px, 2.5vw, 24px)', fontWeight: 'bold'}}>₹{filterBySpan(expenses).filter(e => e.amount < 0).length ? Math.max(...filterBySpan(expenses).filter(e => e.amount < 0).map(e => Math.abs(e.amount))) : '0'}</div>
            </div>
          </div>

          {/* Category Budgets */}
          <div>
            <h4 style={{
              fontSize: 'clamp(11px, 2vw, 14px)',
              color: '#6c757d',
              marginBottom: 'clamp(8px, 1.5vw, 12px)',
              fontWeight: '600'
            }}>🎯 Category Budgets</h4>
            {categoryStats.map(cat => (
              <div key={cat.name} style={{marginBottom: 'clamp(8px, 1.5vw, 12px)'}}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 'clamp(3px, 0.5vw, 6px)'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span style={{width: '12px', height: '12px', backgroundColor: cat.color || '#cbd5e0', borderRadius: '3px', display: 'inline-block', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'}}></span>
                    <span style={{fontSize: 'clamp(10px, 1.8vw, 13px)', fontWeight: '600', color: '#111827'}}>{cat.name}</span>
                  </div>
                  <span style={{
                    fontSize: 'clamp(8px, 1.4vw, 11px)',
                    color: '#6c757d'
                  }}>₹{cat.total} / ₹{cat.budget || 0}</span>
                </div>
                <div style={{
                  height: 'clamp(6px, 1vw, 8px)',
                  backgroundColor: '#f0f0f0',
                  borderRadius: 'clamp(2px, 0.5vw, 4px)',
                  overflow: 'hidden'
                }}>
                  <div 
                    style={{
                      height: '100%',
                      width: `${cat.budget ? Math.min((cat.total / cat.budget) * 100, 100) : 0}%`, 
                      backgroundColor: cat.total > cat.budget ? '#fc8181' : cat.color,
                      transition: 'width 0.3s'
                    }}
                  ></div>
                </div>
                <div style={{
                  fontSize: 'clamp(7px, 1.2vw, 9px)',
                  color: '#6c757d',
                  marginTop: 'clamp(2px, 0.3vw, 4px)'
                }}>Avg: ₹{cat.avg.toFixed(0)} • {cat.count} transactions</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Analytics - Pie Chart */}
        <div>
          <h3 style={{
            fontSize: 'clamp(14px, 2.5vw, 18px)',
            fontWeight: 'bold',
            marginBottom: 'clamp(8px, 1.5vw, 16px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🥧</span> Category Breakdown
          </h3>
          
          <ResponsiveContainer width="100%" height={420}>
            <PieChart>
              <Pie 
                data={categoryStats.filter(c => c.total > 0).map(c => ({name: c.name, value: c.total}))} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={140} 
                label
              >
                {categoryStats.filter(c => c.total > 0).map((cat, i) => <Cell key={i} fill={cat.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right Column - Management */}
      <div className="section-card" style={{ overflow: 'auto' }}>
        <h3 style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)',
          fontWeight: 'bold',
          marginBottom: 'clamp(12px, 2vw, 20px)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>💰</span> Manage Expenses
        </h3>

        {/* Manage Categories */}
        <div style={{marginBottom: '20px'}}>
          <h4 style={{fontSize: '14px', color: '#6c757d', marginBottom: '12px', fontWeight: '600'}}>🏷️ Categories</h4>
          
          <div className="mb-4">
            <div className="d-flex gap-2 flex-wrap">
              {categories.map(cat => (
                <div key={cat.name} className="badge p-2 d-flex align-items-center gap-2 badge-custom" style={{backgroundColor: cat.color, color: '#000'}}>
                  {cat.name} (₹{cat.budget})
                  <button className="btn btn-sm p-0 border-0" style={{background: 'none', fontSize: '12px'}} onClick={() => {
                    setEditingCategory(cat.name);
                    setNewCategory(cat);
                  }}>✏️</button>
                  <button className="btn btn-sm p-0 border-0" style={{background: 'none', fontSize: '12px'}} onClick={async () => {
                    if (confirm(`Delete category "${cat.name}"? All expenses in this category will remain but need recategorization.`)) {
                      await deleteFinanceCategoryRemote(cat.id);
                    }
                  }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Total This Period */}
        <div style={{marginBottom: '20px'}}>
          <div className="text-center mb-4 p-3 bg-light rounded stat-card">
            <p className="stat-label mb-1">Total This Period</p>
            <div className="stat-value" style={{fontSize: '2rem', fontWeight: 'bold', color: '#2d3748'}}>₹{totalExpenses}</div>
          </div>
        </div>

        {/* Expense List */}
        <div>
          <h4 style={{fontSize: '14px', color: '#6c757d', marginBottom: '12px', fontWeight: '600'}}>📋 Expense List</h4>
          <div className="mb-3">
            <div className="row g-2">
              <div className="col-md-4">
                <input className="form-control form-control-custom" type="text" placeholder="🔍 Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="col-md-4">
                <select className="form-select form-control-custom" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <select className="form-select form-control-custom" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="amount-desc">Amount (High-Low)</option>
                  <option value="amount-asc">Amount (Low-High)</option>
                  <option value="category">Category</option>
                </select>
              </div>
            </div>
          </div>
          
          {filteredAndSortedExpenses.length === 0 ? (
            <EmptyState icon="💸" title="No expenses found" subtitle="Add your first expense using the Add Expense button." />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(160px, 20vw, 200px), 1fr))',
              gap: 'clamp(8px, 1.5vw, 16px)'
            }}>
              {filteredAndSortedExpenses.map(expense => {
                const cat = categories.find(c => c.name === expense.category);
                const color = cat ? cat.color : '#e2e8f0';
                const isIncome = expense.amount > 0;
                const amountColor = isIncome ? '#48bb78' : '#fc8181';
                const icon = isIncome ? '⬆️' : '⬇️';
                
                if (editingExpense === expense.id) {
                  return (
                    <div key={expense.id} style={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <input 
                        className="form-control form-control-sm" 
                        type="number" 
                        value={editForm.amount !== undefined ? editForm.amount : Math.abs(expense.amount)} 
                        onChange={e => setEditForm(f => ({...f, amount: e.target.value}))}
                        placeholder="Amount"
                      />
                      <select 
                        className="form-select form-select-sm" 
                        value={editForm.category !== undefined ? editForm.category : expense.category} 
                        onChange={e => setEditForm(f => ({...f, category: e.target.value}))}
                      >
                        {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                      </select>
                      <input 
                        className="form-control form-control-sm" 
                        type="date" 
                        value={editForm.date !== undefined ? editForm.date : expense.date} 
                        onChange={e => setEditForm(f => ({...f, date: e.target.value}))}
                      />
                      <input 
                        className="form-control form-control-sm" 
                        type="time" 
                        value={editForm.time !== undefined ? editForm.time : (expense.time || '')} 
                        onChange={e => setEditForm(f => ({...f, time: e.target.value}))}
                        placeholder="Time"
                      />
                      <input 
                        className="form-control form-control-sm" 
                        type="text" 
                        value={editForm.description !== undefined ? editForm.description : expense.description} 
                        onChange={e => setEditForm(f => ({...f, description: e.target.value}))}
                        placeholder="Description" 
                      />
                      <div style={{display: 'flex', gap: '4px'}}>
                        <button className="btn btn-sm btn-success" onClick={() => handleSaveEdit(expense.id)}>Save</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => {
                          setEditingExpense(null);
                          setEditForm({});
                        }}>Cancel</button>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={expense.id} style={{
                    backgroundColor: 'white',
                    border: `2px solid ${color}`,
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '140px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div>
                      <div style={{fontSize: '14px', fontWeight: 'bold', color, marginBottom: '4px'}}>{getCategoryName(expense.category)}</div>
                      <div style={{fontSize: '12px', color: '#6c757d'}}>{expense.date}</div>
                      {expense.time && <div style={{fontSize: '12px', color: '#6c757d'}}>{expense.time}</div>}
                      {expense.description && <div style={{fontSize: '11px', marginTop: '4px', color: '#666'}}>{expense.description.slice(0, 30)}{expense.description.length > 30 ? '...' : ''}</div>}
                      {expense.isRecurring && <span className="badge bg-info text-dark" style={{fontSize: '10px'}}>🔄</span>}
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div style={{fontSize: '16px', fontWeight: 'bold', color: amountColor}}>
                        {icon} ₹{Math.abs(expense.amount)}
                      </div>
                      <div style={{display: 'flex', gap: '2px'}}>
                        <button className="btn btn-sm btn-outline-primary p-1" onClick={(e) => {
                          e.stopPropagation();
                          setEditingExpense(expense.id);
                          setEditForm({
                            amount: Math.abs(expense.amount),
                            category: expense.category,
                            date: expense.date,
                            time: expense.time || '',
                            description: expense.description || ''
                          });
                        }}>✏️</button>
                        <button className="btn btn-sm btn-outline-danger p-1" onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this expense?')) {
                            deleteExpenseRemote(expense.id);
                          }
                        }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Expense</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddExpenseModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Amount</label>
                  <input className="form-control form-control-custom"
                    type="number"
                    placeholder="Amount"
                    value={newExpense.amount}
                    onChange={e => setNewExpense(exp => ({ ...exp, amount: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <select className="form-select form-control-custom"
                    value={newExpense.category}
                    onChange={e => setNewExpense(exp => ({ ...exp, category: e.target.value }))}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input className="form-control form-control-custom"
                    type="date"
                    value={newExpense.date}
                    onChange={e => setNewExpense(exp => ({ ...exp, date: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Time</label>
                  <input className="form-control form-control-custom"
                    type="time"
                    value={newExpense.time}
                    onChange={e => setNewExpense(exp => ({ ...exp, time: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <input className="form-control form-control-custom"
                    type="text"
                    placeholder="Description"
                    value={newExpense.description}
                    onChange={e => setNewExpense(exp => ({ ...exp, description: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input className="form-check-input"
                      type="checkbox"
                      checked={newExpense.isIncome}
                      onChange={e => setNewExpense(exp => ({ ...exp, isIncome: e.target.checked }))}
                    />
                    <label className="form-check-label">Income</label>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input className="form-check-input"
                      type="checkbox"
                      checked={newExpense.isRecurring}
                      onChange={e => setNewExpense(exp => ({ ...exp, isRecurring: e.target.checked }))}
                    />
                    <label className="form-check-label">Recurring</label>
                  </div>
                </div>
                {newExpense.isRecurring && (
                  <div className="mb-3">
                    <label className="form-label">Duration (Months)</label>
                    <input className="form-control form-control-custom"
                      type="number"
                      placeholder="Months"
                      min="1"
                      value={newExpense.recurringDuration}
                      onChange={e => setNewExpense(exp => ({ ...exp, recurringDuration: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddExpenseModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={() => {
                  handleAddExpense();
                  setShowAddExpenseModal(false);
                }}>Add Expense</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Category</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddCategoryModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Category Name</label>
                  <input className="form-control form-control-custom"
                    type="text"
                    placeholder="Category Name"
                    value={newCategory.name}
                    onChange={e => setNewCategory(cat => ({ ...cat, name: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Color</label>
                  <input className="form-control form-control-color"
                    type="color"
                    value={newCategory.color}
                    onChange={e => setNewCategory(cat => ({ ...cat, color: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Budget</label>
                  <input className="form-control form-control-custom"
                    type="number"
                    placeholder="Budget"
                    value={newCategory.budget || ''}
                    onChange={e => setNewCategory(cat => ({ ...cat, budget: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCategoryModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={() => {
                  handleAddCategory();
                  setShowAddCategoryModal(false);
                }}>Add Category</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}