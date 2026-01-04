import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import '../../styles.css'; // Import shared CSS

const getDaysArray = (span, offset = 0) => {
  const today = new Date();
  let days = [];
  if (span === 'week') {
    // Calculate week with offset
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + (offset * 7));
    const dayOfWeek = targetDate.getDay();
    const sunday = new Date(targetDate);
    sunday.setDate(targetDate.getDate() - dayOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push(`${yyyy}-${mm}-${dd}`);
    }
  } else if (span === 'month') {
    // Calculate month with offset
    const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push(`${yyyy}-${mm}-${dd}`);
    }
  }
  return days;
};

const AuthenticationModal = ({ habitName, onConfirm, onCancel }) => {
  const [step, setStep] = useState(1);
  const [mathAnswer, setMathAnswer] = useState('');
  const [typedText, setTypedText] = useState('');
  const [countdown, setCountdown] = useState(5);
  
  const [num1] = useState(Math.floor(Math.random() * 20) + 10);
  const [num2] = useState(Math.floor(Math.random() * 20) + 10);
  const correctAnswer = num1 + num2;
  
  const requiredText = `I completed "${habitName}" today`;

  useEffect(() => {
    if (step === 3 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const handleMathSubmit = () => {
    if (parseInt(mathAnswer) === correctAnswer) {
      setStep(2);
      setMathAnswer('');
    } else {
      alert('Incorrect answer. Try again!');
      setMathAnswer('');
    }
  };

  const handleTextSubmit = () => {
    if (typedText === requiredText) {
      setStep(3);
    } else {
      alert('Text must match exactly. Try again!');
      setTypedText('');
    }
  };

  const handleFinalConfirm = () => {
    if (countdown === 0) {
      onConfirm();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={onCancel}
    >
      <div 
        className="card shadow-lg task-item"
        style={{maxWidth: '500px', width: '90%'}}
        onClick={e => e.stopPropagation()}
      >
        <div className="card-body p-4">
          <h3 className="mb-4">🔐 Authentication Challenge</h3>
          
          {step === 1 && (
            <div>
              <p className="mb-3">
                <strong>Step 1 of 3:</strong> Solve this math problem
              </p>
              <div className="mb-3">
                <p className="h4 text-center my-4">{num1} + {num2} = ?</p>
                <input
                  type="number"
                  value={mathAnswer}
                  onChange={e => setMathAnswer(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleMathSubmit()}
                  className="form-control form-control-lg text-center form-control-custom"
                  placeholder="Your answer"
                  autoFocus
                />
              </div>
              <div className="d-flex gap-2">
                <button onClick={onCancel} className="btn btn-outline-secondary flex-grow-1">
                  Cancel
                </button>
                <button onClick={handleMathSubmit} className="btn btn-custom-primary flex-grow-1">
                  Submit
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="mb-3">
                <strong>Step 2 of 3:</strong> Type this text exactly
              </p>
              <div className="alert alert-info mb-3">
                <code>{requiredText}</code>
              </div>
              <input
                type="text"
                value={typedText}
                onChange={e => setTypedText(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleTextSubmit()}
                className="form-control mb-3 form-control-custom"
                placeholder="Type the text above"
                autoFocus
              />
              <div className="d-flex gap-2">
                <button onClick={onCancel} className="btn btn-outline-secondary flex-grow-1">
                  Cancel
                </button>
                <button onClick={handleTextSubmit} className="btn btn-custom-primary flex-grow-1">
                  Submit
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-3">
                <strong>Step 3 of 3:</strong> Final confirmation
              </p>
              <div className="alert alert-warning mb-3">
                <strong>⚠️ Are you certain you completed this habit today?</strong>
                <p className="mb-0 mt-2 small">
                  Being honest with yourself is the foundation of building good habits.
                </p>
              </div>
              <div className="text-center mb-3">
                {countdown > 0 ? (
                  <div>
                    <p className="text-muted">Think about it...</p>
                    <div className="display-4 fw-bold text-primary">{countdown}</div>
                  </div>
                ) : (
                  <div className="text-success fw-bold">✓ Ready to confirm</div>
                )}
              </div>
              <div className="d-flex gap-2">
                <button onClick={onCancel} className="btn btn-outline-secondary flex-grow-1">
                  Cancel
                </button>
                <button 
                  onClick={handleFinalConfirm} 
                  className="btn btn-success flex-grow-1"
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? 'Wait...' : 'Yes, I Did It!'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LogTodayModal = ({ habits, onClose, onToggle }) => {
  const [authModal, setAuthModal] = useState(null);
  const todayStr = new Date().toISOString().split('T')[0];

  const isHabitDueToday = (habit) => {
    console.log('🔍 LogTodayModal.isHabitDueToday called for habit:', habit);
    if (habit.frequency === 1) return true;
    
    const habitStart = new Date(habit.createdAt || todayStr);
    const currentDay = new Date(todayStr);
    const daysDiff = Math.floor((currentDay - habitStart) / (1000 * 60 * 60 * 24));
    
    return daysDiff % habit.frequency === 0;
  };

  const getTodayIndex = (habit) => {
    console.log('📅 LogTodayModal.getTodayIndex for habit:', habit.name);
    const days = getDaysArray('week', 0);
    return days.indexOf(todayStr);
  };

  const isCompletedOn = (habit, dayStr) => {
    const completed = !!(habit.completedByDate && habit.completedByDate[dayStr]);
    console.log('✅ LogTodayModal.isCompletedOn:', { habitId: habit.id, habitName: habit.name, dayStr, completed, completedByDate: habit.completedByDate });
    return completed;
  };

  const handleToggle = (habit) => {
    console.log('🎯 LogTodayModal.handleToggle clicked for habit:', { id: habit.id, name: habit.name });
    const todayIdx = getTodayIndex(habit);
    if (todayIdx === -1) return;

    if (!isHabitDueToday(habit)) {
      alert(`This habit is scheduled every ${habit.frequency} days. Not due today!`);
      return;
    }

    const currentValue = isCompletedOn(habit, todayStr);

    if (!currentValue) {
      setAuthModal({ habitId: habit.id, dayIdx: todayIdx, habitName: habit.name });
    }
  };

  const handleAuthConfirm = () => {
    console.log('🔐 LogTodayModal.handleAuthConfirm called with authModal:', authModal);
    if (authModal) {
      // Use date-based persistence to ensure cross-span correctness
      onToggle(authModal.habitId, todayStr, true);
      setAuthModal(null);
    }
  };

  const dueHabits = habits.filter(h => isHabitDueToday(h));
  const completedToday = dueHabits.filter(h => isCompletedOn(h, todayStr));

  return (
    <>
      {authModal && (
        <AuthenticationModal
          habitName={authModal.habitName}
          onConfirm={handleAuthConfirm}
          onCancel={() => setAuthModal(null)}
        />
      )}
      
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998
        }}
        onClick={onClose}
      >
        <div 
          style={{
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{margin: 0, fontSize: '20px', fontWeight: 'bold'}}>
                📝 Log Today's Habits
              </h3>
              <p style={{margin: '4px 0 0 0', fontSize: '14px', color: '#6c757d'}}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6c757d'
              }}
            >
              ×
            </button>
          </div>

          <div style={{
            padding: '16px 24px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontSize: '14px', color: '#6c757d'}}>
                Progress: {completedToday.length} of {dueHabits.length} habits completed
              </span>
              <div style={{
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: completedToday.length === dueHabits.length && dueHabits.length > 0 ? '#28a745' : '#007bff',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {dueHabits.length > 0 ? Math.round((completedToday.length / dueHabits.length) * 100) : 0}%
              </div>
            </div>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px'
          }}>
            {dueHabits.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6c757d'
              }}>
                <div style={{fontSize: '48px', marginBottom: '16px'}}>🎉</div>
                <p style={{fontSize: '16px', margin: 0}}>
                  No habits due today! Enjoy your day off.
                </p>
              </div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {dueHabits.map(habit => {
                  const todayIdx = getTodayIndex(habit);
                  const isChecked = isCompletedOn(habit, todayStr);
                  
                  return (
                    <div
                      key={habit.id}
                      onClick={isChecked ? undefined : () => handleToggle(habit)}
                      style={{
                        padding: '16px',
                        border: isChecked ? '2px solid #28a745' : '2px solid #e0e0e0',
                        borderRadius: '8px',
                        cursor: isChecked ? 'default' : 'pointer',
                        backgroundColor: isChecked ? '#f0fff4' : 'white',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                      onMouseEnter={e => {
                        if (!isChecked) {
                          e.currentTarget.style.borderColor = '#007bff';
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isChecked) {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: isChecked ? '2px solid #28a745' : '2px solid #ccc',
                        backgroundColor: isChecked ? '#28a745' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isChecked && <span style={{color: 'white', fontSize: '16px'}}>✓</span>}
                      </div>
                      <div style={{flex: 1}}>
                        <div style={{
                          fontWeight: '600',
                          fontSize: '16px',
                          marginBottom: '4px',
                          textDecoration: isChecked ? 'line-through' : 'none',
                          color: isChecked ? '#6c757d' : '#000'
                        }}>
                          {habit.name}
                        </div>
                        <div style={{fontSize: '12px', color: '#6c757d'}}>
                          {habit.frequency === 1 ? 'Daily' : `Every ${habit.frequency} days`}
                        </div>
                      </div>
                      {isChecked && (
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          Done ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#f8f9fa'
          }}>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#007bff',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const HabitGrid = () => {
  const { habits, setHabits, addHabitRemote, toggleHabitRemote, deleteHabitRemote, updateHabitRemote, graphSpan, setGraphSpan, weekOffset, setWeekOffset, monthOffset, setMonthOffset } = useAppContext();
  const [newHabit, setNewHabit] = useState('');
  const [frequency, setFrequency] = useState(1);
  const [showLogModal, setShowLogModal] = useState(false);
  
  const days = getDaysArray(graphSpan, graphSpan === 'week' ? weekOffset : monthOffset);
  const todayStr = new Date().toISOString().split('T')[0];

  const getCurrentPeriodLabel = () => {
    const today = new Date();
    if (graphSpan === 'week') {
      const offset = new Date(today);
      offset.setDate(today.getDate() + (weekOffset * 7));
      const startOfWeek = new Date(offset);
      startOfWeek.setDate(offset.getDate() - offset.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      if (weekOffset === 0) return 'This Week';
      if (weekOffset === -1) return 'Last Week';
      
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      const offset = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
      if (monthOffset === 0) return 'This Month';
      if (monthOffset === -1) return 'Last Month';
      return offset.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const canGoForward = graphSpan === 'week' ? weekOffset < 0 : monthOffset < 0;
  const canGoBackward = graphSpan === 'week' ? weekOffset > -52 : monthOffset > -24; // Limit to 1 year back for weeks, 2 years for months

  useEffect(() => {
    console.log('📆 HabitGrid useEffect[days.length]: adjusting completed arrays for habits. days.length =', days.length);
    setHabits(habits => habits.map(habit => {
      const newLength = days.length;
      const oldLength = habit.completed.length;
      
      if (newLength === oldLength) return habit;
      
      const completed = [...habit.completed];
      if (newLength > oldLength) {
        while (completed.length < newLength) {
          completed.push(false);
        }
      } else {
        completed.length = newLength;
      }
      
      const updated = { ...habit, completed };
      console.log('  🔄 HabitGrid: updated habit.completed length:', { habitId: habit.id, oldLength, newLength });
      return updated;
    }));
  }, [days.length]);

  const isHabitDueToday = (habit, dayIdx, day) => {
    if (habit.frequency === 1) return true; // Daily habit
    
    // Calculate days since habit was created
    const habitStart = new Date(habit.createdAt || day);
    const currentDay = new Date(day);
    const daysDiff = Math.floor((currentDay - habitStart) / (1000 * 60 * 60 * 24));
    
    // Check if this day is a scheduled day based on frequency
    return daysDiff % habit.frequency === 0;
  };

  // local toggle removed; use `toggleHabitRemote` from context to persist

  const addHabit = (e) => {
    if (e) e.preventDefault();
    if (!newHabit.trim()) return;
    
    const today = new Date();
    const createdAt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Persist via backend and update local state
    addHabitRemote(newHabit, frequency).then(() => {});
    setNewHabit('');
    setFrequency(1);
  };

  const deleteHabit = (habitId) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      deleteHabitRemote(habitId);
    }
  };

  const changeHabitFrequency = (habit) => {
    const val = prompt('Enter new frequency (days, use 1 for daily, 7 for weekly):', String(habit.frequency || 1));
    if (!val) return;
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1) return alert('Invalid frequency');
    const updated = { ...habit, frequency: n };
    updateHabitRemote(habit.id, { name: habit.name, frequency: n, createdAt: habit.createdAt, completed: habit.completed }).then(() => {});
  };

  const getCompletionRate = (habit) => {
    // Calculate completion rate based on due days only
    let dueCount = 0;
    let completedCount = 0;
    
    days.forEach((day, idx) => {
      if (isHabitDueToday(habit, idx, day)) {
        dueCount++;
        if (habit.completed[idx]) {
          completedCount++;
        }
      }
    });
    
    return dueCount > 0 ? Math.round((completedCount / dueCount) * 100) : 0;
  };

  const getFrequencyLabel = (freq) => {
    if (freq === 1) return 'Daily';
    if (freq === 2) return 'Every 2 days';
    if (freq === 3) return 'Every 3 days';
    if (freq === 7) return 'Weekly';
    return `Every ${freq} days`;
  };

  const logAllDueHabits = () => {
    console.log('🧮 HabitGrid.logAllDueHabits called');
    const todayStrLocal = new Date().toISOString().split('T')[0];
    const todayIdxByHabit = (habit) => {
      const weekDays = getDaysArray('week', 0);
      return weekDays.indexOf(todayStrLocal);
    };

    habits.forEach(habit => {
      const idx = todayIdxByHabit(habit);
      if (idx === -1) return;
      const due = isHabitDueToday(habit, idx, todayStrLocal);
      const already = habit.completed[idx];
      console.log('  🔎 HabitGrid.logAllDueHabits per habit:', { habitId: habit.id, name: habit.name, idx, due, already });
      if (due && !already) {
        console.log('  ✅ HabitGrid.logAllDueHabits: toggling habit via toggleHabitRemote (index-based)', { habitId: habit.id, idx });
        toggleHabitRemote(habit.id, idx, true);
      }
    });
  };

  return (
    <div>
      {showLogModal && (
        <LogTodayModal
          habits={habits}
          onClose={() => setShowLogModal(false)}
          onToggle={toggleHabitRemote}
        />
      )}

      <div className="mb-4">
        {/* Log Today Button */}
        <button
          onClick={() => setShowLogModal(true)}
          style={{
            width: '100%',
            padding: '16px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#28a745',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span style={{fontSize: '20px'}}>✓</span>
          <span>Log Today's Habits</span>
        </button>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold small mb-2">Time Span</label>
            <div className="btn-group w-100" role="group">
              <button
                className={`btn ${graphSpan === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => {
                  setGraphSpan('week');
                  setWeekOffset(0);
                }}
              >
                Week View
              </button>
              <button
                className={`btn ${graphSpan === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => {
                  setGraphSpan('month');
                  setMonthOffset(0);
                }}
              >
                Month View
              </button>
            </div>
          </div>
          
          <div className="col-md-6">
            <label className="form-label fw-semibold small mb-2">Period</label>
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  if (graphSpan === 'week') setWeekOffset(weekOffset - 1);
                  else setMonthOffset(monthOffset - 1);
                }}
                disabled={!canGoBackward}
                title="Previous period"
              >
                ←
              </button>
              <div className="flex-grow-1 text-center fw-semibold">
                {getCurrentPeriodLabel()}
              </div>
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  if (graphSpan === 'week') setWeekOffset(weekOffset + 1);
                  else setMonthOffset(monthOffset + 1);
                }}
                disabled={!canGoForward}
                title="Next period"
              >
                →
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-light border-0 p-4 mb-4 card-gradient-light">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span style={{fontSize: '20px'}}>➕</span>
            <h4 className="h6 fw-semibold mb-0">Add New Habit</h4>
          </div>
          
          <div className="mb-3">
            <label className="form-label small fw-semibold mb-2">Habit Name</label>
            <input
              type="text"
              value={newHabit}
              onChange={e => setNewHabit(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addHabit(e)}
              placeholder="e.g., Morning Exercise, Read 30 pages, Drink 8 glasses of water"
              className="form-control form-control-lg form-control-custom"
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold mb-2">How often? (Frequency)</label>
            <div className="row g-2">
              {[
                { value: 1, label: 'Every Day', icon: '📅', desc: 'Daily commitment' },
                { value: 2, label: 'Every 2 Days', icon: '🔄', desc: 'Alternate days' },
                { value: 3, label: 'Every 3 Days', icon: '🔄', desc: 'Twice a week' },
                { value: 7, label: 'Weekly', icon: '📆', desc: 'Once per week' }
              ].map(option => (
                <div key={option.value} className="col-6 col-md-3">
                  <div
                    onClick={() => setFrequency(option.value)}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    className={`card h-100 ${frequency === option.value ? 'border-primary bg-primary bg-opacity-10' : 'border'}`}
                  >
                    <div className="card-body p-3 text-center">
                      <div style={{fontSize: '24px'}} className="mb-1">{option.icon}</div>
                      <div className="fw-semibold small">{option.label}</div>
                      <div className="text-muted" style={{fontSize: '10px'}}>{option.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {frequency > 3 && frequency !== 7 && (
              <div className="mt-2">
                <div className="alert alert-info py-2 px-3 mb-0 small">
                  <strong>Custom frequency:</strong> Every {frequency} days
                </div>
              </div>
            )}
            
            <details className="mt-2">
              <summary className="small text-muted" style={{cursor: 'pointer'}}>More frequency options</summary>
              <div className="mt-2 row g-2">
                {[4, 5, 14, 30].map(days => (
                  <div key={days} className="col-6 col-md-3">
                    <button
                      onClick={() => setFrequency(days)}
                      className={`btn btn-sm w-100 ${frequency === days ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      Every {days} days
                    </button>
                  </div>
                ))}
              </div>
            </details>
          </div>

          <button 
            onClick={addHabit} 
            className="btn btn-custom-primary btn-lg w-100"
            disabled={!newHabit.trim()}
          >
            <span className="fw-semibold">Add Habit</span>
          </button>
        </div>
      </div>

     
    </div>
  );
};

export default HabitGrid;