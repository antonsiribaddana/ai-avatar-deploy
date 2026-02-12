import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { Sparkles, Video, Award, Lock } from 'lucide-react';
import './AuthPage.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const data = await login(formData.email, formData.password);

      // Save JWT token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setMessage('Login successful');

      // Navigate based on user role
      setTimeout(() => {
        navigate(`/${data.user.role}`);
      }, 500);

    } catch (error) {
      setMessage(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-sidebar">
        <div className="sidebar-content">
          <div className="sidebar-logo">
            <Video size={28} color="white" />
          </div>
          <h1>Welcome Back</h1>
          <p>Continue your journey to master communication skills with AI-powered practice sessions.</p>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">
                <Sparkles size={20} color="white" />
              </div>
              <span className="feature-text">AI-powered feedback and analysis</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Video size={20} color="white" />
              </div>
              <span className="feature-text">Real-time avatar interactions</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Award size={20} color="white" />
              </div>
              <span className="feature-text">Track progress and achievements</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Sign In</h2>
            <p>Access your communication training dashboard</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {message && (
            <div className={`alert ${message.includes('successful') ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}

          <div className="switch-auth">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')}>Create one</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
