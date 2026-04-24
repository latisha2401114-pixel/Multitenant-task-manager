import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask } from '../services/taskService';

const COLUMNS = [
  { id: 'OPEN', label: 'To Do', color: 'var(--accent-primary)' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'var(--accent-warning)' },
  { id: 'BLOCKED', label: 'Blocked', color: 'var(--accent-danger)' },
  { id: 'COMPLETED', label: 'Done', color: 'var(--accent-success)' }
];

const KanbanBoard = ({ tasks }) => {
  const queryClient = useQueryClient();
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const mutation = useMutation({
    mutationFn: ({ id, status, version }) => updateTask(id, { status, version }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
    onError: (error) => {
      alert(error.message || 'Failed to update task');
    }
  });

  const handleDragStart = (e, task) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('sourceStatus', task.status);
    e.dataTransfer.effectAllowed = 'move';
    
    // Fix for Firefox required to enable drag
    if(e.dataTransfer.setDragImage) {
        // Optional drag styling could go here
    }
  };

  const handleDragEnd = (e) => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('taskId');
    const sourceStatus = e.dataTransfer.getData('sourceStatus');
    
    if (sourceStatus === newStatus || !taskId) return;

    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    // Trigger update optimistic UI could go here, but for now we rely on React Query invalidation
    mutation.mutate({
      id: taskId,
      status: newStatus,
      version: taskToUpdate.version
    });
  };

  // Group tasks
  const groupedTasks = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id);
    return acc;
  }, {});

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'URGENT': return 'var(--accent-danger)';
      case 'HIGH': return 'var(--accent-warning)';
      case 'MEDIUM': return 'var(--accent-primary)';
      case 'LOW': return 'var(--text-secondary)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', paddingBottom: '1rem' }}>
      {COLUMNS.map(column => (
        <div 
          key={column.id} 
          className="glass-panel" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '500px', 
            backgroundColor: dragOverColumn === column.id ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
            transition: 'background-color 0.2s ease',
            border: dragOverColumn === column.id ? `1px solid ${column.color}` : '1px solid var(--border-color)'
          }}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: column.color }}>{column.label}</h3>
            <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>
              {groupedTasks[column.id].length}
            </span>
          </div>

          <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {groupedTasks[column.id].map(task => (
              <div 
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                style={{ 
                  padding: '1rem', 
                  backgroundColor: 'var(--glass-bg)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  cursor: 'grab',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: draggedTaskId === task.id ? 0.3 : 1,
                  transition: 'transform 0.1s ease',
                  userSelect: 'none'
                }}
                onMouseOver={(e) => { if (draggedTaskId !== task.id) e.currentTarget.style.transform = 'translateY(-2px)'}}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: '500' }}>{task.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    padding: '0.2rem 0.4rem', 
                    borderRadius: 'var(--radius-sm)', 
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: getPriorityColor(task.priority),
                    fontWeight: '600',
                    border: `1px solid rgba(255,255,255,0.1)`
                  }}>
                    {task.priority}
                  </span>
                  {task.deadline && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {groupedTasks[column.id].length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)' }}>
                Drop tasks here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
