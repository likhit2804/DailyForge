import React, { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Achievements.css';
import { useAppContext } from '../../context/AppContext';

const formatDateLocal = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Achievements = () => {
  const {
    achievementCategories,
    setAchievementCategories,
    achievements,
    filterAchievementsByDate,
    addAchievementRemote,
    updateAchievementRemote,
    deleteAchievementRemote,
  } = useAppContext();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formValues, setFormValues] = useState({ title: '', category: '', description: '' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [editingValues, setEditingValues] = useState({ title: '', category: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [plannedItems, setPlannedItems] = useState([]);
  const [newPlannedItem, setNewPlannedItem] = useState('');

  const selectedIsoDate = useMemo(() => {
    return formatDateLocal(selectedDate);
  }, [selectedDate]);

  const todaysAchievements = useMemo(
    () => filterAchievementsByDate(selectedDate),
    [filterAchievementsByDate, selectedDate]
  );

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'All') {
      return todaysAchievements;
    }
    return todaysAchievements.filter(achievement => achievement.category === selectedCategory);
  }, [todaysAchievements, selectedCategory]);

  const achievementsByDate = useMemo(() => {
    return achievements.reduce((acc, achievement) => {
      if (!achievement.dateEarned) {
        return acc;
      }
      acc[achievement.dateEarned] = acc[achievement.dateEarned]
        ? acc[achievement.dateEarned] + 1
        : 1;
      return acc;
    }, {});
  }, [achievements]);

  const handleAddAchievement = async (event) => {
    event.preventDefault();
    if (!formValues.title.trim()) {
      return;
    }
    setIsSubmitting(true);
    const payload = {
      title: formValues.title.trim(),
      category: formValues.category.trim(),
      description: formValues.description.trim(),
      dateEarned: selectedIsoDate,
    };
    const created = await addAchievementRemote(payload);
    if (created) {
      setFormValues({ title: '', category: '', description: '' });
    }
    setIsSubmitting(false);
  };

  const handleStartEdit = (achievement) => {
    setEditingAchievement(achievement);
    setEditingValues({
      title: achievement.title,
      category: achievement.category,
      description: achievement.description,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAchievement) {
      return;
    }
    setIsSubmitting(true);
    await updateAchievementRemote(editingAchievement.id, {
      ...editingValues,
      dateEarned: editingAchievement.dateEarned,
    });
    setEditingAchievement(null);
    setIsSubmitting(false);
  };

  const handleDelete = async (achievementId) => {
    const confirmed = window.confirm('Remove this accomplishment?');
    if (confirmed) {
      await deleteAchievementRemote(achievementId);
    }
  };

  const handleAddCategory = (event) => {
    event.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      return;
    }
    setAchievementCategories((prev) => {
      if (prev.includes(trimmed)) {
        return prev;
      }
      return [...prev, trimmed];
    });
    setNewCategoryName('');
  };

  const handleAddPlannedItem = (event) => {
    event.preventDefault();
    const trimmed = newPlannedItem.trim();
    if (!trimmed) {
      return;
    }
    setPlannedItems((prev) => [...prev, { id: Date.now(), text: trimmed, completed: false }]);
    setNewPlannedItem('');
  };

  const handleTogglePlannedItem = async (itemId) => {
    const item = plannedItems.find(p => p.id === itemId);
    if (!item) return;

    if (!item.completed) {
      // Mark as completed - create an accomplishment
      setIsSubmitting(true);
      const payload = {
        title: item.text,
        category: formValues.category || 'General',
        description: '',
        dateEarned: selectedIsoDate,
      };
      const created = await addAchievementRemote(payload);
      if (created) {
        setPlannedItems((prev) => prev.map(p => 
          p.id === itemId ? { ...p, completed: true } : p
        ));
      }
      setIsSubmitting(false);
    } else {
      // Mark as not completed - remove from accomplishments
      const achievement = todaysAchievements.find(a => a.title === item.text);
      if (achievement) {
        await deleteAchievementRemote(achievement.id);
        setPlannedItems((prev) => prev.map(p => 
          p.id === itemId ? { ...p, completed: false } : p
        ));
      }
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') {
      return null;
    }
    const iso = formatDateLocal(date);
    if (iso === selectedIsoDate) {
      return 'achievement-calendar__tile--selected';
    }
    if (achievementsByDate[iso]) {
      return 'achievement-calendar__tile--active';
    }
    return null;
  };

  return (
    <div className="achievements-page">
      <section className="achievements-panel">
        <header className="achievements-panel__header">
          <div>
            <p className="panel-label">Selected Date</p>
            <h2>{new Date(selectedIsoDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          </div>
          <div className="panel-counts">
            <span className="count-chip">
              {filteredAchievements.length} accomplishment{filteredAchievements.length === 1 ? '' : 's'}
            </span>
          </div>
        </header>

        <form className="achievement-form" onSubmit={handleAddAchievement}>
          <div className="planning-section">
            <h4>What do you plan to accomplish today?</h4>
            <form className="planning-form" onSubmit={handleAddPlannedItem}>
              <input
                placeholder="Add a planned accomplishment..."
                value={newPlannedItem}
                onChange={(event) => setNewPlannedItem(event.target.value)}
              />
              <button type="submit">Add</button>
            </form>
            {plannedItems.length > 0 && (
              <div className="planned-items">
                {plannedItems.map((item) => (
                  <div key={item.id} className="planned-item">
                    <label className="planned-item__label">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleTogglePlannedItem(item.id)}
                        disabled={isSubmitting}
                      />
                      <span className={item.completed ? 'planned-item--completed' : ''}>
                        {item.text}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            <label htmlFor="achievement-title">Title</label>
            <input
              id="achievement-title"
              placeholder="Shipped a feature, hit a milestone..."
              value={formValues.title}
              onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </div>
          <div className="form-row">
            <label>Category</label>
            <div className="category-tabs category-tabs--form">
              {achievementCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`category-tab ${formValues.category === category ? 'category-tab--active' : ''}`}
                  onClick={() => setFormValues((prev) => ({ ...prev, category }))}
                >
                  {category}
                </button>
              ))}
              <button
                type="button"
                className={`category-tab ${formValues.category === '' ? 'category-tab--active' : ''}`}
                onClick={() => setFormValues((prev) => ({ ...prev, category: '' }))}
              >
                Other
              </button>
            </div>
            {formValues.category === '' && (
              <input
                id="achievement-category"
                placeholder="Enter custom category..."
                value={formValues.category}
                onChange={(event) => setFormValues((prev) => ({ ...prev, category: event.target.value }))}
                style={{ marginTop: '8px' }}
              />
            )}
          </div>
          <div className="form-row">
            <label htmlFor="achievement-description">Details</label>
            <textarea
              id="achievement-description"
              rows={3}
              placeholder="Add context so future-you remembers why this mattered."
              value={formValues.description}
              onChange={(event) => setFormValues((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Log accomplishment'}
          </button>
        </form>

        <div className="category-manager">
          <p className="category-manager__label">Quick Categories</p>
          <div className="category-manager__grid">
            {achievementCategories.map((category) => (
              <span
                key={category}
                className="category-chip"
                onClick={() => setFormValues((prev) => ({ ...prev, category }))}
              >
                {category}
              </span>
            ))}
          </div>
          <form className="category-manager__form" onSubmit={handleAddCategory}>
            <input
              placeholder="Add new category"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
            />
            <button type="submit">Add</button>
          </form>
        </div>

        <div className="category-tabs">
          <button
            className={`category-tab ${selectedCategory === 'All' ? 'category-tab--active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All ({todaysAchievements.length})
          </button>
          {achievementCategories.map((category) => {
            const count = todaysAchievements.filter(a => a.category === category).length;
            return (
              <button
                key={category}
                className={`category-tab ${selectedCategory === category ? 'category-tab--active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>

        <div className="achievement-list">
          {filteredAchievements.length === 0 && plannedItems.filter(p => !p.completed).length === 0 && (
            <div className="empty-state">
              <p>No accomplishments logged for this date{selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''} yet.</p>
              <p>Start by planning what you want to accomplish today.</p>
            </div>
          )}

          {/* Show planned items that are not completed */}
          {plannedItems.filter(p => !p.completed).map((item) => (
            <article key={`planned-${item.id}`} className="achievement-card achievement-card--planned">
              <div className="achievement-card__meta">
                <span className="category-pill">Planned</span>
                <time>{new Date(selectedIsoDate).toLocaleDateString()}</time>
              </div>
              <h3>{item.text}</h3>
              <div className="achievement-card__actions">
                <button type="button" onClick={() => handleTogglePlannedItem(item.id)} disabled={isSubmitting}>
                  Mark Complete
                </button>
              </div>
            </article>
          ))}

          {/* Show completed accomplishments */}
          {filteredAchievements.map((achievement) => {
            const isEditing = editingAchievement?.id === achievement.id;
            return (
              <article key={achievement.id} className="achievement-card">
                <div className="achievement-card__meta">
                  <span className="category-pill">{achievement.category || 'General'}</span>
                  <time>{new Date(achievement.dateEarned).toLocaleDateString()}</time>
                </div>

                {!isEditing && (
                  <>
                    <h3>{achievement.title}</h3>
                    {achievement.description && <p>{achievement.description}</p>}
                  </>
                )}

                {isEditing && (
                  <div className="edit-stack">
                    <input
                      value={editingValues.title}
                      onChange={(event) => setEditingValues((prev) => ({ ...prev, title: event.target.value }))}
                    />
                    <input
                      value={editingValues.category}
                      onChange={(event) => setEditingValues((prev) => ({ ...prev, category: event.target.value }))}
                    />
                    <textarea
                      rows={3}
                      value={editingValues.description}
                      onChange={(event) => setEditingValues((prev) => ({ ...prev, description: event.target.value }))}
                    />
                  </div>
                )}

                <div className="achievement-card__actions">
                  {!isEditing && (
                    <>
                      <button type="button" onClick={() => handleStartEdit(achievement)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(achievement.id)}>
                        Delete
                      </button>
                    </>
                  )}

                  {isEditing && (
                    <>
                      <button type="button" onClick={handleSaveEdit} disabled={isSubmitting}>
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingAchievement(null)}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="calendar-panel">
        <h3>Calendar Filter</h3>
        <p>Tap any date to see what you accomplished. Dots mark days with at least one entry.</p>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileClassName={tileClassName}
          tileContent={({ date, view }) => {
            if (view !== 'month') {
              return null;
            }
            const iso = date.toISOString().split('T')[0];
            const count = achievementsByDate[iso];
            return count ? <span className="achievement-dot" data-count={count} /> : null;
          }}
          className="achievement-calendar"
        />
      </aside>
    </div>
  );
};

export default Achievements;
