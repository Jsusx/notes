import { useEffect, useState } from 'react';
import { createNote, deleteNote, getNotes, updateNote } from '../api/notes';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { Note } from '../types';

export function NotesPage() {
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mobilePanel, setMobilePanel] = useState<'list' | 'editor'>('list');

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;
  const activeNotes = notes.filter((n) => !n.isArchived);
  const archivedNotes = notes.filter((n) => n.isArchived);

  useEffect(() => {
    void loadNotes();
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobilePanel('list');
    }
  }, [isMobile]);

  async function loadNotes() {
    setLoading(true);
    setError('');
    try {
      const data = await getNotes();
      setNotes(data);
      if (data.length > 0 && !selectedId && !isMobile) {
        setSelectedId(data[0].id);
        setTitle(data[0].title);
        setContent(data[0].content);
      }
    } catch {
      setError('No se pudieron cargar las notas');
    } finally {
      setLoading(false);
    }
  }

  function openEditor(note?: Note) {
    if (note) {
      setSelectedId(note.id);
      setTitle(note.title);
      setContent(note.content);
    }
    setError('');
    if (isMobile) {
      setMobilePanel('editor');
    }
  }

  function selectNote(note: Note) {
    openEditor(note);
  }

  function startNewNote() {
    setSelectedId(null);
    setTitle('');
    setContent('');
    setError('');
    if (isMobile) {
      setMobilePanel('editor');
    }
  }

  function backToList() {
    setMobilePanel('list');
    setError('');
  }

  async function handleSave() {
    setSaving(true);
    setError('');

    try {
      if (selectedId) {
        const updated = await updateNote(selectedId, { title, content });
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      } else {
        const created = await createNote(title || 'Sin título', content);
        setNotes((prev) => [created, ...prev]);
        setSelectedId(created.id);
      }
    } catch {
      setError('No se pudo guardar la nota');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId || !confirm('¿Eliminar esta nota?')) return;

    try {
      await deleteNote(selectedId);
      const remaining = notes.filter((n) => n.id !== selectedId);
      setNotes(remaining);
      if (remaining.length > 0) {
        selectNote(remaining[0]);
        if (isMobile) {
          setMobilePanel('list');
        }
      } else {
        startNewNote();
        if (isMobile) {
          setMobilePanel('list');
        }
      }
    } catch {
      setError('No se pudo eliminar la nota');
    }
  }

  async function handleArchive() {
    if (!selectedId) return;

    try {
      const updated = await updateNote(selectedId, { isArchived: true });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      const next = notes.find((n) => n.id !== selectedId && !n.isArchived);
      if (next) {
        selectNote(next);
      } else {
        startNewNote();
        if (isMobile) {
          setMobilePanel('list');
        }
      }
    } catch {
      setError('No se pudo archivar la nota');
    }
  }

  async function handleRestore(note: Note) {
    try {
      const updated = await updateNote(note.id, { isArchived: false });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      selectNote(updated);
    } catch {
      setError('No se pudo restaurar la nota');
    }
  }

  const layoutClass = [
    'notes-layout',
    isMobile ? 'notes-layout--mobile' : '',
    isMobile && mobilePanel === 'editor' ? 'notes-layout--editor-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark" aria-hidden="true">
            N
          </div>
          <div>
            <h1>Notes</h1>
            <p className="user-email">{user?.email}</p>
          </div>
        </div>
        <div className="topbar-actions">
          <ThemeToggle />
          <button type="button" className="btn-secondary btn-compact" onClick={logout}>
            Salir
          </button>
        </div>
      </header>

      <div className={layoutClass}>
        <aside className="sidebar" aria-label="Lista de notas">
          <div className="sidebar-header">
            <h2>Mis notas</h2>
            <span className="badge">{notes.length}</span>
          </div>

          <button type="button" className="btn-primary full-width" onClick={startNewNote}>
            + Nueva nota
          </button>

          {loading ? (
            <div className="empty-state">
              <p className="muted">Cargando notas...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">Todavía no hay notas</p>
              <p className="muted">Creá tu primera nota para empezar</p>
            </div>
          ) : (
            <>
              <section className="note-list-section">
                <h3>Activas ({activeNotes.length})</h3>
                {activeNotes.length === 0 ? (
                  <p className="muted section-empty">Sin notas activas</p>
                ) : (
                  <ul className="note-list">
                    {activeNotes.map((note) => (
                      <li key={note.id}>
                        <button
                          type="button"
                          className={note.id === selectedId ? 'note-item active' : 'note-item'}
                          onClick={() => selectNote(note)}
                        >
                          <strong>{note.title || 'Sin título'}</strong>
                          <span>{note.content.slice(0, 80) || 'Sin contenido'}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {archivedNotes.length > 0 && (
                <section className="note-list-section">
                  <h3>Archivadas ({archivedNotes.length})</h3>
                  <ul className="note-list">
                    {archivedNotes.map((note) => (
                      <li key={note.id}>
                        <button
                          type="button"
                          className={note.id === selectedId ? 'note-item active' : 'note-item'}
                          onClick={() => selectNote(note)}
                        >
                          <strong>{note.title}</strong>
                          <span>Archivada</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </aside>

        <main className="editor" aria-label="Editor de nota">
          {isMobile && (
            <button type="button" className="btn-back" onClick={backToList}>
              ← Volver a notas
            </button>
          )}

          <div className="editor-card">
            <input
              className="title-input"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="content-input"
              placeholder="Escribí tu nota..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {error && <p className="error">{error}</p>}

          <div className="editor-actions">
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : selectedId ? 'Guardar' : 'Crear'}
            </button>

            {selectedId && selectedNote && !selectedNote.isArchived && (
              <button type="button" className="btn-secondary" onClick={handleArchive}>
                Archivar
              </button>
            )}

            {selectedId && selectedNote?.isArchived && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleRestore(selectedNote)}
              >
                Restaurar
              </button>
            )}

            {selectedId && (
              <button type="button" className="btn-danger" onClick={handleDelete}>
                Eliminar
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
