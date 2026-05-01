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
        <div className="page-title-group">
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <span style={{ fontSize: '1.2rem', marginRight: '0.25rem' }}>+</span> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No projects yet</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Ready to get started? Create your first project and invite your team to collaborate.
          </p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create First Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <Link to={`/projects/${project._id}`} className="project-card" key={project._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{project.name}</h3>
                {project.admin?._id === user?._id && <span className="project-badge">Admin</span>}
              </div>
              <p>{project.description || 'No description provided for this project.'}</p>
              <div className="project-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                   <div style={{ display: 'flex', marginLeft: '4px' }}>
                    {project.members?.slice(0, 3).map((m, i) => (
                      <div key={i} className="navbar-avatar" style={{ 
                        width: '24px', 
                        height: '24px', 
                        fontSize: '0.7rem', 
                        border: '2px solid #fff',
                        marginLeft: i > 0 ? '-8px' : '0'
                      }}>
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {project.members?.length > 3 && (
                      <div className="navbar-avatar" style={{ 
                        width: '24px', 
                        height: '24px', 
                        fontSize: '0.7rem', 
                        border: '2px solid #fff',
                        marginLeft: '-8px',
                        background: 'var(--border)'
                      }}>
                        +{project.members.length - 3}
                      </div>
                    )}
                  </div>
                  <span style={{ marginLeft: '0.5rem' }}>{project.members?.length || 0} members</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {error && <div className="auth-alert">{error}</div>}
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Redesign" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are the goals of this project?" />
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
