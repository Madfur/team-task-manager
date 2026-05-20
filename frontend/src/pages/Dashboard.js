import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import './Dashboard.css';

function StatCard({ label, value, color, icon }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;

  const { totalTasks, totalProjects, statusBreakdown, myTasks, overdueTasks, projects } = data;

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Good to see you, <strong>{user.name}</strong></p>
        </div>
        <span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard label="Total Projects" value={totalProjects} color="purple" icon="◈" />
        <StatCard label="Total Tasks" value={totalTasks} color="blue" icon="◉" />
        <StatCard label="In Progress" value={statusBreakdown.IN_PROGRESS} color="yellow" icon="◑" />
        <StatCard label="Completed" value={statusBreakdown.DONE} color="green" icon="◎" />
        <StatCard label="To Do" value={statusBreakdown.TODO} color="grey" icon="○" />
        <StatCard label="Overdue" value={statusBreakdown.OVERDUE} color="red" icon="⚠" />
      </div>

      <div className="dashboard-grid">
        {/* Overdue tasks */}
        {overdueTasks.length > 0 && (
          <section className="dash-section overdue-section">
            <h2 className="section-title">
              <span className="red-dot" /> Overdue Tasks
              <span className="badge badge-overdue">{overdueTasks.length}</span>
            </h2>
            <div className="task-list">
              {overdueTasks.map((task) => (
                <Link key={task.id} to={`/projects/${task.projectId}`} className="task-row overdue-row">
                  <div>
                    <p className="task-name">{task.title}</p>
                    <p className="task-meta">{task.project.name} · Due {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '—'}</p>
                  </div>
                  {task.assignedTo && (
                    <div className="avatar-sm">{task.assignedTo.name[0]}</div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* My tasks */}
        <section className="dash-section">
          <h2 className="section-title">My Tasks</h2>
          {myTasks.length === 0 ? (
            <div className="empty-state"><p>No tasks assigned to you yet.</p></div>
          ) : (
            <div className="task-list">
              {myTasks.map((task) => (
                <Link key={task.id} to={`/projects/${task.projectId}`} className="task-row">
                  <div>
                    <p className="task-name">{task.title}</p>
                    <p className="task-meta">{task.project.name}</p>
                  </div>
                  <span className={`badge badge-${task.status.toLowerCase()}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Projects summary */}
        <section className="dash-section">
          <div className="section-header">
            <h2 className="section-title">Projects</h2>
            <Link to="/projects" className="btn-ghost btn-sm">View all →</Link>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state"><p>You're not part of any projects yet.</p></div>
          ) : (
            <div className="project-list">
              {projects.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="project-row">
                  <div className="project-row-info">
                    <p className="task-name">{p.name}</p>
                    <p className="task-meta">{p.memberCount} members · {p.taskCount} tasks</p>
                  </div>
                  <div className="progress-mini">
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: p.taskCount > 0 ? `${(p.completedCount / p.taskCount) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="progress-pct">
                      {p.taskCount > 0 ? Math.round((p.completedCount / p.taskCount) * 100) : 0}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
