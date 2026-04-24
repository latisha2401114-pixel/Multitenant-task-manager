import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getTasks } from '../services/taskService';
import { getWorkloadInsights } from '../services/insightService';
import KanbanBoard from '../components/KanbanBoard';
import DependencyGraph from '../components/DependencyGraph';
import TaskModal from '../components/TaskModal';
import { useSocket } from '../hooks/useSocket';

const Dashboard = () => {
  const { user, tenant, logout } = useAuth();
  const [view, setView] = React.useState('board'); // 'board' or 'graph'
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);
  
  // Initialize real-time Socket.IO connection
  useSocket();

  const { 
    data: tasks, 
    isLoading: isTasksLoading, 
    isError: isTasksError,
    error: tasksError
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks()
  });

  const {
    data: insights,
    isLoading: isInsightsLoading,
    isError: isInsightsError
  } = useQuery({
    queryKey: ['insights'],
    queryFn: getWorkloadInsights
  });

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'URGENT': return 'var(--accent-danger)';
      case 'HIGH': return 'var(--accent-warning)';
      case 'MEDIUM': return 'var(--accent-primary)';
      case 'LOW': return 'var(--text-secondary)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETED': return 'var(--accent-success)';
      case 'BLOCKED': return 'var(--accent-danger)';
      case 'IN_PROGRESS': return 'var(--accent-warning)';
      case 'OPEN': return 'var(--accent-primary)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back to {tenant?.name}, {user?.firstName || 'User'}!</p>
        </div>
        <button onClick={logout} className="btn btn-primary" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
          Sign Out
        </button>
      </header>

      {/* Insights Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.25rem', fontSize: '1.5rem', fontWeight: '600' }}>Workload Insights</h2>
        
        {isInsightsLoading ? (
          <div className="glass-panel" style={{ padding: '1.5rem', color: 'var(--text-secondary)' }}>Loading insights...</div>
        ) : isInsightsError ? (
          <div className="glass-panel" style={{ padding: '1.5rem', color: 'var(--accent-danger)' }}>Failed to load insights.</div>
        ) : insights ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: insights.overloaded ? '4px solid var(--accent-danger)' : '4px solid var(--accent-success)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: insights.overloaded ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                {insights.overloaded ? '⚠️ Overload Warning' : '✅ Workload Stable'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{insights.suggestion}</p>
            </div>
            
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Risky Tasks ({insights.riskyTasks?.length || 0})
              </h3>
              {insights.riskyTasks?.length > 0 ? (
                <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {insights.riskyTasks.slice(0, 3).map(task => (
                    <li key={task.id}>
                      {task.title} <span style={{ color: getStatusColor(task.status), fontSize: '0.8rem', marginLeft: '0.5rem' }}>[{task.status}]</span>
                    </li>
                  ))}
                  {insights.riskyTasks.length > 3 && <li style={{ color: 'var(--text-secondary)', listStyle: 'none', marginLeft: '-1.2rem', marginTop: '0.5rem' }}>...and {insights.riskyTasks.length - 3} more requiring attention.</li>}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No risky tasks currently! You're all caught up.</p>
              )}
            </div>
          </div>
        ) : null}
      </section>

      {/* Tasks Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Tasks</h2>
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="btn btn-primary"
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              + New Task
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setView('board')} 
              style={{ padding: '0.4rem 1rem', background: view === 'board' ? 'var(--accent-primary)' : 'transparent', color: view === 'board' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
            >
              Kanban Board
            </button>
            <button 
              onClick={() => setView('graph')} 
              style={{ padding: '0.4rem 1rem', background: view === 'graph' ? 'var(--accent-primary)' : 'transparent', color: view === 'graph' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
            >
              Dependency Graph
            </button>
          </div>
        </div>
        
        {isTasksLoading ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading tasks...</div>
        ) : isTasksError ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent-danger)' }}>
            Error: {tasksError?.message || 'Failed to load tasks'}
          </div>
        ) : tasks?.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No tasks found. Get started by creating one!
          </div>
        ) : (
          view === 'board' ? <KanbanBoard tasks={tasks} /> : <DependencyGraph tasks={tasks} />
        )}
      </section>

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
      />
      
    </div>
  );
};

export default Dashboard;
