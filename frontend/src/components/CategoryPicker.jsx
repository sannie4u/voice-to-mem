const CATEGORIES = [
  { id: 'todo',     label: 'Todo'     },
  { id: 'idea',     label: 'Idea'     },
  { id: 'callback', label: 'Call'     },
  { id: 'research', label: 'Research' },
  { id: 'note',     label: 'Note'     },
];

export function CategoryPicker({ selected, onChange }) {
  return (
    <div className="category-picker">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          className={`cat-chip ${selected === cat.id ? 'cat-chip--active' : ''}`}
          onClick={() => onChange(cat.id)}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
