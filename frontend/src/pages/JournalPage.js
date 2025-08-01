import React, { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';
import '../App.css';

const API_BASE_URL = 'https://smart-life-os.onrender.com';

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
    fetch(`${API_BASE_URL}/api/journal`)
      .then((res) => res.json())
      .then((data) => setEntries(data.entries));
  }, []);

  const handleSaveEntry = (entryToSave) => {
    const isUpdating = entryToSave.id;

    if (isUpdating) {
      // --- Optimistic Update for editing an existing entry ---
      setEntries(entries.map(e => e.id === entryToSave.id ? entryToSave : e));
      setView('list');
      setCurrentEntry(null);
    }

    const method = isUpdating ? 'PUT' : 'POST';
    const url = isUpdating ? `${API_BASE_URL}/api/journal/${entryToSave.id}` : `${API_BASE_URL}/api/journal`;

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryToSave),
    })
      .then((res) => res.json())
      .then((savedEntry) => {
        // For new entries, we add the final saved version from the server.
        // For updated ones, the UI is already updated, but we could refresh
        // the data from the server here if we wanted to be extra safe.
        if (!isUpdating) {
          setEntries([savedEntry, ...entries]);
          setView('list');
          setCurrentEntry(null);
        }
      });
  };
  
  const handleDeleteEntry = (entryId) => {
    // Optimistically remove the entry from the UI immediately
    setEntries(entries.filter(e => e.id !== entryId));

    // Send the delete request to the server in the background
    fetch(`${API_BASE_URL}/api/journal/${entryId}`, { method: 'DELETE' });
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