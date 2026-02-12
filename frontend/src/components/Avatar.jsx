import { useEffect, useState } from 'react';
import './Avatar.css';

function Avatar({ isSpeaking }) {
  const [mouthOpen, setMouthOpen] = useState(false);

  useEffect(() => {
    if (isSpeaking) {
      // Animate mouth opening/closing while speaking
      const interval = setInterval(() => {
        setMouthOpen(prev => !prev);
      }, 200);

      return () => clearInterval(interval);
    } else {
      setMouthOpen(false);
    }
  }, [isSpeaking]);

  return (
    <div className="avatar-container">
      <div className="avatar-face">
        {/* Eyes */}
        <div className="avatar-eyes">
          <div className="avatar-eye left">
            <div className="pupil"></div>
          </div>
          <div className="avatar-eye right">
            <div className="pupil"></div>
          </div>
        </div>

        {/* Mouth */}
        <div className={`avatar-mouth ${mouthOpen ? 'open' : 'closed'}`}>
          <div className="mouth-inner"></div>
        </div>
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="speaking-indicator">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
      )}
    </div>
  );
}

export default Avatar;
