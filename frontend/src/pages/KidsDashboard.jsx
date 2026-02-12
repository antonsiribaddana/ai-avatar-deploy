import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MessageCircle, Briefcase, Trophy, Star, LogOut } from 'lucide-react';
import './KidsDashboard.css';

function KidsDashboard() {
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
      description: 'Practice speaking in front of others!',
      color: '#FF6B6B'
    },
    {
      id: 'interview',
      icon: Briefcase,
      title: 'Interview',
      description: 'Get ready for school interviews!',
      color: '#4ECDC4'
    },
    {
      id: 'free-chat',
      icon: MessageCircle,
      title: 'Free Chat',
      description: 'Talk about anything you want!',
      color: '#FFE66D'
    }
  ];

  return (
    <div className="kids-dashboard">
      <div className="kids-header">
        <div className="kids-welcome">
          <h1>Hey {user.name}! 👋</h1>
          <p>Ready to practice today?</p>
        </div>
        <button className="kids-logout" onClick={handleLogout}>
          <LogOut size={20} />
          Logout
        </button>
      </div>

      <div className="kids-stats">
        <div className="kids-stat-card">
          <Star size={32} color="#FFD700" fill="#FFD700" />
          <div className="stat-info">
            <div className="stat-value">Level 1</div>
            <div className="stat-label">Your Level</div>
          </div>
        </div>
        <div className="kids-stat-card">
          <Trophy size={32} color="#FF6B6B" />
          <div className="stat-info">
            <div className="stat-value">0 XP</div>
            <div className="stat-label">Experience</div>
          </div>
        </div>
        <div className="kids-stat-card">
          <Mic size={32} color="#4ECDC4" />
          <div className="stat-info">
            <div className="stat-value">0</div>
            <div className="stat-label">Sessions</div>
          </div>
        </div>
      </div>

      <div className="kids-modes-section">
        <h2>Choose Your Adventure!</h2>
        <div className="kids-modes">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                className="kids-mode-card"
                style={{ borderColor: mode.color }}
                onClick={() => navigate('/modes')}
              >
                <div className="mode-icon" style={{ background: mode.color }}>
                  <Icon size={40} color="white" />
                </div>
                <h3>{mode.title}</h3>
                <p>{mode.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default KidsDashboard;
