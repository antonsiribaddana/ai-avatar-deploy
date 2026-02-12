import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MessageCircle, Briefcase, BarChart3, Target, Clock, LogOut, User, Award, TrendingUp, Zap } from 'lucide-react';
import './ProfessionalDashboard.css';

function ProfessionalDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [achievements, setAchievements] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch achievements
      const achievementsRes = await fetch('http://localhost:5000/api/gamification/achievements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const achievementsData = await achievementsRes.json();

      // Fetch score history
      const scoresRes = await fetch('http://localhost:5000/api/scores/history?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const scoresData = await scoresRes.json();

      if (achievementsData.success) {
        setAchievements(achievementsData.data);
      }

      if (scoresData.success) {
        setScoreHistory(scoresData.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const modes = [
    {
      id: 'presentation',
      icon: Mic,
      title: 'Presentation Training',
      description: 'Enhance your public speaking and presentation delivery skills',
      stats: { sessions: 0, avgScore: 0 }
    },
    {
      id: 'interview',
      icon: Briefcase,
      title: 'Interview Preparation',
      description: 'Master professional interview techniques and responses',
      stats: { sessions: 0, avgScore: 0 }
    },
    {
      id: 'free-chat',
      icon: MessageCircle,
      title: 'Communication Practice',
      description: 'Improve your professional communication and networking skills',
      stats: { sessions: 0, avgScore: 0 }
    }
  ];

  return (
    <div className="pro-dashboard">
      <nav className="pro-nav">
        <div className="pro-nav-left">
          <div className="pro-brand">AI Avatar Pro</div>
        </div>
        <div className="pro-nav-right">
          <div className="pro-user-info">
            <User size={18} />
            <span>{user.name}</span>
          </div>
          <button className="pro-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="pro-container">
        <div className="pro-header">
          <div>
            <h1>Dashboard</h1>
            <p>Track your communication training progress</p>
          </div>
        </div>

        <div className="pro-metrics">
          <div className="pro-metric-card">
            <div className="metric-icon">
              <Target size={24} color="#3b82f6" />
            </div>
            <div className="metric-details">
              <div className="metric-label">Current Level</div>
              <div className="metric-value">{achievements?.level || 1}</div>
            </div>
          </div>
          <div className="pro-metric-card">
            <div className="metric-icon">
              <Zap size={24} color="#10b981" />
            </div>
            <div className="metric-details">
              <div className="metric-label">Total XP</div>
              <div className="metric-value">{achievements?.totalXp || 0}</div>
            </div>
          </div>
          <div className="pro-metric-card">
            <div className="metric-icon">
              <Clock size={24} color="#f59e0b" />
            </div>
            <div className="metric-details">
              <div className="metric-label">Sessions Completed</div>
              <div className="metric-value">{achievements?.totalSessions || 0}</div>
            </div>
          </div>
          <div className="pro-metric-card">
            <div className="metric-icon">
              <TrendingUp size={24} color="#ef4444" />
            </div>
            <div className="metric-details">
              <div className="metric-label">Day Streak</div>
              <div className="metric-value">{achievements?.streak || 0}🔥</div>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        {achievements && (
          <div className="xp-progress-section">
            <div className="xp-header">
              <span className="xp-label">Level {achievements.level}</span>
              <span className="xp-next">{achievements.xpForNextLevel} XP to Level {achievements.level + 1}</span>
            </div>
            <div className="xp-progress-bar">
              <div
                className="xp-progress-fill"
                style={{
                  width: `${((achievements.totalXp % 500) / 500) * 100}%`
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Badges Section */}
        {achievements && achievements.badges.length > 0 && (
          <div className="badges-section">
            <h2>Badges Earned ({achievements.badges.length})</h2>
            <div className="badges-grid">
              {achievements.badges.map((badge, index) => (
                <div key={index} className="badge-card">
                  <div className="badge-icon">{badge.icon}</div>
                  <div className="badge-name">{badge.name}</div>
                  <div className="badge-desc">{badge.description}</div>
                  <div className="badge-xp">+{badge.xp_reward} XP</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {scoreHistory.length > 0 && (
          <div className="sessions-section">
            <h2>Recent Sessions</h2>
            <div className="sessions-list">
              {scoreHistory.map((session, index) => (
                <div key={index} className="session-card">
                  <div className="session-mode">{session.mode}</div>
                  <div className="session-scores">
                    <div className="session-score-item">
                      <span>Final:</span>
                      <span className="score-value">{session.final_score}</span>
                    </div>
                    <div className="session-score-item">
                      <span>Confidence:</span>
                      <span>{session.confidence_score}</span>
                    </div>
                    <div className="session-score-item">
                      <span>Fluency:</span>
                      <span>{session.fluency_score}</span>
                    </div>
                  </div>
                  <div className="session-date">
                    {new Date(session.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pro-modes-section">
          <h2>Training Modules</h2>
          <div className="pro-modes-grid">
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <div
                  key={mode.id}
                  className="pro-mode-card"
                  onClick={() => navigate('/modes')}
                >
                  <div className="pro-mode-header">
                    <div className="pro-mode-icon">
                      <Icon size={28} color="#3b82f6" />
                    </div>
                    <h3>{mode.title}</h3>
                  </div>
                  <p>{mode.description}</p>
                  <div className="pro-mode-stats">
                    <div className="mode-stat">
                      <span className="stat-label">Sessions:</span>
                      <span className="stat-value">{mode.stats.sessions}</span>
                    </div>
                    <div className="mode-stat">
                      <span className="stat-label">Avg Score:</span>
                      <span className="stat-value">{mode.stats.avgScore}%</span>
                    </div>
                  </div>
                  <button className="pro-mode-btn">Start Training</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfessionalDashboard;
