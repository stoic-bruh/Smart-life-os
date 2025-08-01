import React, { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';
import { apiFetch } from '../api';
import '../App.css';

const JournalEditor = ({ entry, onSave, onCancel }) => {
  const [title, setTitle] = useState(entry ? entry.title : '');
  const [content, setContent] = useState(entry ? entry.content : '');

  const handleSave = () => {
    onSave({ ...entry, title, content });
  };

  return (
    <div className="journal-editor">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Entry Title"
        className="editor-title"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your thoughts..."
        className="editor-content"
      ></textarea>
      <div className="editor-actions">
        <button onClick={handleSave}>Save</button>
        <button onClick={onCancel} className="cancel-btn">Cancel</button>
      </div>
    </div>
  );
};


function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState('list');
  const [currentEntry, setCurrentEntry] = useState(null);

  useEffect(() => {
    apiFetch('/api/journal')
      .then((res) => res.json())
      .then((data) => setEntries(data.entries || []));
  }, []);

  const handleSaveEntry = (entryToSave) => {
    const isUpdating = entryToSave.id;

    if (isUpdating) {
      setEntries(entries.map(e => e.id === entryToSave.id ? entryToSave : e));
      setView('list');
      setCurrentEntry(null);
    }

    const method = isUpdating ? 'PUT' : 'POST';
    const url = isUpdating ? `/api/journal/${entryToSave.id}` : '/api/journal';

    apiFetch(url, {
      method: method,
      body: JSON.stringify(entryToSave),
    })
      .then((res) => res.json())
      .then((savedEntry) => {
        if (!isUpdating) {
          setEntries([savedEntry, ...entries]);
          setView('list');
          setCurrentEntry(null);
        }
      });
  };

  const handleDeleteEntry = (entryId) => {
    setEntries(entries.filter(e => e.id !== entryId));
    apiFetch(`/api/journal/${entryId}`, { method: 'DELETE' });
  };

  if (view === 'editor') {
    return (
      <JournalEditor
        entry={currentEntry}
        onSave={handleSaveEntry}
        onCancel={() => { setView('list'); setCurrentEntry(null); }}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Journal</h1>
        <button onClick={() => { setCurrentEntry(null); setView('editor'); }}>
          + New Entry
        </button>
      </div>
      <div className="journal-entries-list">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="journal-list-item"
            onClick={() => {
              setCurrentEntry(entry);
              setView('editor');
            }}
          >
            <div className="item-content">
              <h2>{entry.title}</h2>
              <p className="entry-date">
                {new Date(entry.created_at).toLocaleDateString()}
              </p>
            </div>
            <div
              className="delete-icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteEntry(entry.id);
              }}
            >
              <FaTrash />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default JournalPage;