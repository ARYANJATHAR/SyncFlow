import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-screen" style={{ minHeight: '50vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!stats) return <div className="page"><p>Failed to load dashboard.</p></div>;

  const maxUserTasks = Math.max(...Object.values(stats.tasksByUser || {}), 1);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your productivity at a glance</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalProjects}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalTasks}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.tasksByStatus?.['Done'] || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.overdueTasks}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        <div className="dashboard-section">
          <h2>Tasks by Status</h2>
          <div className="card" style={{ padding: '2rem' }}>
            {['To Do', 'In Progress', 'Done'].map(status => {
              const count = stats.tasksByStatus?.[status] || 0;
              const pct = stats.totalTasks ? (count / stats.totalTasks) * 100 : 0;
              const color = status === 'To Do' ? 'var(--status-todo)' : status === 'In Progress' ? 'var(--status-progress)' : 'var(--status-done)';
              return (
                <div key={status} style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{status}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{count}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '10px', transition: 'width 1s ease' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Tasks per User</h2>
          <div className="user-stats-list">
            {Object.keys(stats.tasksByUser || {}).length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No tasks assigned yet</p>
              </div>
            ) : (
              Object.entries(stats.tasksByUser).map(([name, count]) => (
                <div key={name} className="user-stat-row card" style={{ padding: '1rem 1.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                    <div className="navbar-avatar" style={{ width: '32px', height: '32px', flexShrink: 0 }}>{name.charAt(0).toUpperCase()}</div>
                    <span style={{ fontWeight: '500', minWidth: '80px' }}>{name}</span>
                    <div style={{ flex: 1, height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div className="user-stat-bar" style={{ width: `${(count / maxUserTasks) * 100}%` }}></div>
                    </div>
                    <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {stats.recentTasks?.length > 0 && (
        <div className="dashboard-section" style={{ marginTop: '2rem' }}>
          <h2>Recent Activity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.recentTasks.map(task => (
              <div key={task._id} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{task.title}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {task.project?.name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span className={`task-priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '700', 
                    textTransform: 'uppercase', 
                    color: task.status === 'Done' ? 'var(--success)' : 'var(--text-muted)' 
                  }}>{task.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
