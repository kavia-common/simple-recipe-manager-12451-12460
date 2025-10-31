import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Ocean Professional Theme Tokens
 * Blue (#2563EB) and Amber (#F59E0B) accents, white surfaces, soft gray background,
 * rounded corners, subtle shadows, smooth transitions, minimalist look.
 */
const THEME = {
  colors: {
    primary: '#2563EB', // blue
    secondary: '#F59E0B', // amber
    error: '#EF4444',
    bg: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
    focus: 'rgba(37, 99, 235, 0.35)',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 6px 12px rgba(0,0,0,0.08)',
    lg: '0 12px 24px rgba(0,0,0,0.10)',
  },
  transition: 'all 200ms ease',
};

// Utilities
const uid = () => Math.random().toString(36).slice(2, 9);
const STORAGE_KEY = 'recipe_manager_items_v1';

// PUBLIC_INTERFACE
export function loadRecipes() {
  /** Load recipes from localStorage with fallback demo content. */
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  // Demo seed
  const demo = [
    {
      id: uid(),
      name: 'Lemon Herb Grilled Chicken',
      description: 'Citrusy, juicy chicken with fresh herbs.',
      ingredients: ['2 chicken breasts', '1 lemon', '2 cloves garlic', '1 tbsp olive oil', 'Salt', 'Pepper', 'Fresh parsley'],
      steps: [
        'Whisk lemon juice, zest, minced garlic, olive oil, salt, and pepper.',
        'Marinate chicken for at least 30 minutes.',
        'Grill 5-6 minutes per side until cooked through.',
        'Rest and garnish with chopped parsley.',
      ],
      image: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['Grill', 'Chicken', 'Quick'],
    },
    {
      id: uid(),
      name: 'Creamy Tomato Pasta',
      description: 'Silky tomato cream sauce with al dente pasta.',
      ingredients: ['200g pasta', '1 cup tomato puree', '1/2 cup cream', '1 onion', '2 cloves garlic', 'Olive oil', 'Basil', 'Salt'],
      steps: [
        'Cook pasta until al dente.',
        'Sauté chopped onion and garlic in olive oil.',
        'Add tomato puree and simmer 8 minutes.',
        'Stir in cream, season, add basil.',
        'Toss pasta with sauce and serve.',
      ],
      image: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['Pasta', 'Vegetarian', 'Creamy'],
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  return demo;
}

// PUBLIC_INTERFACE
export function saveRecipes(recipes) {
  /** Persist recipes to localStorage. */
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

// Layout Components
function Navbar({ onAdd, search, setSearch }) {
  return (
    <nav style={styles.navbar.wrapper} aria-label="Top Navigation">
      <div style={styles.navbar.left}>
        <div style={styles.brand.badge} aria-hidden>🍳</div>
        <div>
          <div style={styles.brand.title}>Ocean Recipes</div>
          <div style={styles.brand.subtitle}>Cook, curate, and create</div>
        </div>
      </div>
      <div style={styles.navbar.right}>
        <div style={styles.search.wrapper}>
          <span style={styles.search.icon} aria-hidden>🔎</span>
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search recipes"
            style={styles.search.input}
          />
        </div>
        <button onClick={onAdd} style={styles.buttons.primary} aria-label="Add a new recipe">
          + New Recipe
        </button>
      </div>
    </nav>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div style={styles.empty.wrapper}>
      <div style={styles.empty.card}>
        <div style={styles.empty.emoji} aria-hidden>🧑‍🍳</div>
        <h2 style={styles.empty.title}>No recipes yet</h2>
        <p style={styles.empty.desc}>Start by creating your first recipe. Add ingredients, steps, and an optional image.</p>
        <button onClick={onAdd} style={styles.buttons.primary}>Create Recipe</button>
      </div>
    </div>
  );
}

function RecipeGrid({ recipes, onSelect }) {
  return (
    <div style={styles.grid}>
      {recipes.map((r) => (
        <div key={r.id} style={styles.card} onClick={() => onSelect(r)} role="button" tabIndex={0}
             onKeyDown={(e) => (e.key === 'Enter' ? onSelect(r) : null)} aria-label={`Open ${r.name}`}>
          <div style={styles.cardImage(r.image)} />
          <div style={styles.cardBody}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>{r.name}</h3>
              {Array.isArray(r.tags) && r.tags.length > 0 && (
                <div style={styles.tagRow}>
                  {r.tags.slice(0, 3).map((t) => (
                    <span key={t} style={styles.tag}>{t}</span>
                  ))}
                </div>
              )}
            </div>
            <p style={styles.cardDesc}>{r.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={styles.field.wrapper}>
      <span style={styles.field.label}>{label}</span>
      {children}
    </label>
  );
}

// PUBLIC_INTERFACE
function RecipeForm({ initial, onSave, onCancel }) {
  /** Form for creating or editing a recipe. */
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [ingredients, setIngredients] = useState((initial?.ingredients || []).join('\n'));
  const [steps, setSteps] = useState((initial?.steps || []).join('\n'));
  const [image, setImage] = useState(initial?.image || '');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    const recipe = {
      id: initial?.id || uid(),
      name: name.trim(),
      description: description.trim(),
      ingredients: ingredients.split('\n').map((i) => i.trim()).filter(Boolean),
      steps: steps.split('\n').map((s) => s.trim()).filter(Boolean),
      image: image.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      createdAt: initial?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    onSave(recipe);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form.wrapper}>
      {error && <div style={styles.form.error} role="alert">{error}</div>}
      <div style={styles.form.row}>
        <Field label="Name">
          <input style={styles.input.text} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Classic Pancakes" />
        </Field>
        <Field label="Image URL (optional)">
          <input style={styles.input.text} value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
        </Field>
      </div>
      <Field label="Short Description">
        <input style={styles.input.text} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A quick description" />
      </Field>
      <div style={styles.form.row}>
        <Field label="Ingredients (one per line)">
          <textarea style={styles.input.area} rows={6} value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="- 2 eggs&#10;- 1 cup flour" />
        </Field>
        <Field label="Steps (one per line)">
          <textarea style={styles.input.area} rows={6} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="1) Mix ingredients&#10;2) Cook on medium heat" />
        </Field>
      </div>
      <Field label="Tags (comma separated)">
        <input style={styles.input.text} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Breakfast, Quick, Sweet" />
      </Field>
      <div style={styles.form.footer}>
        <button type="button" onClick={onCancel} style={styles.buttons.ghost}>Cancel</button>
        <button type="submit" style={styles.buttons.primary}>{initial ? 'Save Changes' : 'Create Recipe'}</button>
      </div>
    </form>
  );
}

// PUBLIC_INTERFACE
function Modal({ open, onClose, children, title, actions }) {
  /** Accessible modal with overlay and smooth transitions. */
  if (!open) return null;
  return (
    <div style={styles.modal.overlay} role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
      <div style={styles.modal.card}>
        <div style={styles.modal.header}>
          <h3 style={styles.modal.title}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={styles.modal.close}>✕</button>
        </div>
        <div style={styles.modal.body}>{children}</div>
        {actions && <div style={styles.modal.footer}>{actions}</div>}
      </div>
    </div>
  );
}

function DetailContent({ recipe }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
      <div style={styles.detail.image(recipe?.image)} />
      <div>
        <h4 style={styles.detail.section}>Ingredients</h4>
        <ul style={styles.detail.list}>
          {(recipe?.ingredients || []).map((i, idx) => <li key={idx} style={styles.detail.li}>{i}</li>)}
        </ul>
      </div>
      <div>
        <h4 style={styles.detail.section}>Steps</h4>
        <ol style={styles.detail.list}>
          {(recipe?.steps || []).map((s, idx) => <li key={idx} style={styles.detail.li}>{s}</li>)}
        </ol>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Main Recipe Manager application with Ocean Professional theme and CRUD. */
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState({ type: '', open: false }); // 'view' | 'edit' | 'create' | 'delete'

  // Load from storage
  useEffect(() => {
    setRecipes(loadRecipes());
  }, []);

  // Persist when recipes change
  useEffect(() => {
    if (recipes?.length >= 0) saveRecipes(recipes);
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => {
      const hay = [
        r.name,
        r.description,
        ...(r.ingredients || []),
        ...(r.steps || []),
        ...(r.tags || []),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [recipes, search]);

  const openCreate = () => setModal({ type: 'create', open: true });
  const openView = (r) => {
    setSelected(r);
    setModal({ type: 'view', open: true });
  };
  const openEdit = () => setModal({ type: 'edit', open: true });
  const openDelete = () => setModal({ type: 'delete', open: true });
  const closeModal = () => setModal({ type: '', open: false });

  const handleSaveNew = (recipe) => {
    setRecipes((prev) => [recipe, ...prev]);
    closeModal();
    setSelected(recipe);
    setModal({ type: 'view', open: true });
  };
  const handleSaveEdit = (recipe) => {
    setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? recipe : r)));
    setSelected(recipe);
    setModal({ type: 'view', open: true });
  };
  const handleDelete = () => {
    if (!selected) return;
    setRecipes((prev) => prev.filter((r) => r.id !== selected.id));
    setSelected(null);
    closeModal();
  };

  return (
    <div style={styles.app.wrapper}>
      <div style={styles.app.gradient} />
      <Navbar onAdd={openCreate} search={search} setSearch={setSearch} />

      <main style={styles.main}>
        {filtered.length === 0 ? (
          <EmptyState onAdd={openCreate} />
        ) : (
          <RecipeGrid recipes={filtered} onSelect={openView} />
        )}
      </main>

      {/* View Modal */}
      <Modal
        open={modal.open && modal.type === 'view'}
        onClose={closeModal}
        title={selected?.name}
        actions={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
            <button style={styles.buttons.ghost} onClick={openEdit}>Edit</button>
            <button style={styles.buttons.danger} onClick={openDelete}>Delete</button>
            <button style={styles.buttons.primary} onClick={closeModal}>Close</button>
          </div>
        }
      >
        <p style={styles.detail.description}>{selected?.description}</p>
        <DetailContent recipe={selected} />
      </Modal>

      {/* Create Modal */}
      <Modal
        open={modal.open && modal.type === 'create'}
        onClose={closeModal}
        title="Create Recipe"
        actions={null}
      >
        <RecipeForm onSave={handleSaveNew} onCancel={closeModal} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={modal.open && modal.type === 'edit'}
        onClose={() => setModal({ type: 'view', open: true })}
        title={`Edit: ${selected?.name || ''}`}
        actions={null}
      >
        <RecipeForm initial={selected} onSave={handleSaveEdit} onCancel={() => setModal({ type: 'view', open: true })} />
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={modal.open && modal.type === 'delete'}
        onClose={() => setModal({ type: 'view', open: true })}
        title="Delete Recipe?"
        actions={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
            <button style={styles.buttons.ghost} onClick={() => setModal({ type: 'view', open: true })}>Cancel</button>
            <button style={styles.buttons.danger} onClick={handleDelete}>Delete</button>
          </div>
        }
      >
        <p style={{ color: THEME.colors.muted, margin: 0 }}>
          This action cannot be undone. The recipe will be permanently removed.
        </p>
      </Modal>

      <footer style={styles.footer}>
        <span>Made with ❤️ · Ocean Professional Theme</span>
      </footer>
    </div>
  );
}

export default App;

/* Inline styles ensure the template stays lightweight without extra dependencies */
const styles = {
  app: {
    wrapper: {
      minHeight: '100vh',
      background: THEME.colors.bg,
      color: THEME.colors.text,
      position: 'relative',
    },
    gradient: {
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(135deg, rgba(37,99,235,0.08), rgba(243,244,246,0.2))`,
      pointerEvents: 'none',
    },
  },
  navbar: {
    wrapper: {
      position: 'sticky',
      top: 0,
      zIndex: 10,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
      padding: '16px 20px',
      background: THEME.colors.surface,
      borderBottom: `1px solid ${THEME.colors.border}`,
      boxShadow: THEME.shadow.sm,
      backdropFilter: 'saturate(180%) blur(8px)',
    },
    left: { display: 'flex', alignItems: 'center', gap: 12 },
    right: { display: 'flex', alignItems: 'center', gap: 12 },
  },
  brand: {
    badge: {
      width: 40,
      height: 40,
      borderRadius: THEME.radius.lg,
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(135deg, #2563EB22, #F59E0B22)',
      border: `1px solid ${THEME.colors.border}`,
      boxShadow: THEME.shadow.sm,
    },
    title: { fontSize: 18, fontWeight: 700, letterSpacing: 0.3 },
    subtitle: { fontSize: 12, color: THEME.colors.muted },
  },
  search: {
    wrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: THEME.colors.bg,
      border: `1px solid ${THEME.colors.border}`,
      borderRadius: THEME.radius.lg,
      padding: '10px 12px',
      minWidth: 220,
      transition: THEME.transition,
      boxShadow: THEME.shadow.sm,
    },
    icon: { fontSize: 14, opacity: 0.8 },
    input: {
      outline: 'none',
      border: 'none',
      background: 'transparent',
      width: '100%',
      fontSize: 14,
      color: THEME.colors.text,
    },
  },
  main: {
    maxWidth: 1200,
    margin: '20px auto',
    padding: '0 16px 40px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },
  card: {
    background: THEME.colors.surface,
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    boxShadow: THEME.shadow.sm,
    cursor: 'pointer',
    transition: THEME.transition,
  },
  cardImage: (src) => ({
    height: 140,
    background: src
      ? `center/cover url(${src})`
      : `linear-gradient(135deg, #2563EB11, #F59E0B11)`,
    borderBottom: `1px solid ${THEME.colors.border}`,
  }),
  cardBody: { padding: 14, display: 'grid', gap: 8 },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 700 },
  cardDesc: { margin: 0, fontSize: 13, color: THEME.colors.muted, lineHeight: 1.5 },
  tagRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  tag: {
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 999,
    background: '#2563EB15',
    color: THEME.colors.primary,
    border: `1px solid #2563EB30`,
  },
  empty: {
    wrapper: { display: 'grid', placeItems: 'center', padding: '60px 0' },
    card: {
      width: '100%',
      maxWidth: 560,
      padding: 24,
      borderRadius: THEME.radius.xl,
      background: THEME.colors.surface,
      border: `1px solid ${THEME.colors.border}`,
      boxShadow: THEME.shadow.md,
      textAlign: 'center',
    },
    emoji: { fontSize: 40, marginBottom: 8 },
    title: { margin: '8px 0', fontSize: 22 },
    desc: { margin: '0 0 16px', color: THEME.colors.muted },
  },
  field: {
    wrapper: { display: 'grid', gap: 8, width: '100%' },
    label: { fontSize: 13, fontWeight: 600, color: THEME.colors.muted },
  },
  input: {
    text: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: THEME.radius.md,
      border: `1px solid ${THEME.colors.border}`,
      outline: 'none',
      transition: THEME.transition,
      background: THEME.colors.surface,
      color: THEME.colors.text,
      boxShadow: THEME.shadow.sm,
    },
    area: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: THEME.radius.md,
      border: `1px solid ${THEME.colors.border}`,
      outline: 'none',
      transition: THEME.transition,
      background: THEME.colors.surface,
      color: THEME.colors.text,
      resize: 'vertical',
      boxShadow: THEME.shadow.sm,
    },
  },
  form: {
    wrapper: { display: 'grid', gap: 14 },
    row: { display: 'grid', gap: 14, gridTemplateColumns: '1fr', alignItems: 'start' },
    footer: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
    error: {
      padding: '10px 12px',
      borderRadius: THEME.radius.md,
      border: `1px solid ${THEME.colors.error}40`,
      background: '#EF444410',
      color: '#991B1B',
      fontSize: 13,
    },
  },
  modal: {
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(17,24,39,0.35)',
      display: 'grid',
      placeItems: 'center',
      padding: 16,
      zIndex: 50,
    },
    card: {
      width: '100%',
      maxWidth: 720,
      background: THEME.colors.surface,
      border: `1px solid ${THEME.colors.border}`,
      borderRadius: THEME.radius.xl,
      boxShadow: THEME.shadow.lg,
      overflow: 'hidden',
      animation: 'fadeIn 160ms ease',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      borderBottom: `1px solid ${THEME.colors.border}`,
      background: 'linear-gradient(180deg, #2563EB08, transparent)',
    },
    title: { margin: 0, fontSize: 18, fontWeight: 700 },
    close: {
      border: `1px solid ${THEME.colors.border}`,
      background: THEME.colors.surface,
      borderRadius: 10,
      width: 36, height: 36,
      cursor: 'pointer',
    },
    body: { padding: 16, display: 'grid', gap: 12 },
    footer: {
      display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 12,
      borderTop: `1px solid ${THEME.colors.border}`,
      background: 'linear-gradient(0deg, #F59E0B10, transparent)',
    },
  },
  detail: {
    image: (src) => ({
      height: 200,
      borderRadius: THEME.radius.lg,
      background: src
        ? `center/cover url(${src})`
        : `linear-gradient(135deg, #2563EB11, #F59E0B11)`,
      border: `1px solid ${THEME.colors.border}`,
      boxShadow: THEME.shadow.sm,
    }),
    description: { margin: '4px 0 12px', color: THEME.colors.muted },
    section: { margin: '8px 0', fontSize: 14, color: THEME.colors.text },
    list: { margin: '4px 0 0 20px', color: THEME.colors.text, lineHeight: 1.7 },
    li: { marginBottom: 6 },
  },
  buttons: {
    base: {
      padding: '10px 14px',
      borderRadius: THEME.radius.md,
      border: `1px solid ${THEME.colors.border}`,
      cursor: 'pointer',
      transition: THEME.transition,
      fontWeight: 600,
      boxShadow: THEME.shadow.sm,
      background: THEME.colors.surface,
    },
    primary: {
      padding: '10px 14px',
      borderRadius: THEME.radius.md,
      border: 'none',
      cursor: 'pointer',
      transition: THEME.transition,
      fontWeight: 700,
      background: THEME.colors.primary,
      color: 'white',
      boxShadow: THEME.shadow.md,
    },
    ghost: {
      padding: '10px 14px',
      borderRadius: THEME.radius.md,
      border: `1px solid ${THEME.colors.border}`,
      cursor: 'pointer',
      transition: THEME.transition,
      fontWeight: 600,
      background: THEME.colors.surface,
      color: THEME.colors.text,
    },
    danger: {
      padding: '10px 14px',
      borderRadius: THEME.radius.md,
      border: `1px solid ${THEME.colors.error}30`,
      cursor: 'pointer',
      transition: THEME.transition,
      fontWeight: 700,
      background: '#EF4444',
      color: 'white',
      boxShadow: THEME.shadow.md,
    },
  },
  footer: {
    padding: 16,
    textAlign: 'center',
    color: THEME.colors.muted,
  },
};

// Focus and hover adjustments via dynamic styling
;['input', 'textarea'].forEach(() => {});
