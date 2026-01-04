import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { AppProvider, useAppContext } from './context/AppContext';
import Dashboard from './features/dashboard/Dashboard';
import Quadrants from './features/tasks/Quadrants';
import Habits from './features/habits/Habits';
import Expenses from './features/expenses/Expenses';
import Todo from './features/tasks/Todo';
import Notes from './features/notes/Notes';
import SignIn from './features/auth/SignIn';
import Register from './features/auth/Register';

const ProductivityApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isAuthenticated, authLoading, logout, currentUser } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menu = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'todo', label: 'Tasks', icon: '🗂️' },
    { id: 'habits', label: 'Habits', icon: '✨' },
    { id: 'expenses', label: 'Finance', icon: '💰' },
    { id: 'quadrants', label: 'Priority', icon: '🎯' },
    { id: 'notes', label: 'Notes', icon: '📒' },
  ];

  useEffect(() => {
    // Show loading while checking authentication
    if (authLoading) return;

    const fromHash = window.location.hash.replace('#', '');

    // If not authenticated, allow only SignIn and Register pages
    if (!isAuthenticated) {
      if (fromHash !== 'signin' && fromHash !== 'register') window.location.hash = 'signin';
      setActiveTab(fromHash === 'register' ? 'register' : 'signin');
      return;
    }

    // If authenticated and hash points to signin/register, redirect to dashboard
    if (fromHash && (menu.some(m => m.id === fromHash) || fromHash === 'signin' || fromHash === 'register')) {
      if (fromHash === 'signin' || fromHash === 'register') {
        setActiveTab('dashboard');
        if (fromHash !== 'dashboard') window.location.hash = 'dashboard';
      } else {
        setActiveTab(fromHash);
      }
    } else {
      if (window.location.hash.replace('#', '') !== activeTab) window.location.hash = activeTab;
    }

    const onHashChange = () => {
      const h = window.location.hash.replace('#', '');
      if (!isAuthenticated) {
        if (h !== 'signin' && h !== 'register') window.location.hash = 'signin';
        setActiveTab(h === 'register' ? 'register' : 'signin');
        return;
      }
      if (h && (menu.some(m => m.id === h) || h === 'signin' || h === 'register')) {
        if (h === 'signin' || h === 'register') {
          setActiveTab('dashboard');
          if (window.location.hash.replace('#', '') !== 'dashboard') window.location.hash = 'dashboard';
        } else {
          setActiveTab(h);
        }
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [isAuthenticated, authLoading]);

  const handleSetActiveTab = (id) => {
    setActiveTab(id);
    if (window.location.hash.replace('#', '') !== id) window.location.hash = id;
  };

  if (activeTab === 'signin' || activeTab === 'register') {
    // For auth pages we intentionally do NOT wrap with `.new-layout`
    // so the auth UI can span the full viewport without the app grid/sidebar.
    return (
      <main className="main auth-only" style={{ width: '100%' }}>
        {activeTab === 'signin' ? <SignIn onTabChange={handleSetActiveTab} /> : <Register onTabChange={handleSetActiveTab} />}
      </main>
    );
  }

  return (
    <div className={`new-layout ${isSidebarOpen ? '' : 'collapsed'}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <button
            className="menu-trigger"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen(s => !s)}
          >
            ☰
          </button>
          <span className="brand">Tasks</span>
        </div>
        <nav className="sidebar-nav">
          {menu.map(item => (
            <button
              key={item.id}
              className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleSetActiveTab(item.id)}
            >
              <span className="mi-icon">{item.icon}</span>
              <span className="mi-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Topbar with User Switcher */}
        <div className="topbar">
          <div className="tb-left">
            <h1 className="tb-title">Task Management</h1>
            <p className="tb-sub">Per-user data • Local</p>
          </div>
          <div className="tb-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentUser ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: currentUser.color || '#c7d2fe',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}>
                      {(currentUser.name || 'G').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>{currentUser?.username || 'User'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{currentUser?.email || ''}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => logout()}
                  style={{ padding: '6px 10px', border: '1px solid #f87171', borderRadius: '8px', background: 'white', color: '#b91c1c', cursor: 'pointer' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { window.location.hash = 'signin'; }}
                style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', color: '#374151', cursor: 'pointer' }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Content card */}
        <div className="content-card">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'quadrants' && <Quadrants />}
          {activeTab === 'habits' && <Habits />}
          {activeTab === 'expenses' && <Expenses />}
          {activeTab === 'todo' && <Todo />}
          {activeTab === 'notes' && <Notes />}
        </div>
      </main>

      {/* Right panel removed - personal details moved to navbar */}
    </div>
  );
};

const App = () => (
  <AppProvider>
    <ProductivityApp />
  </AppProvider>
);

export default App;