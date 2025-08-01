import React from 'react';
import { FaTrash, FaLink } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const TaskItem = ({ task, onUpdateTask, onDeleteTask }) => {
  const isComplete = task.percentage === 100;

  const handlePercentageChange = (e) => {
    const newPercentage = parseInt(e.target.value, 10);
    onUpdateTask(task.id, newPercentage);
  };

  return (
    // --- THIS IS THE ONLY LINE THAT CHANGED ---
    <li className={`task-item-redesigned ${task.isPending ? 'pending' : ''}`}>
      <div className="task-info">
        <p className={`task-text ${isComplete ? 'completed' : ''}`}>{task.text}</p>
        <div className="task-meta">
          {task.due_date && (
            <span className="due-date">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
          {task.journal_entry_id && (
            <Link to="/journal" className="journal-link">
              <FaLink /> {task.journal_entry_title}
            </Link>
          )}
        </div>
      </div>

      <div className="task-progress">
        <span className="progress-percentage">{task.percentage}%</span>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={task.percentage}
          className="percentage-slider-redesigned"
          onChange={handlePercentageChange}
        />
      </div>
      
      <div className="delete-icon" onClick={() => onDeleteTask(task.id)}>
        <FaTrash />
      </div>
    </li>
  );
};

export default TaskItem;