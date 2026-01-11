import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const CATEGORY_OPTIONS = [
  { value: 'motivational', label: 'Motivational' },
  { value: 'focus', label: 'Focus / Concentrate' },
  { value: 'calm', label: 'Calm' },
  { value: 'gratitude', label: 'Gratitude' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'custom', label: 'Custom' },
];

export default function Thoughts() {
  const categoryOptions = useMemo(() => CATEGORY_OPTIONS, []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('motivational');
  const [text, setText] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const docs = await api.getThoughts({});
      setItems(Array.isArray(docs) ? docs : []);
    } catch (e) {
      setError(e?.message || 'Failed to load thoughts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please write an affirmation.');
      return;
    }

    try {
      const created = await api.createThought({ category, text: trimmed });
      window.dispatchEvent(new CustomEvent('thoughts:updated', { detail: { highlightId: created?.id } }));
      setText('');
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to add thought');
    }
  };

  const remove = async (id) => {
    if (!id) return;
    setError('');
    try {
      await api.deleteThought(id);
      setItems(prev => prev.filter(x => x.id !== id));
      window.dispatchEvent(new CustomEvent('thoughts:updated', { detail: { deletedId: id } }));
    } catch (err) {
      setError(err?.message || 'Failed to delete thought');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="section-card">
        <div className="section-title">💡 Affirmations / Banner Content</div>
        <div className="section-subtitle">
          Add short lines that show in the global banner based on mode (motivational, focus, calm…).
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">Add an affirmation</div>

        {error && (
          <div style={{ color: '#b91c1c', fontWeight: 700, marginBottom: 10 }}>
            {error}
          </div>
        )}

        <form onSubmit={add} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Mode</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb' }}
            >
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 700 }}>Text</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Keep it short — it will show in the banner."
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', resize: 'vertical' }}
            />
          </label>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={load}
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 800 }}
            >
              Refresh
            </button>
            <button
              type="submit"
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #4f46e5', background: '#4f46e5', color: '#fff', fontWeight: 800 }}
            >
              Add
            </button>
          </div>
        </form>
      </div>

      <div className="section-card">
        <div className="section-title">Your affirmations</div>
        <div className="section-subtitle">
          {loading ? 'Loading…' : `${items.length} saved`}
        </div>

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.length === 0 && !loading && (
            <div style={{ color: '#6b7280', fontWeight: 600 }}>No affirmations yet. Add one above.</div>
          )}

          {items.map(t => (
            <div
              key={t.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                background: '#fff'
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#111827', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '2px 8px', borderRadius: 999 }}>
                    {t.category}
                  </span>
                </div>
                <div style={{ fontWeight: 800, color: '#111827' }}>{t.text}</div>
              </div>

              <button
                onClick={() => remove(t.id)}
                style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #fecaca', background: '#fff', color: '#b91c1c', fontWeight: 900, cursor: 'pointer' }}
                aria-label="Delete thought"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
