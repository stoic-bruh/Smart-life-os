import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate
} from 'react-router-dom';
import TasksPage from './pages/TasksPage';
import JournalPage from './pages/JournalPage';
import './App.css';

function App() {
  const [isTasksOpen, setIsTasksOpen] = useState(true);

  return (
    <Router>
      <div className="app-container">
        <nav className="sidebar">
          <h1 className="sidebar-title">Smart OS</h1>
          
          <div className="nav-item">
            <div className="nav-item-header" onClick={() => setIsTasksOpen(!isTasksOpen)}>
              <span>Tasks</span>
              <span className={`arrow ${isTasksOpen ? 'down' : 'right'}`}></span>
            </div>
            <div className={`submenu ${isTasksOpen ? 'open' : ''}`}>
              <Link to="/tasks/daily">Daily</Link>
              <Link to="/tasks/general">General</Link>
            </div>
          </div>
          
          <hr className="sidebar-divider" />
          <Link to="/journal">Journal</Link>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/tasks/:taskType" element={<TasksPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/" element={<Navigate replace to="/tasks/daily" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;