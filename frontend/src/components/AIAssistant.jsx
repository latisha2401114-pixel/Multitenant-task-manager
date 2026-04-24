import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getTaskSuggestions } from '../services/aiService';

const AIAssistant = ({ title, description, onApplySuggestions }) => {
  const [suggestions, setSuggestions] = useState(null);

  const mutation = useMutation({
    mutationFn: () => getTaskSuggestions(title, description),
    onSuccess: (data) => {
      setSuggestions(data);
    }
  });

  const handleGetSuggestions = () => {
    if (!title) {
      alert('Please enter a task title first to get AI suggestions.');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
          ✨ AI Assistant
        </h3>
        <button 
          type="button"
          onClick={handleGetSuggestions} 
          disabled={mutation.isPending || !title}
          className="btn btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          {mutation.isPending ? 'Analyzing...' : 'Get Suggestions'}
        </button>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Let our AI analyze your task title and description to automatically recommend subtasks, determine the correct priority, and set an intelligent deadline.
      </p>

      {mutation.isError && (
        <div style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
          Failed to fetch suggestions: {mutation.error?.message || 'Please try again later.'}
        </div>
      )}

      {suggestions && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suggested Priority</span>
              <div style={{ marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: '600', color: 'var(--accent-warning)' }}>
                {suggestions.priority}
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suggested Deadline</span>
              <div style={{ marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                {new Date(suggestions.suggestedDeadline).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.75rem' }}>Actionable Subtasks</span>
            <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {suggestions.subtasks?.map((st, i) => (
                <li key={i}>{st}</li>
              ))}
            </ul>
          </div>

          <button 
            type="button"
            onClick={() => onApplySuggestions(suggestions)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s ease' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
          >
            Apply Suggestions
          </button>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
