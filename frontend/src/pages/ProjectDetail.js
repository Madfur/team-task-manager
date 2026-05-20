import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, getTasks, createTask, updateTask, deleteTask, addMember, removeMember } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import './ProjectDetail.css';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE'];
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done', OVERDUE: 'Overdue' };

// ── Task Modal ────────────────────────────────────────────────────────────────
function TaskModal({ task, projectId, members, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = !!task;
  const isAdminUser = user?.role === 'ADMIN';

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'MEDIUM',
    status: task?.status || 'TODO',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    assignedToId: task?.assignedToId || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdminUser && !isEdit) return setError('Only admins can create tasks');
    if (!form.title.trim() && isAdminUser) return setError('Title is required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        assignedToId: form.assignedToId ? parseInt(form.assignedToId) : null,
        dueDate: form.dueDate || null,
      };
      let res;
      if (isEdit) {
        res = await updateTask(task.id, payload);
      } else {
        res = await createTask(projectId, payload);
      }
      onSaved(res.data, isEdit);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isAdminUser && (
            <>
              <div className="form-group">
                <label>Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Member Modal ──────────────────────────────────────────────────────────
function AddMemberModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Email required');
    setLoading(true);
    try {
      const res = await addMember(projectId, { email, projectRole: role });
      onAdded(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">Add Team Member</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com" required />
          </div>
          <div className="form-group">
            <label>Project Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Adding…' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, isAdmin, currentUserId, onEdit, onDelete }) {
  const isMyTask = task.assignedToId === currentUserId;
  return (
    <div className={`task-card priority-${task.priority.toLowerCase()}`}>
      <div className="task-card-header">
        <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
        {isAdmin && (
          <div className="task-card-actions">
            <button className="btn-ghost btn-sm" onClick={() => onEdit(task)}>Edit</button>
            <button className="btn-danger btn-sm" onClick={() => onDelete(task.id)}>✕</button>
          </div>
        )}
        {!isAdmin && isMyTask && (
          <button className="btn-ghost btn-sm" onClick={() => onEdit(task)}>Update Status</button>
        )}
      </div>
      <h4 className="task-title">{task.title}</h4>
      {task.description && <p className="task-desc">{task.description}</p>}
      <div className="task-card-footer">
        {task.assignedTo ? (
          <div className="assignee">
            <div className="avatar-sm">{task.assignedTo.name[0]}</div>
            <span>{task.assignedTo.name}</span>
          </div>
        ) : (
          <span className="unassigned">Unassigned</span>
        )}
        {task.dueDate && (
          <span className={`due-date ${task.status === 'OVERDUE' ? 'overdue' : ''}`}>
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null); // null | 'new' | task object
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  const load = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([getProject(id), getTasks(id)]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleTaskSaved = (saved, isEdit) => {
    setTasks((prev) =>
      isEdit ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev]
    );
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch { alert('Failed to delete task'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await removeMember(id, userId);
      setProject((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.user.id !== userId),
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!project) return null;

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  return (
    <div className="page">
      {/* Header */}
      <div className="detail-header">
        <button className="btn-ghost btn-sm" onClick={() => navigate('/projects')}>← Projects</button>
        <div className="detail-title-row">
          <h1 className="page-title">{project.name}</h1>
          {isAdmin && (
            <button className="btn-primary btn-sm" onClick={() => setTaskModal('new')}>+ Add Task</button>
          )}
        </div>
        {project.description && <p className="page-sub">{project.description}</p>}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'board' ? 'active' : ''}`} onClick={() => setActiveTab('board')}>
          Board <span className="tab-count">{tasks.length}</span>
        </button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
          Members <span className="tab-count">{project.members.length}</span>
        </button>
      </div>

      {/* Board Tab */}
      {activeTab === 'board' && (
        <div className="kanban-board">
          {STATUSES.map((status) => (
            <div key={status} className={`kanban-col col-${status.toLowerCase()}`}>
              <div className="col-header">
                <span className="col-title">{STATUS_LABELS[status]}</span>
                <span className="col-count">{tasksByStatus[status].length}</span>
              </div>
              <div className="col-body">
                {tasksByStatus[status].length === 0 ? (
                  <div className="col-empty">No tasks</div>
                ) : (
                  tasksByStatus[status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isAdmin={isAdmin}
                      currentUserId={user?.id}
                      onEdit={(t) => setTaskModal(t)}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          {isAdmin && (
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setShowMemberModal(true)}>+ Add Member</button>
            </div>
          )}
          <div className="members-list">
            {project.members.map((m) => (
              <div key={m.id} className="member-row">
                <div className="member-avatar">{m.user.name[0]}</div>
                <div className="member-info">
                  <p className="member-name">{m.user.name}</p>
                  <p className="member-email">{m.user.email}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className={`badge badge-${m.projectRole.toLowerCase()}`}>{m.projectRole}</span>
                  {isAdmin && m.user.id !== user.id && (
                    <button className="btn-danger btn-sm" onClick={() => handleRemoveMember(m.user.id)}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {taskModal && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          projectId={parseInt(id)}
          members={project.members}
          onClose={() => setTaskModal(null)}
          onSaved={handleTaskSaved}
        />
      )}
      {showMemberModal && (
        <AddMemberModal
          projectId={parseInt(id)}
          onClose={() => setShowMemberModal(false)}
          onAdded={(m) => setProject((prev) => ({ ...prev, members: [...prev.members, m] }))}
        />
      )}
    </div>
  );
}
