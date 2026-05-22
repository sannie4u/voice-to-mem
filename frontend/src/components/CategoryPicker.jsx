const CATEGORIES = [
  { id: 'todo',     label: '✓ Todo',     color: '#22c55e' },
  { id: 'idea',     label: '💡 Idea',    color: '#f59e0b' },
  { id: 'callback', label: '📞 Call',    color: '#3b82f6' },
  { id: 'research', label: '🔍 Research',color: '#8b5cf6' },
  { id: 'note',     label: '📝 Note',    color: '#6b7280' },
];

export function CategoryPicker({ selected, onChange }) {
  return (
    <div className="category-picker">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          className={`cat-chip ${selected === cat.id ? 'cat-chip--active' : ''}`}
          style={selected === cat.id ? { borderColor: cat.color, color: cat.color } : {}}
          onClick={() => onChange(cat.id)}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
