import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAppContext } from '../../context/AppContext';

const QuadrantsSplitLayout = () => {
  const { tasks, addTaskRemote, updateTaskRemote, deleteTaskRemote, markTaskComplete, moveTask } = useAppContext();

  const [newTask, setNewTask] = useState('');
  const [newTaskQuadrant, setNewTaskQuadrant] = useState('urgent_important');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editTime, setEditTime] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const [filterCompleted, setFilterCompleted] = useState('all');
  const [loading, setLoading] = useState(false);

  // Tasks load handled by AppContext

  const getTaskStats = () => {
    const now = new Date();
    const stats = {
      total: 0,
      completed: 0,
      overdue: 0,
      dueToday: 0,
      dueThisWeek: 0,
      noDeadline: 0
    };

    Object.values(tasks).forEach(taskList => {
      taskList.forEach(task => {
        stats.total++;
        if (task.completed) stats.completed++;
        
        if (!task.deadline) {
          stats.noDeadline++;
        } else {
          const deadline = new Date(task.deadline);
          if (task.time) {
            const [hours, minutes] = task.time.split(':');
            deadline.setHours(parseInt(hours), parseInt(minutes));
          }
          
          const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0 && !task.completed) stats.overdue++;
          if (diffDays === 0 && !task.completed) stats.dueToday++;
          if (diffDays >= 0 && diffDays <= 7 && !task.completed) stats.dueThisWeek++;
        }
      });
    });

    return stats;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    try {
      const newTaskData = {
        text: newTask,
        quadrant: newTaskQuadrant,
        deadline: newTaskDeadline || null,
        time: newTaskTime || null,
        completed: false
      };
      
      await addTaskRemote(newTaskData);
      
      setNewTask('');
      setNewTaskDeadline('');
      setNewTaskTime('');
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const markTaskCompleteLocal = async (quadrant, taskId) => {
    try {
      markTaskComplete(quadrant, taskId);
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (quadrant, taskId) => {
    try {
      await deleteTaskRemote(quadrant, taskId);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const startEdit = (task) => {
    setEditingTask(task.id);
    setEditText(task.text);
    setEditDeadline(task.deadline || '');
    setEditTime(task.time || '');
  };

  const saveEdit = async (quadrant, taskId) => {
    if (!editText.trim()) return;
    
    try {
      const task = tasks[quadrant].find(t => t.id === taskId);
      if (task) {
        await updateTaskRemote(taskId, quadrant, {
          ...task,
          text: editText,
          deadline: editDeadline || null,
          time: editTime || null
        });
        setEditingTask(null);
        setEditText('');
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleDragStart = (quadrant, task) => {
    setDraggedTask({ quadrant, task });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (targetQuadrant) => {
    if (!draggedTask) return;
    
    if (draggedTask.quadrant !== targetQuadrant) {
      try {
        moveTask(draggedTask.quadrant, draggedTask.task.id, targetQuadrant);
      } catch (err) {
        console.error('Error moving task:', err);
      }
    }
    setDraggedTask(null);
  };

  const getDaysUntilDeadline = (deadline, time) => {
    if (!deadline) return null;
    const now = new Date();
    let deadlineDate = new Date(deadline);
    
    if (time) {
      const [hours, minutes] = time.split(':');
      deadlineDate.setHours(parseInt(hours), parseInt(minutes));
    }
    
    return Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  };

  const getDeadlineColor = (days) => {
    if (days === null) return '#6c757d';
    if (days < 0) return '#dc3545';
    if (days === 0) return '#fd7e14';
    if (days <= 3) return '#ffc107';
    return '#28a745';
  };

  const formatDeadline = (deadline, time) => {
    if (!deadline) return '';
    const days = getDaysUntilDeadline(deadline, time);
    
    if (days === 0) return '📅 Today' + (time ? ` ${time}` : '');
    if (days === 1) return '📅 Tomorrow' + (time ? ` ${time}` : '');
    if (days === -1) return '⚠️ Yesterday';
    if (days < 0) return `⚠️ ${Math.abs(days)}d overdue`;
    if (days <= 7) return `📅 ${days}d`;
    
    const date = new Date(deadline);
    return `📅 ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const getFilteredTasks = (taskList) => {
    let filtered = taskList;
    
    if (filterCompleted === 'active') filtered = filtered.filter(t => !t.completed);
    if (filterCompleted === 'completed') filtered = filtered.filter(t => t.completed);
    
    return filtered.sort((a, b) => (a.completed ? 1 : -1));
  };

  const taskStats = getTaskStats();

  const quadrantOptions = [
    { value: 'urgent_important', label: '🔴 Urgent & Important', icon: '🔥' },
    { value: 'not_urgent_important', label: '🔵 Important, Not Urgent', icon: '🎯' },
    { value: 'urgent_not_important', label: '🟠 Urgent, Not Important', icon: '⚡' },
    { value: 'not_urgent_not_important', label: '⚪ Neither', icon: '📋' }
  ];

  const quadrantConfig = [
    { 
      key: 'urgent_important', 
      title: 'Urgent & Important', 
      subtitle: 'DO FIRST', 
      icon: '🔥',
      color: '#ef4444', 
      lightColor: '#fee2e2',
      gradient: '#fee2e2',
      description: 'Critical tasks requiring immediate attention'
    },
    { 
      key: 'not_urgent_important', 
      title: 'Important, Not Urgent', 
      subtitle: 'SCHEDULE', 
      icon: '🎯',
      color: '#3b82f6', 
      lightColor: '#dbeafe',
      gradient: '#dbeafe',
      description: 'Strategic work for long-term success'
    },
    { 
      key: 'urgent_not_important', 
      title: 'Urgent, Not Important', 
      subtitle: 'DELEGATE', 
      icon: '⚡',
      color: '#f59e0b', 
      lightColor: '#fef3c7',
      gradient: '#fef3c7',
      description: 'Interruptions that can be delegated'
    },
    { 
      key: 'not_urgent_not_important', 
      title: 'Neither Urgent nor Important', 
      subtitle: 'ELIMINATE', 
      icon: '📋',
      color: '#6b7280', 
      lightColor: '#f3f4f6',
      gradient: '#f3f4f6',
      description: 'Time wasters to minimize'
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100vh', padding: '16px', boxSizing: 'border-box' }}>
      {/* Compact Top Section - Analytics & Add Task */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>
        {/* Analytics Dashboard - Compact */}
        <div style={{
          background: '#667eea',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>📊 Task Overview</h2>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'active', 'completed'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setFilterCompleted(filter)}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    background: filterCompleted === filter ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
            {[
              { label: 'Total', value: taskStats.total, icon: '📝' },
              { label: 'Done', value: taskStats.completed, icon: '✅' },
              { label: 'Overdue', value: taskStats.overdue, icon: '⚠️' },
              { label: 'Today', value: taskStats.dueToday, icon: '📅' },
              { label: 'Week', value: taskStats.dueThisWeek, icon: '🗓️' },
              { label: 'None', value: taskStats.noDeadline, icon: '∞' }
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '10px 8px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '2px' }}>{stat.icon}</div>
                <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '2px' }}>{stat.value}</div>
                <div style={{ fontSize: '10px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Task Card - Compact */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          border: '2px solid #f0f0f0'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>➕</span> Quick Add
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
              placeholder="What needs to be done?"
              style={{
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                transition: 'all 0.2s',
                fontWeight: '500'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <select
              value={newTaskQuadrant}
              onChange={(e) => setNewTaskQuadrant(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {quadrantOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="date"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                style={{
                  padding: '10px 8px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
              <input
                type="time"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                disabled={!newTaskDeadline}
                style={{
                  padding: '10px 8px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  outline: 'none',
                  opacity: !newTaskDeadline ? 0.5 : 1
                }}
              />
            </div>
            <button
              onClick={handleSubmit}
              style={{
                padding: '10px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section - Quadrants Grid - Now takes most space */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {quadrantConfig.map(({ key, title, subtitle, icon, color, lightColor, gradient, description }) => (
          <div
            key={key}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(key)}
            style={{
              background: gradient,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: `0 4px 16px ${color}20`,
              border: `3px solid ${color}`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
              minHeight: 0
            }}
          >
            {/* Decorative corner */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '120px',
              height: '120px',
              background: `radial-gradient(circle at top right, ${color}15 0%, transparent 70%)`,
              pointerEvents: 'none'
            }}></div>

            {/* Header - More compact */}
            <div style={{ marginBottom: '12px', position: 'relative', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '28px' }}>{icon}</span>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 3px 0', color: '#1f2937' }}>{title}</h4>
                    <span style={{
                      fontSize: '9px',
                      color: color,
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      background: 'white',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      display: 'inline-block'
                    }}>
                      {subtitle}
                    </span>
                  </div>
                </div>
                <div style={{
                  background: 'white',
                  color: color,
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '800',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: `2px solid ${color}`
                }}>
                  {getFilteredTasks(tasks[key]).length}
                </div>
              </div>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '6px 0 0 38px', fontStyle: 'italic' }}>
                {description}
              </p>
            </div>

            {/* Task List - Scrollable, takes remaining space */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '6px',
              minHeight: 0
            }}>
              {getFilteredTasks(tasks[key]).length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px',
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: '10px',
                  border: `2px dashed ${color}40`
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px', opacity: 0.3 }}>{icon}</div>
                  <p style={{ fontSize: '12px', margin: 0, color: '#6b7280', fontWeight: '500' }}>
                    No tasks here yet
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {getFilteredTasks(tasks[key]).map(task => (
                    <div
                      key={task.id}
                      draggable={editingTask !== task.id}
                      onDragStart={() => handleDragStart(key, task)}
                      style={{
                        background: 'white',
                        padding: '14px',
                        borderRadius: '10px',
                        border: `2px solid ${color}30`,
                        cursor: editingTask === task.id ? 'default' : 'grab',
                        opacity: task.completed ? 0.6 : 1,
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => {
                        if (editingTask !== task.id) {
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';
                      }}
                    >
                      {editingTask === task.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveEdit(key, task.id)}
                            style={{
                              padding: '10px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}
                            autoFocus
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="date"
                              value={editDeadline}
                              onChange={(e) => setEditDeadline(e.target.value)}
                              style={{
                                flex: 1,
                                padding: '8px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '12px'
                              }}
                            />
                            <input
                              type="time"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              style={{
                                flex: 1,
                                padding: '8px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '12px'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => saveEdit(key, task.id)}
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
                              onClick={() => setEditingTask(null)}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: task.deadline ? '8px' : 0 }}>
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => markTaskCompleteLocal(key, task.id)}
                              style={{ 
                                width: '18px', 
                                height: '18px', 
                                cursor: 'pointer',
                                accentColor: color
                              }}
                            />
                            <span
                              style={{
                                flex: 1,
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#1f2937',
                                textDecoration: task.completed ? 'line-through' : 'none'
                              }}
                              onDoubleClick={() => startEdit(task)}
                            >
                              {task.text}
                            </span>
                            <button
                              onClick={() => startEdit(task)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '4px 8px',
                                opacity: 0.7,
                                transition: 'opacity 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.opacity = 1}
                              onMouseLeave={(e) => e.target.style.opacity = 0.7}
                            >
                              ✏️
                            </button>
                            <button
                             onClick={() => deleteTask(key, task.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                color: '#ef4444',
                                padding: '4px 8px',
                                opacity: 0.7,
                                transition: 'opacity 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.opacity = 1}
                              onMouseLeave={(e) => e.target.style.opacity = 0.7}
                            >
                              🗑️
                            </button>
                          </div>
                          {task.deadline && (
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: '700',
                                color: getDeadlineColor(getDaysUntilDeadline(task.deadline, task.time)),
                                marginLeft: '28px',
                                display: 'inline-block',
                                background: `${getDeadlineColor(getDaysUntilDeadline(task.deadline, task.time))}15`,
                                padding: '4px 10px',
                                borderRadius: '6px'
                              }}
                            >
                              {formatDeadline(task.deadline, task.time)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuadrantsSplitLayout;