import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaLink } from 'react-icons/fa';
import { apiFetch } from '../api';
import TaskItem from '../TaskItem';
import Modal from '../Modal';
import '../App.css';

function TasksPage() {
  const { taskType = 'general' } = useParams();
  const [allTasks, setAllTasks] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  
  // Form state
  const [newTaskText, setNewTaskText] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [selectedJournalId, setSelectedJournalId] = useState('');
  
  // New state to control the modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    apiFetch('/api/tasks')
      .then(res => res.json())
      .then(data => setAllTasks(data.tasks || []));
      
    apiFetch('/api/journal')
      .then(res => res.json())
      .then(data => setJournalEntries(data.entries || []));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ 
        text: newTaskText,
        due_date: newDueDate || null,
        type: taskType,
        journal_entry_id: selectedJournalId || null
      }),
    })
      .then(res => res.json())
      .then(newTask => {
        setAllTasks([...allTasks, newTask]);
        setNewTaskText('');
        setNewDueDate('');
        setSelectedJournalId('');
      });
  };

  const handleUpdateTask = (taskId, newPercentage) => {
    const updatedTasks = allTasks.map(task =>
      task.id === taskId ? { ...task, percentage: newPercentage } : task
    );
    setAllTasks(updatedTasks);

    apiFetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ percentage: newPercentage })
    });
  };

  const handleDeleteTask = (taskId) => {
    const updatedTasks = allTasks.filter(task => task.id !== taskId);
    setAllTasks(updatedTasks);
    
    apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
  };

  const selectedJournalTitle = journalEntries.find(entry => entry.id === parseInt(selectedJournalId))?.title;

  const displayedTasks = allTasks.filter(task => task.type === taskType);
  const pageTitle = taskType === 'daily' ? 'Daily Tasks' : 'General Tasks';

  return (
    <div>
      <h1>{pageTitle}</h1>
      <form onSubmit={handleSubmit} className="add-task-form">
        <input
          type="text"
          value={newTaskText}
          onChange={e => setNewTaskText(e.target.value)}
          placeholder={`Add a new ${taskType} task...`}
          required
        />
        <input 
          type="date"
          value={newDueDate}
          onChange={e => setNewDueDate(e.target.value)}
          min={today}
        />
        <button type="button" onClick={() => setIsModalOpen(true)} className="link-btn">
          <FaLink />
        </button>
        <button type="submit">+</button>
      </form>

      {selectedJournalTitle && (
          <div className="linked-entry-display">
              Linked to: <strong>{selectedJournalTitle}</strong>
          </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Link to Journal Entry</h2>
        <div className="journal-link-list">
          {journalEntries.map(entry => (
            <div 
              key={entry.id} 
              className="journal-link-item"
              onClick={() => {
                setSelectedJournalId(entry.id);
                setIsModalOpen(false);
              }}
            >
              {entry.title}
            </div>
          ))}
        </div>
      </Modal>

      <ul>
        {displayedTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        ))}
      </ul>
    </div>
  );
}

export default TasksPage;