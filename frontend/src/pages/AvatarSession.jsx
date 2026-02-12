import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, CameraOff, Mic, MicOff, X, Play, Square } from 'lucide-react';
import Avatar from '../components/Avatar';
import './AvatarSession.css';

function AvatarSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode || 'free-chat';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [faceAnalysis, setFaceAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionScore, setSessionScore] = useState(null);
  const [confidenceHistory, setConfidenceHistory] = useState([]);
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analysisIntervalRef = useRef(null);
  const sessionStartTime = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup: stop all media tracks when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setCameraEnabled(true);
    } catch (error) {
      console.error('Camera error:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const disableCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
  };

  const toggleCamera = () => {
    if (cameraEnabled) {
      disableCamera();
    } else {
      enableCamera();
    }
  };

  const enableMicrophone = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicEnabled(true);
    } catch (error) {
      console.error('Microphone error:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const toggleMicrophone = () => {
    if (micEnabled) {
      setMicEnabled(false);
    } else {
      enableMicrophone();
    }
  };

  const playAvatarSpeech = async (text) => {
    try {
      setCurrentText(text);
      setIsSpeaking(true);

      // Call TTS API
      const response = await fetch('http://localhost:8000/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, lang: 'en' }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.error('Audio playback error');
      };

      await audio.play();
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
      alert('Could not generate speech. Please check if AI service is running.');
    }
  };

  const handleStartSession = () => {
    if (!cameraEnabled || !micEnabled) {
      alert('Please enable camera and microphone before starting');
      return;
    }
    setSessionStarted(true);
    sessionStartTime.current = Date.now();
    startFaceAnalysis();
    // Avatar greets the user and asks first question
    setTimeout(async () => {
      await playAvatarSpeech('Hello! I\'m your AI communication coach. Let\'s start practicing!');
      setTimeout(() => {
        getInitialQuestion();
      }, 2000);
    }, 1000);
  };

  const handleEndSession = () => {
    setSessionStarted(false);
    setIsSpeaking(false);
    setCurrentText('');
    stopFaceAnalysis();

    // Calculate and save score
    const score = calculateScore();
    setSessionScore(score);
    saveScore(score);

    // Stop any playing audio
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  const startRecording = async () => {
    try {
      if (!micEnabled) {
        alert('Please enable microphone first');
        return;
      }

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioForTranscription(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setUserTranscript('Listening...');
    } catch (error) {
      console.error('Recording error:', error);
      alert('Could not start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioForTranscription = async (audioBlob) => {
    try {
      setUserTranscript('Transcribing...');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('http://localhost:8000/stt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();

      if (data.success && data.text) {
        setUserTranscript(`You said: "${data.text}"`);
        // Track transcript for scoring
        setTranscriptHistory(prev => [...prev, data.text]);

        // Get AI feedback on the answer
        await getAIFeedback(data.text);
      } else {
        setUserTranscript(data.error || 'Could not understand audio');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setUserTranscript('Transcription failed. Please try again.');
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  };

  const analyzeFace = async () => {
    if (!cameraEnabled || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      const frameBlob = await captureFrame();

      if (!frameBlob) {
        setIsAnalyzing(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', frameBlob, 'frame.jpg');

      const response = await fetch('http://localhost:8000/analyze-face', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFaceAnalysis(data);

        // Track confidence for scoring
        if (data.face_detected && data.confidence_score) {
          setConfidenceHistory(prev => [...prev, data.confidence_score]);
        }
      }
    } catch (error) {
      console.error('Face analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startFaceAnalysis = () => {
    // Analyze face every 2 seconds
    analysisIntervalRef.current = setInterval(() => {
      analyzeFace();
    }, 2000);
  };

  const stopFaceAnalysis = () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    setFaceAnalysis(null);
  };

  const calculateScore = () => {
    // Calculate average confidence from face analysis
    const avgConfidence = confidenceHistory.length > 0
      ? confidenceHistory.reduce((a, b) => a + b, 0) / confidenceHistory.length
      : 0;

    // Calculate fluency based on number of successful transcriptions
    const fluencyScore = Math.min((transcriptHistory.length / 3) * 100, 100);

    // Calculate accuracy (simplified - based on transcript quality)
    let accuracyScore = 50; // Base score
    if (transcriptHistory.length > 0) {
      // Bonus for longer responses (shows more detail)
      const avgWordCount = transcriptHistory.reduce((sum, transcript) => {
        return sum + transcript.split(' ').length;
      }, 0) / transcriptHistory.length;

      if (avgWordCount > 10) accuracyScore += 30;
      else if (avgWordCount > 5) accuracyScore += 15;

      // Bonus for multiple responses
      if (transcriptHistory.length >= 3) accuracyScore += 20;
      else if (transcriptHistory.length >= 2) accuracyScore += 10;
    }

    // Apply scoring formula: Confidence × 0.3 + Fluency × 0.3 + Accuracy × 0.4
    const finalScore = Math.round(
      (avgConfidence * 0.3) + (fluencyScore * 0.3) + (accuracyScore * 0.4)
    );

    return {
      confidence: Math.round(avgConfidence),
      fluency: Math.round(fluencyScore),
      accuracy: Math.round(accuracyScore),
      final: finalScore,
      mode: mode,
      duration: Math.floor((Date.now() - sessionStartTime.current) / 1000), // in seconds
      responses: transcriptHistory.length
    };
  };

  const saveScore = async (scoreData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/scores/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scoreData)
      });

      if (response.ok) {
        console.log('Score saved successfully');
      }
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  const getInitialQuestion = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/ai/initial-question?mode=${mode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setCurrentQuestion(data.data.question);
        setConversationHistory([data.data.question]);
        await playAvatarSpeech(data.data.question);
      }
    } catch (error) {
      console.error('Error getting initial question:', error);
      setCurrentQuestion('Tell me about yourself.');
      await playAvatarSpeech('Tell me about yourself.');
    }
  };

  const getAIFeedback = async (userAnswer) => {
    try {
      setIsAiThinking(true);
      const token = localStorage.getItem('token');

      // Get current confidence score
      const currentConfidence = confidenceHistory.length > 0
        ? confidenceHistory[confidenceHistory.length - 1]
        : 0;

      const response = await fetch('http://localhost:5000/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userAnswer,
          confidenceScore: currentConfidence,
          mode,
          conversationHistory
        })
      });

      const data = await response.json();

      if (data.success) {
        const { feedback, nextQuestion, tip } = data.data;

        // Show AI feedback
        setAiFeedback({ feedback, tip });

        // Update conversation history
        setConversationHistory(prev => [...prev, userAnswer, feedback]);

        // Speak feedback
        await playAvatarSpeech(feedback);

        // Wait a moment, then ask next question
        setTimeout(async () => {
          setCurrentQuestion(nextQuestion);
          setConversationHistory(prev => [...prev, nextQuestion]);
          setAiFeedback(null);
          await playAvatarSpeech(nextQuestion);
        }, 3000);
      }
    } catch (error) {
      console.error('Error getting AI feedback:', error);
      await playAvatarSpeech('Great answer! Tell me more about that.');
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleExit = () => {
    disableCamera();
    stopFaceAnalysis();
    navigate(`/${user.role}`);
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'presentation': return 'Presentation Practice';
      case 'interview': return 'Interview Preparation';
      case 'free-chat': return 'Free Conversation';
      default: return 'Practice Session';
    }
  };

  return (
    <div className="avatar-session">
      <div className="session-header">
        <h2>{getModeTitle()}</h2>
        <button className="exit-btn" onClick={handleExit}>
          <X size={20} />
          Exit
        </button>
      </div>

      <div className="session-content">
        <div className="avatar-section">
          <Avatar isSpeaking={isSpeaking} />
          {currentText && (
            <div className="speech-bubble">
              {currentText}
            </div>
          )}
        </div>

        <div className="user-section">
          <div className="video-container">
            {cameraEnabled ? (
              <video ref={videoRef} autoPlay muted className="user-video" />
            ) : (
              <div className="video-placeholder">
                <Camera size={64} color="#9ca3af" />
                <p>Camera Off</p>
              </div>
            )}
          </div>

          <div className="controls">
            <button
              className={`control-btn ${cameraEnabled ? 'active' : ''}`}
              onClick={toggleCamera}
            >
              {cameraEnabled ? <Camera size={24} /> : <CameraOff size={24} />}
            </button>
            <button
              className={`control-btn ${micEnabled ? 'active' : ''}`}
              onClick={toggleMicrophone}
            >
              {micEnabled ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
          </div>

          {!sessionStarted ? (
            <button className="start-btn" onClick={handleStartSession}>
              <Play size={20} />
              Start Session
            </button>
          ) : (
            <>
              <button className="end-btn" onClick={handleEndSession}>
                <Square size={20} />
                End Session
              </button>

              {/* Speak Button */}
              {sessionStarted && (
                <button
                  className={`speak-btn ${isRecording ? 'recording' : ''}`}
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                >
                  <Mic size={20} />
                  {isRecording ? 'Release to Stop' : 'Hold to Speak'}
                </button>
              )}

              {/* Current Question Display */}
              {currentQuestion && (
                <div className="current-question">
                  <strong>Question:</strong> {currentQuestion}
                </div>
              )}

              {/* User Transcript Display */}
              {userTranscript && (
                <div className="user-transcript">
                  {userTranscript}
                </div>
              )}

              {/* AI Thinking Indicator */}
              {isAiThinking && (
                <div className="ai-thinking">
                  <div className="thinking-dots">
                    <span></span><span></span><span></span>
                  </div>
                  AI is analyzing your response...
                </div>
              )}

              {/* AI Feedback Display */}
              {aiFeedback && (
                <div className="ai-feedback-card">
                  <h4>Feedback</h4>
                  <p>{aiFeedback.feedback}</p>
                  {aiFeedback.tip && (
                    <div className="ai-tip">
                      <strong>Tip:</strong> {aiFeedback.tip}
                    </div>
                  )}
                </div>
              )}

              {/* Face Analysis Feedback */}
              {faceAnalysis && faceAnalysis.face_detected && (
                <div className="face-feedback">
                  <h4>Live Feedback</h4>
                  <div className="feedback-metrics">
                    <div className="metric">
                      <span className="metric-label">Confidence:</span>
                      <div className="metric-bar">
                        <div
                          className="metric-fill"
                          style={{ width: `${faceAnalysis.confidence_score}%` }}
                        ></div>
                      </div>
                      <span className="metric-value">{faceAnalysis.confidence_score}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Eye Contact:</span>
                      <span className={`metric-status ${faceAnalysis.eye_contact ? 'good' : 'needs-work'}`}>
                        {faceAnalysis.eye_contact ? '✓ Good' : '✗ Improve'}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Emotion:</span>
                      <span className="metric-emotion">{faceAnalysis.emotion}</span>
                    </div>
                  </div>
                  {faceAnalysis.suggestions && faceAnalysis.suggestions.length > 0 && (
                    <div className="suggestions">
                      <strong>Tips:</strong>
                      <ul>
                        {faceAnalysis.suggestions.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Score Modal */}
      {sessionScore && (
        <div className="score-modal-overlay">
          <div className="score-modal">
            <h2>Session Complete!</h2>
            <div className="score-circle">
              <div className="score-value">{sessionScore.final}</div>
              <div className="score-label">Final Score</div>
            </div>

            <div className="score-breakdown">
              <div className="score-item">
                <span className="score-item-label">Confidence</span>
                <div className="score-item-bar">
                  <div
                    className="score-item-fill"
                    style={{ width: `${sessionScore.confidence}%` }}
                  ></div>
                </div>
                <span className="score-item-value">{sessionScore.confidence}%</span>
              </div>

              <div className="score-item">
                <span className="score-item-label">Fluency</span>
                <div className="score-item-bar">
                  <div
                    className="score-item-fill"
                    style={{ width: `${sessionScore.fluency}%` }}
                  ></div>
                </div>
                <span className="score-item-value">{sessionScore.fluency}%</span>
              </div>

              <div className="score-item">
                <span className="score-item-label">Accuracy</span>
                <div className="score-item-bar">
                  <div
                    className="score-item-fill"
                    style={{ width: `${sessionScore.accuracy}%` }}
                  ></div>
                </div>
                <span className="score-item-value">{sessionScore.accuracy}%</span>
              </div>
            </div>

            <div className="score-stats">
              <div className="score-stat">
                <span className="score-stat-value">{Math.floor(sessionScore.duration / 60)}:{String(sessionScore.duration % 60).padStart(2, '0')}</span>
                <span className="score-stat-label">Duration</span>
              </div>
              <div className="score-stat">
                <span className="score-stat-value">{sessionScore.responses}</span>
                <span className="score-stat-label">Responses</span>
              </div>
              <div className="score-stat">
                <span className="score-stat-value">{sessionScore.mode}</span>
                <span className="score-stat-label">Mode</span>
              </div>
            </div>

            <button
              className="score-close-btn"
              onClick={() => {
                setSessionScore(null);
                setConfidenceHistory([]);
                setTranscriptHistory([]);
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvatarSession;
