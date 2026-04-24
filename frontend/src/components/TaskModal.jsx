import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask, createTask } from '../services/taskService';
import AIAssistant from './AIAssistant';

const TaskModal = ({ isOpen, onClose, existingTask = null }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: existingTask?.title || '',
    description: existingTask?.description || '',
    priority: existingTask?.priority || 'MEDIUM',
    status: existingTask?.status || 'OPEN',
    deadline: existingTask?.deadline ? new Date(existingTask.deadline).toISOString().split('T')[0] : ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyAiSuggestions = (suggestions) => {
    setFormData(prev => ({
      ...prev,
      priority: suggestions.priority || prev.priority,
      deadline: suggestions.suggestedDeadline ? new Date(suggestions.suggestedDeadline).toISOString().split('T')[0] : prev.deadline,
      description: prev.description + (suggestions.subtasks && suggestions.subtasks.length > 0 ? '\n\n---\nSuggested Subtasks:\n' + suggestions.subtasks.map(s => `- [ ] ${s}`).join('\n') : '')
    }));
  };

  const mutation = useMutation({
    mutationFn: (data) => existingTask ? updateTask(existingTask.id, { ...data, version: existingTask.version }) : createTask(data),
    onSuccess: () => {
      // Socket.IO handles cache invalidation in real-time, but manual fallback here is safe
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      onClose();
    },
    onError: (error) => {
      alert(error.message || 'An error occurred while saving the task.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    
    // Fix: Zod optional() expects undefined, not null or empty string
    if (payload.deadline) {
      payload.deadline = new Date(payload.deadline).toISOString();
    } else {
      delete payload.deadline;
    }

    // Status is not accepted by createTaskSchema, it handles it via backend logic
    if (!existingTask) {
      delete payload.status;
    }

    mutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyItems: 'center', alignItems: 'center', padding: '1rem', overflowY: 'auto' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', margin: 'auto', padding: '2.5rem', display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
        
        {/* Left Side: Standard Form */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '600' }}>{existingTask ? 'Edit Task' : 'Create New Task'}</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Task Title</label>
              <input name="title" value={formData.title} onChange={handleChange} className="input-field" placeholder="e.g. Implement user authentication" required />
            </div>

            <div className="input-group">
              <label className="input-label">Description & Notes</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="input-field" rows={5} placeholder="Provide additional details..." style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Priority Level</label>
                <select name="priority" value={formData.priority} onChange={handleChange} className="input-field" style={{ cursor: 'pointer' }}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent ⚡</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Target Deadline</label>
                <input name="deadline" type="date" value={formData.deadline} onChange={handleChange} className="input-field" style={{ colorScheme: 'dark' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={onClose} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', flex: '1' }}>Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn btn-primary" style={{ flex: '2' }}>
                {mutation.isPending ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: AI Assistant */}
        <div style={{ flex: '1', minWidth: '300px' }}>
           <AIAssistant 
             title={formData.title} 
             description={formData.description} 
             onApplySuggestions={handleApplyAiSuggestions} 
           />
        </div>

      </div>
    </div>
  );
};

export default TaskModal;
