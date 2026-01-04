import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';
import '../../styles.css'; // Import shared CSS

export default function FocusTimer() {
  const { filterBySpan, graphSpan, setGraphSpan } = useAppContext();
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState(false);
  const [sessionLabel, setSessionLabel] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    soundEnabled: true,
    soundVolume: 0.5
  });
  const [dailyGoal, setDailyGoal] = useState(120); // minutes
  const [currentSessionStart, setCurrentSessionStart] = useState(null);
  const [currentSessionType, setCurrentSessionType] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (timerActive && !isPaused && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(seconds => seconds - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [timerActive, isPaused, timerSeconds]);

  const handleTimerComplete = () => {
    if (settings.soundEnabled) {
      playNotificationSound();
    }
    
    // Save session if it was a work session
    if (currentSessionType === 'work') {
      const session = {
        id: Date.now(),
        label: sessionLabel || 'Focus Session',
        notes: sessionNotes,
        duration: timerMinutes,
        startTime: currentSessionStart,
        endTime: new Date().toISOString(),
        type: currentSessionType,
        date: new Date().toISOString().split('T')[0]
      };
      setSessions(prev => [...prev, session]);
      setPomodoroCount(prev => prev + 1);
      // persist session to backend (best-effort)
      try {
        api.createTimerSession({ start: session.startTime, end: session.endTime });
      } catch (err) {
        console.warn('Failed to save session remotely', err);
      }
    }

    // Auto-start next session
    if (pomodoroMode) {
      if (currentSessionType === 'work') {
        if (pomodoroCount > 0 && (pomodoroCount + 1) % 4 === 0) {
          if (settings.autoStartBreaks) {
            startLongBreak();
          } else {
            setTimerActive(false);
            alert('Time for a long break!');
          }
        } else {
          if (settings.autoStartBreaks) {
            startShortBreak();
          } else {
            setTimerActive(false);
            alert('Time for a short break!');
          }
        }
      } else {
        if (settings.autoStartPomodoros) {
          startPomodoro();
        } else {
          setTimerActive(false);
          alert('Break complete! Ready for next session?');
        }
      }
    } else {
      setTimerActive(false);
      alert('Timer complete!');
    }
    
    setSessionLabel('');
    setSessionNotes('');
  };

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = settings.soundVolume;
    
    oscillator.start();
    setTimeout(() => oscillator.stop(), 200);
  };

  const startTimer = () => {
    setTimerSeconds(timerMinutes * 60);
    setTimerActive(true);
    setIsPaused(false);
    setCurrentSessionStart(new Date().toISOString());
    setCurrentSessionType('work');
  };

  const startPomodoro = () => {
    setPomodoroMode(true);
    setTimerMinutes(settings.workDuration);
    setTimerSeconds(settings.workDuration * 60);
    setTimerActive(true);
    setIsPaused(false);
    setCurrentSessionStart(new Date().toISOString());
    setCurrentSessionType('work');
  };

  const startShortBreak = () => {
    setTimerMinutes(settings.shortBreakDuration);
    setTimerSeconds(settings.shortBreakDuration * 60);
    setTimerActive(true);
    setIsPaused(false);
    setCurrentSessionStart(new Date().toISOString());
    setCurrentSessionType('shortBreak');
  };

  const startLongBreak = () => {
    setTimerMinutes(settings.longBreakDuration);
    setTimerSeconds(settings.longBreakDuration * 60);
    setTimerActive(true);
    setIsPaused(false);
    setCurrentSessionStart(new Date().toISOString());
    setCurrentSessionType('longBreak');
  };

  const pauseTimer = () => setIsPaused(true);
  const resumeTimer = () => setIsPaused(false);
  
  const snoozeTimer = (minutes) => {
    setTimerSeconds(prev => prev + minutes * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Statistics calculations
  const stats = useMemo(() => {
    const filtered = filterBySpan(sessions);
    const totalMinutes = filtered.reduce((sum, s) => sum + s.duration, 0);
    const avgSession = filtered.length ? totalMinutes / filtered.length : 0;
    
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.date === today);
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    
    return {
      totalMinutes,
      totalSessions: filtered.length,
      avgSession: avgSession.toFixed(1),
      todayMinutes,
      todaySessions: todaySessions.length
    };
  }, [sessions, graphSpan]);

  // Chart data for daily breakdown
  const chartData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const daySessions = sessions.filter(s => s.date === dateStr);
      const minutes = daySessions.reduce((sum, s) => sum + s.duration, 0);
      last7Days.push({
        date: dateStr.slice(5),
        minutes,
        sessions: daySessions.length
      });
    }
    return last7Days;
  }, [sessions]);

  // Progress circle calculation
  const progress = timerActive ? ((timerMinutes * 60 - timerSeconds) / (timerMinutes * 60)) * 100 : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Break reminder check
  useEffect(() => {
    if (timerActive && currentSessionType === 'work' && timerMinutes >= 60) {
      const elapsed = timerMinutes * 60 - timerSeconds;
      if (elapsed > 0 && elapsed % 3600 === 0) {
        alert('You\'ve been working for an hour! Consider taking a break.');
      }
    }
  }, [timerSeconds, timerActive, currentSessionType]);

  return (
    <div className="container py-4" style={{maxWidth: '1200px'}}>
      <div className="card shadow mb-4">
        <div className="card-body">
          <h2 className="card-title d-flex align-items-center gap-3 mb-4">
            <span className="badge bg-primary rounded-pill p-2">⏱️</span>
            Focus Timer
          </h2>

          {/* Time Period Filter */}
          <div className="mb-3">
            <label className="form-label fw-bold">Statistics Period</label>
            <div className="btn-group w-100" role="group">
              <button className={`btn ${graphSpan === 'week' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setGraphSpan('week')}>Week</button>
              <button className={`btn ${graphSpan === 'month' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setGraphSpan('month')}>Month</button>
              <button className={`btn ${graphSpan === 'year' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setGraphSpan('year')}>Year</button>
              <button className={`btn ${graphSpan === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setGraphSpan('all')}>All Time</button>
            </div>
          </div>

          {/* Statistics Dashboard */}
          <div className="card mb-3 card-gradient-primary">
            <div className="card-body">
              <h3 className="mb-3">📊 Statistics</h3>
              <div className="row mb-3">
                <div className="col-6 col-md-3 mb-2">
                  <div className="stat-card">
                    <div className="text-muted small">Total Time</div>
                    <div className="fw-bold">{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</div>
                  </div>
                </div>
                <div className="col-6 col-md-3 mb-2">
                  <div className="stat-card">
                    <div className="text-muted small">Total Sessions</div>
                    <div className="fw-bold">{stats.totalSessions}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3 mb-2">
                  <div className="stat-card">
                    <div className="text-muted small">Avg Session</div>
                    <div className="fw-bold">{stats.avgSession} min</div>
                  </div>
                </div>
                <div className="col-6 col-md-3 mb-2">
                  <div className="stat-card">
                    <div className="text-muted small">Today</div>
                    <div className="fw-bold">{stats.todayMinutes} min ({stats.todaySessions})</div>
                  </div>
                </div>
              </div>

              {/* Daily Goal Progress */}
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-bold">Daily Goal</span>
                  <span className="text-muted">{stats.todayMinutes} / {dailyGoal} min</span>
                </div>
                <div className="progress progress-custom">
                  <div 
                    className="progress-bar" 
                    style={{
                      width: `${Math.min((stats.todayMinutes / dailyGoal) * 100, 100)}%`,
                      backgroundColor: stats.todayMinutes >= dailyGoal ? '#48bb78' : '#4299e1'
                    }}
                  >
                    {Math.round((stats.todayMinutes / dailyGoal) * 100)}%
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="minutes" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Timer Display with Circular Progress */}
          <div className="text-center p-4 mb-3">
            <div className="position-relative d-inline-block mb-4">
              <svg width="280" height="280">
                <circle
                  cx="140"
                  cy="140"
                  r="120"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />
                <circle
                  cx="140"
                  cy="140"
                  r="120"
                  fill="none"
                  stroke={currentSessionType === 'work' ? '#667eea' : '#48bb78'}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 140 140)"
                  style={{transition: 'stroke-dashoffset 1s linear'}}
                />
              </svg>
              <div className="position-absolute top-50 start-50 translate-middle text-center">
                <div className="timer-display-text">
                  {timerActive ? formatTime(timerSeconds) : `${timerMinutes}:00`}
                </div>
                <div className="text-muted small">
                  {currentSessionType === 'work' ? '🎯 Focus' : '☕ Break'}
                </div>
              </div>
            </div>

            {!timerActive && (
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="What are you working on?"
                  value={sessionLabel}
                  onChange={e => setSessionLabel(e.target.value)}
                  className="form-control mb-2 mx-auto form-control-custom"
                  style={{maxWidth: '400px'}}
                />
                <textarea
                  placeholder="Session notes (optional)"
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  className="form-control mb-3 mx-auto form-control-custom"
                  style={{maxWidth: '400px', height: '80px'}}
                />
              </div>
            )}

            <div className="d-flex gap-2 justify-content-center flex-wrap mb-3">
              {!timerActive ? (
                <>
                  <button className="btn btn-custom-primary" onClick={startTimer}>
                    Start Custom ({timerMinutes} min)
                  </button>
                  <button className="btn btn-success" onClick={startPomodoro}>
                    🍅 Pomodoro ({settings.workDuration} min)
                  </button>
                  <button className="btn btn-info" onClick={startShortBreak}>
                    ☕ Short Break ({settings.shortBreakDuration} min)
                  </button>
                  <button className="btn btn-warning" onClick={startLongBreak}>
                    🌴 Long Break ({settings.longBreakDuration} min)
                  </button>
                </>
              ) : (
                <>
                  {!isPaused ? (
                    <button className="btn btn-warning" onClick={pauseTimer}>
                      ⏸️ Pause
                    </button>
                  ) : (
                    <button className="btn btn-success" onClick={resumeTimer}>
                      ▶️ Resume
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={() => snoozeTimer(5)}>
                    ⏰ +5 min
                  </button>
                  <button className="btn btn-danger" onClick={() => {
                    setTimerActive(false);
                    setPomodoroMode(false);
                    setSessionLabel('');
                    setSessionNotes('');
                  }}>
                    ⏹️ Stop
                  </button>
                </>
              )}
            </div>

            {pomodoroMode && (
              <div className="badge bg-success p-2">
                🍅 Pomodoro Mode: Session {pomodoroCount + 1}
              </div>
            )
            }
          </div>

          {/* Settings */}
          <div className="card mb-3 card-gradient-light">
            <div className="card-body">
              <h3 className="mb-3">⚙️ Settings</h3>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small">Custom Duration (min)</label>
                  <input
                    type="number"
                    value={timerMinutes}
                    onChange={e => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={timerActive}
                    className="form-control form-control-custom"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Daily Goal (min)</label>
                  <input
                    type="number"
                    value={dailyGoal}
                    onChange={e => setDailyGoal(Math.max(1, parseInt(e.target.value) || 1))}
                    className="form-control form-control-custom"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Work Duration (min)</label>
                  <input
                    type="number"
                    value={settings.workDuration}
                    onChange={e => setSettings(s => ({...s, workDuration: Math.max(1, parseInt(e.target.value) || 25)}))}
                    className="form-control form-control-custom"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Short Break (min)</label>
                  <input
                    type="number"
                    value={settings.shortBreakDuration}
                    onChange={e => setSettings(s => ({...s, shortBreakDuration: Math.max(1, parseInt(e.target.value) || 5)}))}
                    className="form-control form-control-custom"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Long Break (min)</label>
                  <input
                    type="number"
                    value={settings.longBreakDuration}
                    onChange={e => setSettings(s => ({...s, longBreakDuration: Math.max(1, parseInt(e.target.value) || 15)}))}
                    className="form-control form-control-custom"
                  />
                </div>
                <div className="col-md-6">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.autoStartBreaks}
                      onChange={e => setSettings(s => ({...s, autoStartBreaks: e.target.checked}))}
                    />
                    <label className="form-check-label">Auto-start breaks</label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.autoStartPomodoros}
                      onChange={e => setSettings(s => ({...s, autoStartPomodoros: e.target.checked}))}
                    />
                    <label className="form-check-label">Auto-start work sessions</label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={e => setSettings(s => ({...s, soundEnabled: e.target.checked}))}
                    />
                    <label className="form-check-label">Sound notifications</label>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.soundVolume}
                    onChange={e => setSettings(s => ({...s, soundVolume: parseFloat(e.target.value)}))}
                    className="form-range"
                    disabled={!settings.soundEnabled}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Session History */}
          <div className="card card-gradient-primary">
            <div className="card-body">
              <h3 className="mb-3">📋 Session History</h3>
              {sessions.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <div style={{fontSize: '2rem'}}>⏱️</div>
                  <p>No sessions yet. Start your first focus session!</p>
                </div>
              ) : (
                <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                  {[...sessions].reverse().map(session => (
                    <div key={session.id} className="task-item p-3 mb-2 rounded border-start border-4 border-primary">
                      <div className="flex-grow-1">
                        <div className="fw-bold">{session.label}</div>
                        <div className="text-muted small">{session.date} • {session.duration} minutes</div>
                        {session.notes && <div className="small mt-1 text-secondary">{session.notes}</div>}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary">{session.duration}m</span>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => setSessions(prev => prev.filter(s => s.id !== session.id))}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}