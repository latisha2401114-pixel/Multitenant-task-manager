import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    tenantName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(
        formData.tenantName,
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      navigate('/');
    } catch (err) {
      // Handle Zod array errors or standard errors
      if (Array.isArray(err.message)) {
        setError(err.message[0]?.message || 'Validation error');
      } else {
        setError(err.message || 'Failed to register');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card glass-panel" style={{ maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Workspace</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Set up a new AI-powered task environment.</p>
        </div>

        {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="tenantName">Workspace Name</label>
            <input id="tenantName" type="text" className="input-field" placeholder="Acme Corp" value={formData.tenantName} onChange={handleChange} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="firstName">First Name</label>
              <input id="firstName" type="text" className="input-field" placeholder="Jane" value={formData.firstName} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="lastName">Last Name</label>
              <input id="lastName" type="text" className="input-field" placeholder="Doe" value={formData.lastName} onChange={handleChange} />
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email Address</label>
            <input id="email" type="email" className="input-field" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
          </div>
          
          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input-field" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength={8} />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading} style={{ marginTop: '1rem' }}>
            {isLoading ? 'Creating Workspace...' : 'Create Workspace'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have a workspace? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '500' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
