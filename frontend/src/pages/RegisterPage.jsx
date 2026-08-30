import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate(user.role === 'customer' ? '/customer/dashboard' : '/agent/dashboard', { replace: true });
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await register(form);
      if (response.user.role === 'customer') {
        navigate('/customer/dashboard', { replace: true });
      } else {
        navigate('/agent/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <h1>Create account</h1>
        <p>Join the AI support desk.</p>

        <form onSubmit={handleSubmit} className="stack-form">
          <label>
            <span>Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>

          <label>
            <span>Role</span>
            <select
              name="role"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              <option value="customer">Customer</option>
              <option value="agent">Agent</option>
            </select>
          </label>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
