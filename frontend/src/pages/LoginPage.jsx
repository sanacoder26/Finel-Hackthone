import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
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
      const response = await login(form);
      const nextUser = response.user;
      if (nextUser.role === 'customer') {
        navigate('/customer/dashboard', { replace: true });
      } else {
        navigate('/agent/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <h1>Welcome back</h1>
        <p>Sign in to the support desk.</p>

        <form onSubmit={handleSubmit} className="stack-form">
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

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          Need an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
