import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, createProject, deleteProject } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Projects.css';

function ProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Project name is required');
    setLoading(true);
    try {
      const res = await createProject(form);
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">New Project</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Project Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Website Redesign"
              required
            />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What is this project about?"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    getProjects()
      .then((res) => setProjects(res.data))
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert('Failed to delete project');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="projects-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">{projects.length} project{projects.length !== 1 ? 's' : ''} you're part of</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {projects.length === 0 ? (
        <div className="empty-state card">
          <h3>No projects yet</h3>
          <p>{isAdmin ? 'Create your first project to get started.' : 'Ask an admin to add you to a project.'}</p>
          {isAdmin && (
            <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => {
            const done = p.tasks?.filter((t) => t.status === 'DONE').length || 0;
            const total = p.tasks?.length || 0;
            const overdue = p.tasks?.filter((t) => t.status === 'OVERDUE').length || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <Link to={`/projects/${p.id}`} key={p.id} className="project-card">
                <div className="project-card-top">
                  <div className="project-icon">{p.name[0].toUpperCase()}</div>
                  <div className="project-actions-top">
                    {isAdmin && (
                      <button
                        className="btn-danger btn-sm"
                        onClick={(e) => handleDelete(p.id, e)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="project-name">{p.name}</h3>
                {p.description && <p className="project-desc">{p.description}</p>}

                <div className="project-meta-row">
                  <span className="project-meta-item">👥 {p.members?.length || 0} members</span>
                  <span className="project-meta-item">📋 {total} tasks</span>
                  {overdue > 0 && <span className="project-meta-item overdue-pill">⚠ {overdue} overdue</span>}
                </div>

                <div className="project-progress">
                  <div className="progress-bar-bg" style={{ width: '100%' }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="progress-pct">{pct}% done</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showModal && (
        <ProjectModal
          onClose={() => setShowModal(false)}
          onCreated={(p) => setProjects((prev) => [p, ...prev])}
        />
      )}
    </div>
  );
}
