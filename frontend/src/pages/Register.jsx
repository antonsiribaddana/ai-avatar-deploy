import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { Sparkles, Video, Award, Baby, GraduationCap, Briefcase } from 'lucide-react';
import './AuthPage.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'professional'
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'kid', icon: Baby, label: 'Kid', desc: 'Ages 6-12' },
    { value: 'teen', icon: GraduationCap, label: 'Teen', desc: 'Ages 13-17' },
    { value: 'professional', icon: Briefcase, label: 'Professional', desc: 'Ages 18+' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const data = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );

      // Save JWT token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setMessage('Account created successfully');

      // Navigate based on user role
      setTimeout(() => {
        navigate(`/${data.user.role}`);
      }, 800);

    } catch (error) {
      setMessage(error.response?.data?.error || 'Registration failed');
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
          <h1>Master Communication with AI</h1>
          <p>Practice presentations, interviews, and conversations with intelligent AI avatars that adapt to your skill level.</p>

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
            <h2>Create Account</h2>
            <p>Start practicing your communication skills</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

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
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label>I am a...</label>
              <div className="role-grid">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <div
                      key={role.value}
                      className={`role-option ${formData.role === role.value ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, role: role.value })}
                    >
                      <div className="role-icon-wrapper">
                        <Icon size={24} color="white" />
                      </div>
                      <div className="role-label">{role.label}</div>
                      <div className="role-desc">{role.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {message && (
            <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}

          <div className="switch-auth">
            Already have an account?{' '}
            <button onClick={() => navigate('/')}>Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
