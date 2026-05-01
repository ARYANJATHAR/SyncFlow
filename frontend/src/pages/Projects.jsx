import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = () => {
    api.get('/projects')
      .then(res => setProjects(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.post('/projects', { name, description });
      setShowModal(false);
      setName('');
      setDescription('');
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-screen" style={{ minHeight: '50vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No projects yet</h3>
          <p>Create your first project to start managing tasks</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <Link to={`/projects/${project._id}`} className="project-card" key={project._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3>{project.name}</h3>
                {project.admin?._id === user?._id && <span className="project-badge">Admin</span>}
              </div>
              <p>{project.description || 'No description'}</p>
              <div className="project-meta">
                <span>👥 {project.members?.length || 0} members</span>
                <span>📅 {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {error && <div className="auth-alert" style={{ marginBottom: '1rem' }}>{error}</div>}
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="project-name">Project Name</label>
                <input id="project-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="My awesome project" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="project-desc">Description</label>
                <textarea id="project-desc" className="form-input form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this project about?" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
