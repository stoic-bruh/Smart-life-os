import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaLink } from 'react-icons/fa'; // Import Link icon
import TaskItem from '../TaskItem';
import Modal from '../Modal'; // Import our new Modal component
import '../App.css';

const API_BASE_URL = 'https://smart-life-os.onrender.com';

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
    fetch(`${API_BASE_URL}/api/tasks`).then(res => res.json()).then(data => setAllTasks(data.tasks || []));
    fetch(`${API_BASE_URL}/api/journal`).then(res => res.json()).then(data => setJournalEntries(data.entries || []));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Create a temporary ID and a placeholder task object
    const tempId = Date.now() * -1; // A temporary ID for the key
    const optimisticTask = {
      id: tempId,
      text: newTaskText,
      due_date: newDueDate || null,
      type: taskType,
      percentage: 0,
      journal_entry_id: selectedJournalId || null,
      isPending: true // A flag to style it differently while saving
    };

    // 2. Update the UI immediately with the placeholder
    setAllTasks(currentTasks => [...currentTasks, optimisticTask]);
    
    // Clear the form
    setNewTaskText('');
    setNewDueDate('');
    setSelectedJournalId('');

    // 3. Send the real request to the server
    fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: optimisticTask.text,
        due_date: optimisticTask.due_date,
        type: optimisticTask.type,
        journal_entry_id: optimisticTask.journal_entry_id
      }),
    })
    .then(res => res.json())
    .then(savedTask => {
      // 4. Replace the placeholder with the final task from the server
      setAllTasks(currentTasks =>
        currentTasks.map(task =>
          task.id === tempId ? savedTask : task
        )
      );
    })
    .catch(error => {
        // If the server fails, remove the placeholder
        console.error("Failed to add task:", error);
        setAllTasks(currentTasks => currentTasks.filter(task => task.id !== tempId));
    });
  };
  
  // handleUpdateTask and handleDeleteTask remain unchanged...
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
    // Optimistically remove the task from the UI immediately
    const updatedTasks = allTasks.filter(task => task.id !== taskId);
    setAllTasks(updatedTasks);

    // Send the delete request to the server in the background
    fetch(`${API_BASE_URL}/api/tasks/${taskId}`, { method: 'DELETE' });
  };

  // Find the title of the selected journal entry to display it
  const selectedJournalTitle = journalEntries.find(entry => entry.id === selectedJournalId)?.title;

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
        {/* --- NEW LINK BUTTON --- */}
        <button type="button" onClick={() => setIsModalOpen(true)} className="link-btn">
          <FaLink />
        </button>
        <button type="submit">+</button>
      </form>

      {/* Display linked entry title if one is selected */}
      {selectedJournalTitle && (
          <div className="linked-entry-display">
              Linked to: <strong>{selectedJournalTitle}</strong>
          </div>
      )}

      {/* --- THE MODAL ITSELF --- */}
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