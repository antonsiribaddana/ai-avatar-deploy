const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Save session score
exports.saveScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { confidence, fluency, accuracy, final, mode, duration, responses } = req.body;

    // Validate score data
    if (!confidence || !fluency || !accuracy || !final || !mode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required score fields'
      });
    }

    // Insert score into database
    const { data, error } = await supabase
      .from('scores')
      .insert([
        {
          user_id: userId,
          confidence_score: confidence,
          fluency_score: fluency,
          accuracy_score: accuracy,
          final_score: final,
          mode: mode,
          duration: duration,
          responses: responses,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save score'
      });
    }

    // After saving score, update gamification
    const gamificationController = require('./gamificationController');
    const gamificationReq = {
      user: req.user,
      body: { scoreData: {
        confidence,
        fluency,
        accuracy,
        final,
        mode,
        responses
      }}
    };

    // Call updateAchievements but don't wait for it
    gamificationController.updateAchievements(gamificationReq, {
      json: (gamificationData) => {
        // Gamification updated successfully
      }
    }).catch(err => console.error('Gamification update error:', err));

    res.json({
      success: true,
      message: 'Score saved successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('Save score error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get user's score history
exports.getScoreHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mode, limit = 10 } = req.query;

    let query = supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Filter by mode if provided
    if (mode) {
      query = query.eq('mode', mode);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch scores'
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get scores error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get user's score statistics
exports.getScoreStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }

    // Calculate statistics
    const totalSessions = data.length;
    const avgConfidence = totalSessions > 0
      ? Math.round(data.reduce((sum, s) => sum + s.confidence_score, 0) / totalSessions)
      : 0;
    const avgFluency = totalSessions > 0
      ? Math.round(data.reduce((sum, s) => sum + s.fluency_score, 0) / totalSessions)
      : 0;
    const avgAccuracy = totalSessions > 0
      ? Math.round(data.reduce((sum, s) => sum + s.accuracy_score, 0) / totalSessions)
      : 0;
    const avgFinalScore = totalSessions > 0
      ? Math.round(data.reduce((sum, s) => sum + s.final_score, 0) / totalSessions)
      : 0;
    const totalDuration = data.reduce((sum, s) => sum + (s.duration || 0), 0);

    // Calculate mode-specific stats
    const modeStats = {
      presentation: { sessions: 0, avgScore: 0 },
      interview: { sessions: 0, avgScore: 0 },
      'free-chat': { sessions: 0, avgScore: 0 }
    };

    data.forEach(score => {
      if (modeStats[score.mode]) {
        modeStats[score.mode].sessions++;
        modeStats[score.mode].avgScore += score.final_score;
      }
    });

    Object.keys(modeStats).forEach(mode => {
      if (modeStats[mode].sessions > 0) {
        modeStats[mode].avgScore = Math.round(
          modeStats[mode].avgScore / modeStats[mode].sessions
        );
      }
    });

    res.json({
      success: true,
      data: {
        totalSessions,
        avgConfidence,
        avgFluency,
        avgAccuracy,
        avgFinalScore,
        totalDuration,
        modeStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
