import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TaskItem from '../TaskItem';
import '../App.css';

const API_BASE_URL = 'https://smart-life-os.onrender.com';

function TasksPage() {
  const { taskType = 'general' } = useParams();
  const [allTasks, setAllTasks] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  
  const [newTaskText, setNewTaskText] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [selectedJournalId, setSelectedJournalId] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/tasks`)
      .then(res => res.json())
      .then(data => setAllTasks(data.tasks));
      
    fetch(`${API_BASE_URL}/api/journal`)
      .then(res => res.json())
      .then(data => setJournalEntries(data.entries));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ percentage: newPercentage })
    });
  };

  const handleDeleteTask = (taskId) => {
    fetch(`${API_BASE_URL}/api/tasks/${taskId}`, { method: 'DELETE' })
    .then(() => {
      const updatedTasks = allTasks.filter(task => task.id !== taskId);
      setAllTasks(updatedTasks);
    });
  };

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
        <select value={selectedJournalId} onChange={e => setSelectedJournalId(e.target.value)}>
            <option value="">Link to Journal Entry...</option>
            {journalEntries.map(entry => (
                <option key={entry.id} value={entry.id}>{entry.title}</option>
            ))}
        </select>
        <button type="submit">+</button>
      </form>
      
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