import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMsg, setMemberMsg] = useState('');

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskError, setTaskError] = useState('');
  const [taskSaving, setTaskSaving] = useState(false);

  const isAdmin = project?.admin?._id === user?._id;

  const fetchData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskTitle(''); setTaskDesc(''); setTaskDue('');
    setTaskPriority('Medium'); setTaskAssignee(''); setTaskError('');
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskDue(task.dueDate ? task.dueDate.split('T')[0] : '');
    setTaskPriority(task.priority);
    setTaskAssignee(task.assignedTo?._id || '');
    setTaskError('');
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setTaskSaving(true);
    setTaskError('');
    try {
      const body = {
        title: taskTitle, description: taskDesc,
        dueDate: taskDue, priority: taskPriority,
        assignedTo: taskAssignee || null
      };
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, body);
      } else {
        await api.post(`/projects/${id}/tasks`, body);
      }
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setTaskSaving(false);
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const addMember = async () => {
    setMemberMsg('');
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      setMemberEmail('');
      fetchData();
      setMemberMsg('Member added!');
    } catch (err) {
      setMemberMsg(err.response?.data?.message || 'Failed to add member.');
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProject = async () => {
    if (!window.confirm('Delete this entire project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (d) => d && new Date(d) < new Date();

  if (loading) {
    return (
      <div className="page">
        <div className="loading-screen" style={{ minHeight: '50vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!project) return <div className="page"><p>Project not found.</p></div>;

  const columns = [
    { key: 'To Do', cls: 'todo' },
    { key: 'In Progress', cls: 'progress' },
    { key: 'Done', cls: 'done' }
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">{project.description || 'No description'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isAdmin && (
            <>
              <button className="btn btn-primary" onClick={openCreateTask}>+ Add Task</button>
              <button className="btn btn-danger btn-sm" onClick={deleteProject}>Delete Project</button>
            </>
          )}
        </div>
      </div>

      {/* Members Section */}
      <div className="members-section">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
          Members ({project.members?.length || 0})
        </h2>
        <div className="members-list">
          {project.members?.map(m => (
            <div className="member-chip" key={m._id}>
              <div className="navbar-avatar" style={{ width: 24, height: 24, fontSize: '0.65rem' }}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <span>{m.name}</span>
              {m._id === project.admin._id && <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>(Admin)</span>}
              {isAdmin && m._id !== project.admin._id && (
                <button className="remove-btn" onClick={() => removeMember(m._id)}>×</button>
              )}
            </div>
          ))}
        </div>
        {isAdmin && (
          <div className="add-member-row">
            <input className="form-input" placeholder="Enter member email" value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)} />
            <button className="btn btn-secondary btn-sm" onClick={addMember}>Add</button>
          </div>
        )}
        {memberMsg && <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: memberMsg.includes('added') ? 'var(--success)' : 'var(--danger)' }}>{memberMsg}</p>}
      </div>

      {/* Task Board */}
      <div className="task-board">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div className={`task-column ${col.cls}`} key={col.key}>
              <div className="task-column-header">
                <span className="task-column-title">{col.key}</span>
                <span className="task-column-count">{colTasks.length}</span>
              </div>
              <div className="task-list">
                {colTasks.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No tasks</p>
                ) : (
                  colTasks.map(task => (
                    <div className="task-card" key={task._id}>
                      <div className="task-card-title">{task.title}</div>
                      <div className="task-card-meta">
                        <span className={`task-priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                        <span className={`task-due ${isOverdue(task.dueDate) && task.status !== 'Done' ? 'overdue' : ''}`}>
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                      {task.assignedTo && (
                        <div className="task-assignee">→ {task.assignedTo.name}</div>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                        <select className="status-select" value={task.status}
                          onChange={(e) => updateStatus(task._id, e.target.value)}>
                          <option>To Do</option>
                          <option>In Progress</option>
                          <option>Done</option>
                        </select>
                        {isAdmin && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEditTask(task)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteTask(task._id)}>Del</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTask ? 'Edit Task' : 'Create Task'}</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>×</button>
            </div>
            {taskError && <div className="auth-alert" style={{ marginBottom: '1rem' }}>{taskError}</div>}
            <form className="modal-form" onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input form-select" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-input form-select" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {project.members?.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={taskSaving}>
                  {taskSaving ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
