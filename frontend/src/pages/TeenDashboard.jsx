import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MessageCircle, Briefcase, TrendingUp, Award, Zap, LogOut } from 'lucide-react';
import './TeenDashboard.css';

function TeenDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const modes = [
    {
      id: 'presentation',
      icon: Mic,
      title: 'Presentation',
      description: 'Master public speaking skills',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'interview',
      icon: Briefcase,
      title: 'Interview',
      description: 'Ace your college interviews',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 'free-chat',
      icon: MessageCircle,
      title: 'Free Chat',
      description: 'Practice natural conversation',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  return (
    <div className="teen-dashboard">
      <nav className="teen-nav">
        <div className="teen-nav-brand">
          <Zap size={24} color="#667eea" />
          <span>AI Avatar</span>
        </div>
        <button className="teen-logout" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </nav>

      <div className="teen-container">
        <div className="teen-hero">
          <div className="teen-welcome">
            <h1>Welcome back, {user.name}</h1>
            <p>Continue leveling up your communication game</p>
          </div>
        </div>

        <div className="teen-stats-grid">
          <div className="teen-stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <TrendingUp size={24} color="white" />
            </div>
            <div className="stat-content">
              <div className="stat-label">Level</div>
              <div className="stat-value">1</div>
            </div>
          </div>
          <div className="teen-stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <Award size={24} color="white" />
            </div>
            <div className="stat-content">
              <div className="stat-label">XP Points</div>
              <div className="stat-value">0</div>
            </div>
          </div>
          <div className="teen-stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <Mic size={24} color="white" />
            </div>
            <div className="stat-content">
              <div className="stat-label">Sessions</div>
              <div className="stat-value">0</div>
            </div>
          </div>
        </div>

        <div className="teen-modes-section">
          <h2>Choose Your Practice Mode</h2>
          <div className="teen-modes-grid">
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <div
                  key={mode.id}
                  className="teen-mode-card"
                  onClick={() => navigate('/modes')}
                >
                  <div className="mode-gradient" style={{ background: mode.gradient }}></div>
                  <div className="mode-content">
                    <div className="mode-icon-wrapper">
                      <Icon size={32} color="white" />
                    </div>
                    <h3>{mode.title}</h3>
                    <p>{mode.description}</p>
                    <button className="mode-start-btn">Start Session</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeenDashboard;
