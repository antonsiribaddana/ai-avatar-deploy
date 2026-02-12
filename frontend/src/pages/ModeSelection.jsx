import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, MessageCircle, Briefcase, ArrowLeft } from 'lucide-react';
import './ModeSelection.css';

function ModeSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const modes = [
    {
      id: 'presentation',
      icon: Mic,
      title: 'Presentation Mode',
      description: 'Practice public speaking and presentation skills',
      color: '#667eea',
      tips: ['Maintain eye contact', 'Speak clearly', 'Use gestures']
    },
    {
      id: 'interview',
      icon: Briefcase,
      title: 'Interview Mode',
      description: 'Prepare for job or school interviews',
      color: '#f093fb',
      tips: ['Answer confidently', 'Show enthusiasm', 'Be concise']
    },
    {
      id: 'free-chat',
      icon: MessageCircle,
      title: 'Free Chat Mode',
      description: 'Practice casual conversation skills',
      color: '#4facfe',
      tips: ['Be natural', 'Listen actively', 'Ask questions']
    }
  ];

  const handleSelectMode = (modeId) => {
    navigate('/session', { state: { mode: modeId } });
  };

  return (
    <div className="mode-selection">
      <div className="mode-header">
        <button className="back-btn" onClick={() => navigate(`/${user.role}`)}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <div className="mode-header-content">
          <h1>Choose Your Practice Mode</h1>
          <p>Select a mode to start your communication training session</p>
        </div>
      </div>

      <div className="mode-grid">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <div
              key={mode.id}
              className="mode-card"
              onClick={() => handleSelectMode(mode.id)}
            >
              <div className="mode-card-header" style={{ background: mode.color }}>
                <Icon size={48} color="white" />
              </div>
              <div className="mode-card-body">
                <h3>{mode.title}</h3>
                <p>{mode.description}</p>
                <div className="mode-tips">
                  <h4>What you'll practice:</h4>
                  <ul>
                    {mode.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
                <button className="select-mode-btn" style={{ background: mode.color }}>
                  Start Session
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ModeSelection;
