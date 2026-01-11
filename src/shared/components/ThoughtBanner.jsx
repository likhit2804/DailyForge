import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../services/api';

const DEFAULT_CATEGORIES = [
  { id: 'motivational', label: 'Motivational' },
  { id: 'focus', label: 'Focus' },
  { id: 'calm', label: 'Calm' },
  { id: 'gratitude', label: 'Gratitude' },
  { id: 'confidence', label: 'Confidence' },
  { id: 'custom', label: 'Custom' },
];

const pickRandom = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

const MODE_STORAGE_KEY = 'dailyforge.thoughtMode';

export default function ThoughtBanner({ onManage }) {
  const [thoughts, setThoughts] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);
  const thoughtsRef = useRef([]);
  const requestIdRef = useRef(0);

  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(MODE_STORAGE_KEY) || 'all';
    } catch {
      return 'all';
    }
  });

  const categories = useMemo(() => DEFAULT_CATEGORIES, []);
  const modeOptions = useMemo(() => ([
    { id: 'all', label: 'All' },
    ...DEFAULT_CATEGORIES,
  ]), []);

  const refresh = async ({ highlightId, modeOverride } = {}) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const effectiveMode = modeOverride ?? mode;
      const items = await api.getThoughts(effectiveMode && effectiveMode !== 'all' ? { category: effectiveMode } : {});
      if (requestId !== requestIdRef.current) return;
      setThoughts(items);

      const highlighted = highlightId ? items.find(t => String(t.id) === String(highlightId)) : null;
      setCurrent(highlighted || pickRandom(items));
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setThoughts([]);
      setCurrent(null);
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  };

  useEffect(() => {
    thoughtsRef.current = Array.isArray(thoughts) ? thoughts : [];
  }, [thoughts]);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode || 'all');
    } catch {
      // ignore
    }
  }, [mode]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const onThoughtsUpdated = (e) => {
      refresh({ highlightId: e?.detail?.highlightId, modeOverride: e?.detail?.mode });
    };
    window.addEventListener('thoughts:updated', onThoughtsUpdated);
    return () => window.removeEventListener('thoughts:updated', onThoughtsUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const onModeChanged = (e) => {
      const next = e?.detail?.mode;
      if (!next) return;
      const nextMode = String(next);
      setMode(nextMode);
      refresh({ modeOverride: nextMode });
    };
    window.addEventListener('thoughts:modeChanged', onModeChanged);
    return () => window.removeEventListener('thoughts:modeChanged', onModeChanged);
  }, []);

  useEffect(() => {
    // Auto-rotate every 10 seconds.
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent(prev => {
        const pool = thoughtsRef.current;
        const nextPick = pickRandom(pool);
        // Avoid repeating the same text if possible
        if (nextPick && prev && nextPick.id === prev.id && pool.length > 1) {
          return pickRandom(pool.filter(t => t.id !== prev.id));
        }
        return nextPick;
      });
    }, 10 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const currentCategory = useMemo(() => {
    const id = current?.category;
    const found = categories.find(c => c.id === id);
    return found?.label || (id || 'Affirmations');
  }, [current?.category, categories]);

  const chipLabel = useMemo(() => {
    if (mode && mode !== 'all') {
      const found = modeOptions.find(m => m.id === mode);
      return found?.label || mode;
    }
    return currentCategory;
  }, [mode, modeOptions, currentCategory]);

  return (
    <div className="thought-banner" role="button" tabIndex={0} onClick={onManage} onKeyDown={(e) => {
      if (!onManage) return;
      if (e.key === 'Enter' || e.key === ' ') onManage();
    }} style={{ cursor: onManage ? 'pointer' : 'default' }}>
      <div className="tb-left">
        <div className="tb-kicker">Mode</div>
      </div>

      <div className="tb-center">
        <div key={current?.id ?? 'empty'} className="tb-text">
          {loading ? 'Loading…' : (current?.text || 'Add a few affirmations and one will appear here.')}
        </div>
      </div>

      <div className="tb-actions">
        <span className="tb-chip" aria-label="Current mode">{chipLabel}</span>
      </div>
    </div>
  );
}
