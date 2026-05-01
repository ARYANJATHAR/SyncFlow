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
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your projects and tasks</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-value">{stats.totalProjects}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{stats.totalTasks}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.tasksByStatus?.['Done'] || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{stats.overdueTasks}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="dashboard-section">
          <h2>Tasks by Status</h2>
          <div className="card">
            {['To Do', 'In Progress', 'Done'].map(status => {
              const count = stats.tasksByStatus?.[status] || 0;
              const pct = stats.totalTasks ? (count / stats.totalTasks) * 100 : 0;
              const color = status === 'To Do' ? 'var(--status-todo)' : status === 'In Progress' ? 'var(--status-progress)' : 'var(--status-done)';
              return (
                <div key={status} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                    <span>{status}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.6s ease' }}></div>
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
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tasks assigned yet</p>
            ) : (
              Object.entries(stats.tasksByUser).map(([name, count]) => (
                <div key={name} className="user-stat-row">
                  <span>{name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, marginLeft: '1rem' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div className="user-stat-bar" style={{ width: `${(count / maxUserTasks) * 100}%` }}></div>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', minWidth: '1.5rem', textAlign: 'right' }}>{count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {stats.recentTasks?.length > 0 && (
        <div className="dashboard-section" style={{ marginTop: '1rem' }}>
          <h2>Recent Tasks</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.recentTasks.map(task => (
              <div key={task._id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{task.title}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.75rem' }}>
                    {task.project?.name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`task-priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{task.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
