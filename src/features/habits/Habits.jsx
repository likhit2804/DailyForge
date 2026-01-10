import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import HabitGrid from './HabitGrid';
import '../../styles.css';

const Habits = () => {
  const { habits, setHabits, filterBySpan, graphSpan, setGraphSpan, weekOffset, monthOffset } = useAppContext();
  
  console.log('🎯 Habits component - habits from context:', habits, 'is array?', Array.isArray(habits), 'length:', habits?.length);

  const getDaysArray = (span, offset = 0) => {
    const today = new Date();
    if (span === 'week') {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + (offset * 7));
      const dayOfWeek = targetDate.getDay();
      const sunday = new Date(targetDate);
      sunday.setDate(targetDate.getDate() - dayOfWeek);
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        days.push(`${yyyy}-${mm}-${dd}`);
      }
      return days;
    }
    // default: month
    const base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push(`${yyyy}-${mm}-${dd}`);
    }
    return days;
  };

  const days = getDaysArray(graphSpan === 'week' ? 'week' : 'month', graphSpan === 'week' ? weekOffset : monthOffset);
  const completedArrayForHabit = (habit) => days.map(dayStr => !!(habit.completedByDate && habit.completedByDate[dayStr]));

  // Safety check for habits array
  if (!Array.isArray(habits) || habits.length === 0) {
    console.log('⚠️ Habits component - no habits to display');
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>No habits yet. Create your first habit to get started!</p>
      </div>
    );
  }

  const habitsWithStreaks = habits.map(habit => {
    let streak = 0;
    const arr = completedArrayForHabit(habit);
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i]) {
        streak++;
      } else {
        break;
      }
    }
    return { ...habit, streak };
  });

  const longestStreak = habitsWithStreaks.length 
    ? Math.max(...habitsWithStreaks.map(h => h.streak)) 
    : 0;
  
  const avgStreak = habitsWithStreaks.length 
    ? Math.round(habitsWithStreaks.reduce((sum, h) => sum + h.streak, 0) / habitsWithStreaks.length) 
    : 0;

  const totalCompletions = habitsWithStreaks.reduce(
    (sum, h) => sum + completedArrayForHabit(h).filter(Boolean).length, 
    0
  );

  const trendData = habitsWithStreaks.length > 0
    ? days.map((dayStr, dayIdx) => ({
        day: dayIdx + 1,
        completions: habitsWithStreaks.reduce(
          (sum, h) => sum + (completedArrayForHabit(h)[dayIdx] ? 1 : 0),
          0
        )
      }))
    : [];

  return (
    <div style={{
      height: 'calc(100vh - 250px)',
      width: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: 'auto 1fr',
      gap: '16px',
      padding: '16px',
      backgroundColor: '#f8f9fa'
    }}>

      {/* Left Column - Analytics */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'auto'
      }}>
        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <span>📊</span> Analytics
        </h3>
        
        {habits.length > 0 ? (
          <>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px'}}>
                <div style={{fontSize: '11px', color: '#6c757d', marginBottom: '4px'}}>Total Habits</div>
                <div style={{fontSize: '24px', fontWeight: 'bold'}}>{habits.length}</div>
              </div>
              <div style={{padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px'}}>
                <div style={{fontSize: '11px', color: '#6c757d', marginBottom: '4px'}}>Longest Streak</div>
                <div style={{fontSize: '24px', fontWeight: 'bold'}}>{longestStreak}</div>
              </div>
              <div style={{padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px'}}>
                <div style={{fontSize: '11px', color: '#6c757d', marginBottom: '4px'}}>Average Streak</div>
                <div style={{fontSize: '24px', fontWeight: 'bold'}}>{avgStreak}</div>
              </div>
              <div style={{padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px'}}>
                <div style={{fontSize: '11px', color: '#6c757d', marginBottom: '4px'}}>Total Completions</div>
                <div style={{fontSize: '24px', fontWeight: 'bold'}}>{totalCompletions}</div>
              </div>
            </div>

            {/* Activity Heatmap */}
            {trendData.length > 0 && (
              <>
                <div style={{marginBottom: '20px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                    <h4 style={{fontSize: '14px', color: '#6c757d', margin: 0, fontWeight: '600'}}>📅 Activity Heatmap</h4>
                    <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#6c757d'}}>
                      <span>Less</span>
                      <div style={{width: '10px', height: '10px', backgroundColor: '#ebedf0', borderRadius: '2px'}}></div>
                      <div style={{width: '10px', height: '10px', backgroundColor: '#9be9a8', borderRadius: '2px'}}></div>
                      <div style={{width: '10px', height: '10px', backgroundColor: '#40c463', borderRadius: '2px'}}></div>
                      <div style={{width: '10px', height: '10px', backgroundColor: '#30a14e', borderRadius: '2px'}}></div>
                      <div style={{width: '10px', height: '10px', backgroundColor: '#216e39', borderRadius: '2px'}}></div>
                      <span>More</span>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${trendData.length}, 1fr)`,
                    gap: '2px',
                    marginBottom: '8px'
                  }}>
                    {trendData.map((data, idx) => {
                      const maxCompletions = Math.max(...trendData.map(d => d.completions), 1);
                      const intensity = data.completions / maxCompletions;
                      let bgColor = '#ebedf0';
                      if (data.completions > 0) {
                        if (intensity >= 0.8) bgColor = '#216e39';
                        else if (intensity >= 0.6) bgColor = '#30a14e';
                        else if (intensity >= 0.4) bgColor = '#40c463';
                        else bgColor = '#9be9a8';
                      }
                      
                      return (
                        <div
                          key={idx}
                          style={{
                            aspectRatio: '1',
                            backgroundColor: bgColor,
                            borderRadius: '2px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: '1px solid rgba(27, 31, 35, 0.06)'
                          }}
                          title={`Day ${data.day}: ${data.completions} habit${data.completions !== 1 ? 's' : ''} completed`}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'scale(1.2)';
                            e.currentTarget.style.zIndex = '10';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.zIndex = '1';
                          }}
                        />
                      );
                    })}
                  </div>
                  
                  <div style={{fontSize: '10px', color: '#6c757d'}}>
                    {totalCompletions} habits completed
                  </div>
                </div>

                {/* Individual Progress */}
                <div>
                  <h4 style={{fontSize: '14px', color: '#6c757d', marginBottom: '12px', fontWeight: '600'}}>Individual Habit Progress</h4>
                  {habitsWithStreaks.map(habit => {
                    const arr = completedArrayForHabit(habit);
                    const completedDays = arr.filter(Boolean).length;
                    const totalDays = arr.length;
                    
                    return (
                      <div key={habit.id} style={{marginBottom: '12px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
                          <span style={{fontSize: '13px', fontWeight: '600'}}>{habit.name}</span>
                          <span style={{fontSize: '11px', color: '#6c757d'}}>{completedDays} / {totalDays}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '2px',
                          height: '8px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          {completedArrayForHabit(habit).map((completed, idx) => (
                            <div
                              key={idx}
                              style={{
                                flex: 1,
                                backgroundColor: completed ? '#40c463' : 'transparent',
                                transition: 'background-color 0.3s'
                              }}
                              title={`Day ${idx + 1}: ${completed ? 'Completed' : 'Not completed'}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{textAlign: 'center', padding: '40px', color: '#6c757d'}}>
            No habits yet. Add some habits to see analytics!
          </div>
        )}
      </div>

      {/* Right Column - Habit Grid */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'auto'
      }}>
        <HabitGrid habits={habits} setHabits={setHabits} />
      </div>
    </div>
  );
};

export default Habits;