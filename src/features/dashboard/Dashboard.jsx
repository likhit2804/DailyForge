import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import EmptyState from '../../shared/components/EmptyState';
import '../../styles.css'; // Import shared CSS

const MODE_STORAGE_KEY = 'dailyforge.thoughtMode';

const MODE_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'motivational', label: 'Motivational' },
  { id: 'focus', label: 'Focus' },
  { id: 'calm', label: 'Calm' },
  { id: 'gratitude', label: 'Gratitude' },
  { id: 'confidence', label: 'Confidence' },
  { id: 'custom', label: 'Custom' },
];

const Dashboard = () => {
  const { habits, expenses, categories, tasks, graphSpan, setGraphSpan, filterBySpan, totalExpenses, avgStreak } = useAppContext();

  const modeOptions = useMemo(() => MODE_OPTIONS, []);
  const [thoughtMode, setThoughtMode] = useState(() => {
    try {
      return localStorage.getItem(MODE_STORAGE_KEY) || 'all';
    } catch {
      return 'all';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, thoughtMode || 'all');
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('thoughts:modeChanged', { detail: { mode: thoughtMode || 'all' } }));
    // Force an immediate banner refresh when mode changes
    window.dispatchEvent(new CustomEvent('thoughts:updated', { detail: { mode: thoughtMode || 'all' } }));
  }, [thoughtMode]);

  // Calculate dynamic stats based on graphSpan
  const filteredExpenses = filterBySpan(expenses);
  const tasksAdded = Object.values(tasks).reduce((sum, list) => sum + list.length, 0);
  const thisPeriodExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const thisPeriodHabits = habits.length; // Habits are not filtered by date, so show total
  const thisPeriodAvgStreak = avgStreak; // Average streak is overall
  const mostExpensiveCategory = filteredExpenses.length ? filteredExpenses.reduce((a, b) => Math.abs(a.amount) > Math.abs(b.amount) ? a : b).category : '-';
  const longestHabitStreak = habits.length ? Math.max(...habits.map(h => h.streak ?? 0)) : 0;

  // Chart data: prefer explicit categories, but fall back to categories found in expenses
  const chartCategories = (Array.isArray(categories) && categories.length > 0)
    ? categories
    : Array.from(new Set(filteredExpenses.map(e => e.category))).map(name => ({ name, color: '#cbd5e0', budget: 0 }));

  const chartData = chartCategories.map(cat => ({
    category: cat.name,
    amount: filteredExpenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + Math.abs(e.amount || 0), 0)
  }));

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: 'clamp(12px, 3vw, 24px)' }}>
      <div style={{ width: '100%', maxWidth: '2000px', margin: '0 auto' }}>
        <div className="section-card" style={{ marginBottom: 'clamp(12px, 3vw, 24px)' }}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: '800', margin: '0 0 8px 0', color: '#1f2937' }}>
                📊 Dashboard
              </h1>
              <p style={{ fontSize: 'clamp(12px, 2vw, 14px)', color: '#6b7280', margin: 0 }}>
                Overview of your habits and expenses
              </p>
            </div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Time period:</span>
              <button
                type="button"
                className={`btn btn-sm ${graphSpan === 'week' ? 'btn-custom-primary' : 'btn-outline-primary'}`}
                onClick={() => setGraphSpan('week')}
              >
                Week
              </button>
              <button
                type="button"
                className={`btn btn-sm ${graphSpan === 'month' ? 'btn-custom-primary' : 'btn-outline-primary'}`}
                onClick={() => setGraphSpan('month')}
              >
                Month
              </button>
              <button
                type="button"
                className={`btn btn-sm ${graphSpan === 'year' ? 'btn-custom-primary' : 'btn-outline-primary'}`}
                onClick={() => setGraphSpan('year')}
              >
                Year
              </button>
              <button
                type="button"
                className={`btn btn-sm ${graphSpan === 'all' ? 'btn-custom-primary' : 'btn-outline-primary'}`}
                onClick={() => setGraphSpan('all')}
              >
                All
              </button>
            </div>
          </div>

          {/* Affirmations banner mode picker (outside banner) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}>Affirmations mode:</span>
            <div
              role="tablist"
              aria-label="Affirmations mode"
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
            >
              {modeOptions.map(opt => {
                const active = thoughtMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setThoughtMode(opt.id)}
                    className={`btn btn-sm ${active ? 'btn-custom-primary' : 'btn-outline-primary'}`}
                    style={{ borderRadius: 999 }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Grid - 2x3 or 3x2 responsive */}
        <div className="dashboard-stats-grid mb-4">
          <div className="stat-card shadow h-100">
            <div className="card-body text-center">
              <p className="stat-label mb-2">Current Streak</p>
              <div className="stat-value">{thisPeriodAvgStreak}</div>
              <p className="stat-sublabel">days average</p>
            </div>
          </div>
          <div className="stat-card shadow h-100">
            <div className="card-body text-center">
              <p className="stat-label mb-2">This Period</p>
              <div className="stat-value">₹{thisPeriodExpenses}</div>
              <p className="stat-sublabel">net expenses</p>
            </div>
          </div>
          <div className="stat-card shadow h-100">
            <div className="card-body text-center">
              <p className="stat-label mb-2">Habits Tracked</p>
              <div className="stat-value">{thisPeriodHabits}</div>
              <p className="stat-sublabel">total habits</p>
            </div>
          </div>
          <div className="stat-card shadow h-100">
            <div className="card-body text-center">
              <p className="stat-label mb-2">Most Expensive Category</p>
              <div className="stat-value" style={{ fontSize: '20px' }}>{mostExpensiveCategory}</div>
              <p className="stat-sublabel">in selected period</p>
            </div>
          </div>
          <div className="stat-card shadow h-100">
            <div className="card-body text-center">
              <p className="stat-label mb-2">Longest Habit Streak</p>
              <div className="stat-value">{longestHabitStreak}</div>
              <p className="stat-sublabel">best streak (days)</p>
            </div>
          </div>
          <div className="stat-card shadow h-100">
            <div className="card-body text-center">
              <p className="stat-label mb-2">Matrix Tasks</p>
              <div className="stat-value">{tasksAdded}</div>
              <p className="stat-sublabel">total across quadrants</p>
            </div>
          </div>
        </div>
       
        <div className="section-card">
          <div>
            <h2 className="section-title">
              <span className="badge bg-primary rounded-pill p-2">✨</span>
              Today's Habits
            </h2>
            {habits.length === 0 ? (
              <EmptyState icon="✨" title="No habits yet" subtitle="Add habits to start tracking your progress." actionLabel="Add Habit" />
            ) : (
              habits.slice(0, 3).map(habit => {
                // Calculate fraction for today: completed/total
                const total = habit.completed.length;
                const done = habit.completed.filter(Boolean).length;
                return (
                  <div key={habit.id} className="task-item p-3 mb-2 rounded">
                    <div>
                      <h3 className="h5 mb-1">{habit.name}</h3>
                      <p className="habit-streak mb-0">🔥 {habit.streak ?? 0} day streak</p>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#4f46e5' }}>
                      {done} / {total} days
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="section-card mt-3">
          <div>
            <h2 className="section-title">
              <span className="badge bg-success rounded-pill p-2">💰</span>
              Recent Expenses
            </h2>
            {filteredExpenses.length === 0 ? (
              <EmptyState icon="💸" title="No expenses" subtitle="You don't have any expenses for this period." actionLabel="Add Expense" />
            ) : (
              filteredExpenses.slice(0, 3).map(expense => (
                <div key={expense.id} className="task-item p-3 mb-2 rounded" style={{borderLeft: `6px solid ${categories.find(c => c.name === expense.category)?.color || '#e2e8f0'}`}}>
                  <div>
                    <div className="fw-bold">{expense.category}</div>
                    <div className="text-muted small">{expense.date}</div>
                  </div>
                  <div className="fw-bold fs-5">₹{expense.amount}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="section-card mt-3">
          <div>
            <h2 className="section-title">
              <span className="badge bg-secondary rounded-pill p-2">📉</span>
              Spending by Category
            </h2>
            {chartData.filter(d => d.amount > 0).length === 0 ? (
              <EmptyState
                icon="📉"
                title="No spending data"
                subtitle="Add expenses to see category-wise trends for this period."
              />
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
