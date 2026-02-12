const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Badge definitions
const BADGES = {
  FIRST_SESSION: {
    key: 'first_session',
    name: 'Getting Started',
    description: 'Complete your first practice session',
    icon: '🎯',
    xp_reward: 25
  },
  CONFIDENT_SPEAKER: {
    key: 'confident_speaker',
    name: 'Confident Speaker',
    description: 'Achieve 80+ confidence score in a session',
    icon: '💪',
    xp_reward: 50
  },
  CONSISTENT_LEARNER: {
    key: 'consistent_learner',
    name: 'Consistent Learner',
    description: 'Practice for 5 days in a row',
    icon: '🔥',
    xp_reward: 100
  },
  HIGH_SCORER: {
    key: 'high_scorer',
    name: 'High Scorer',
    description: 'Score 90+ in a session',
    icon: '⭐',
    xp_reward: 75
  },
  PRACTICE_MASTER: {
    key: 'practice_master',
    name: 'Practice Master',
    description: 'Complete 10 practice sessions',
    icon: '🏆',
    xp_reward: 150
  },
  PRESENTATION_PRO: {
    key: 'presentation_pro',
    name: 'Presentation Pro',
    description: 'Complete 5 presentation sessions',
    icon: '🎤',
    xp_reward: 100
  },
  INTERVIEW_EXPERT: {
    key: 'interview_expert',
    name: 'Interview Expert',
    description: 'Complete 5 interview sessions',
    icon: '💼',
    xp_reward: 100
  },
  CHAT_CHAMPION: {
    key: 'chat_champion',
    name: 'Chat Champion',
    description: 'Complete 5 free-chat sessions',
    icon: '💬',
    xp_reward: 100
  }
};

// XP and Level calculations
const XP_PER_LEVEL = 500;
const BASE_SESSION_XP = 50;

function calculateLevel(totalXp) {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

function calculateXpForNextLevel(totalXp) {
  const currentLevel = calculateLevel(totalXp);
  const xpForNextLevel = currentLevel * XP_PER_LEVEL;
  return xpForNextLevel - totalXp;
}

// Calculate XP earned from session
function calculateSessionXP(scoreData) {
  let xp = BASE_SESSION_XP;

  // Bonus for high final score
  if (scoreData.final >= 90) xp += 30;
  else if (scoreData.final >= 80) xp += 20;
  else if (scoreData.final >= 70) xp += 10;

  // Bonus for high confidence
  if (scoreData.confidence >= 85) xp += 15;
  else if (scoreData.confidence >= 75) xp += 10;

  // Bonus for multiple responses
  if (scoreData.responses >= 5) xp += 15;
  else if (scoreData.responses >= 3) xp += 10;

  return xp;
}

// Check and award badges
async function checkAndAwardBadges(userId, scoreData, userStats) {
  const earnedBadges = [];

  try {
    // Get user's current badges
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_key')
      .eq('user_id', userId);

    const hasBadge = (key) => userBadges?.some(b => b.badge_key === key);

    // Check each badge condition
    if (!hasBadge(BADGES.FIRST_SESSION.key) && userStats.total_sessions === 1) {
      earnedBadges.push(BADGES.FIRST_SESSION);
    }

    if (!hasBadge(BADGES.CONFIDENT_SPEAKER.key) && scoreData.confidence >= 80) {
      earnedBadges.push(BADGES.CONFIDENT_SPEAKER);
    }

    if (!hasBadge(BADGES.HIGH_SCORER.key) && scoreData.final >= 90) {
      earnedBadges.push(BADGES.HIGH_SCORER);
    }

    if (!hasBadge(BADGES.CONSISTENT_LEARNER.key) && userStats.current_streak_days >= 5) {
      earnedBadges.push(BADGES.CONSISTENT_LEARNER);
    }

    if (!hasBadge(BADGES.PRACTICE_MASTER.key) && userStats.total_sessions >= 10) {
      earnedBadges.push(BADGES.PRACTICE_MASTER);
    }

    // Mode-specific badges
    const { data: modeScores } = await supabase
      .from('scores')
      .select('mode')
      .eq('user_id', userId);

    const presentationCount = modeScores?.filter(s => s.mode === 'presentation').length || 0;
    const interviewCount = modeScores?.filter(s => s.mode === 'interview').length || 0;
    const freeChatCount = modeScores?.filter(s => s.mode === 'free-chat').length || 0;

    if (!hasBadge(BADGES.PRESENTATION_PRO.key) && presentationCount >= 5) {
      earnedBadges.push(BADGES.PRESENTATION_PRO);
    }

    if (!hasBadge(BADGES.INTERVIEW_EXPERT.key) && interviewCount >= 5) {
      earnedBadges.push(BADGES.INTERVIEW_EXPERT);
    }

    if (!hasBadge(BADGES.CHAT_CHAMPION.key) && freeChatCount >= 5) {
      earnedBadges.push(BADGES.CHAT_CHAMPION);
    }

    // Award badges
    for (const badge of earnedBadges) {
      await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_key: badge.key
        });
    }

    return earnedBadges;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
}

// Update user achievements after session
exports.updateAchievements = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scoreData } = req.body;

    // Get or create user achievements
    let { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!achievements) {
      // Create new achievements record
      const { data: newAchievements } = await supabase
        .from('achievements')
        .insert({
          user_id: userId,
          total_xp: 0,
          current_level: 1,
          current_streak_days: 0,
          total_sessions: 0
        })
        .select()
        .single();
      achievements = newAchievements;
    }

    // Calculate XP earned
    const xpEarned = calculateSessionXP(scoreData);

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const lastPracticeDate = achievements.last_practice_date;
    let newStreak = achievements.current_streak_days;

    if (!lastPracticeDate) {
      newStreak = 1;
    } else {
      const lastDate = new Date(lastPracticeDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1; // Consecutive day
      } else if (diffDays === 0) {
        // Same day, keep streak
      } else {
        newStreak = 1; // Streak broken, restart
      }
    }

    // Calculate new totals
    const newTotalXp = achievements.total_xp + xpEarned;
    const newLevel = calculateLevel(newTotalXp);
    const newTotalSessions = achievements.total_sessions + 1;

    // Get all scores for average
    const { data: allScores } = await supabase
      .from('scores')
      .select('final_score')
      .eq('user_id', userId);

    const newAvgScore = allScores?.length > 0
      ? allScores.reduce((sum, s) => sum + s.final_score, 0) / allScores.length
      : scoreData.final;

    // Update achievements
    await supabase
      .from('achievements')
      .update({
        total_xp: newTotalXp,
        current_level: newLevel,
        current_streak_days: newStreak,
        last_practice_date: today,
        total_sessions: newTotalSessions,
        average_score: Math.round(newAvgScore)
      })
      .eq('user_id', userId);

    // Check for new badges
    const earnedBadges = await checkAndAwardBadges(userId, scoreData, {
      total_sessions: newTotalSessions,
      current_streak_days: newStreak
    });

    // Calculate total badge XP
    const badgeXp = earnedBadges.reduce((sum, badge) => sum + badge.xp_reward, 0);

    // If badges were earned, add their XP
    if (badgeXp > 0) {
      await supabase
        .from('achievements')
        .update({
          total_xp: newTotalXp + badgeXp
        })
        .eq('user_id', userId);
    }

    const leveledUp = newLevel > achievements.current_level;

    res.json({
      success: true,
      data: {
        xpEarned: xpEarned + badgeXp,
        totalXp: newTotalXp + badgeXp,
        level: calculateLevel(newTotalXp + badgeXp),
        xpForNextLevel: calculateXpForNextLevel(newTotalXp + badgeXp),
        streak: newStreak,
        totalSessions: newTotalSessions,
        earnedBadges,
        leveledUp
      }
    });
  } catch (error) {
    console.error('Update achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update achievements'
    });
  }
};

// Get user achievements and badges
exports.getAchievements = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!achievements) {
      return res.json({
        success: true,
        data: {
          totalXp: 0,
          level: 1,
          xpForNextLevel: XP_PER_LEVEL,
          streak: 0,
          totalSessions: 0,
          averageScore: 0,
          badges: [],
          allBadges: Object.values(BADGES)
        }
      });
    }

    // Get user badges
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    const badges = userBadges?.map(ub => ({
      ...BADGES[Object.keys(BADGES).find(key => BADGES[key].key === ub.badge_key)],
      earnedAt: ub.earned_at
    })) || [];

    res.json({
      success: true,
      data: {
        totalXp: achievements.total_xp,
        level: achievements.current_level,
        xpForNextLevel: calculateXpForNextLevel(achievements.total_xp),
        streak: achievements.current_streak_days,
        totalSessions: achievements.total_sessions,
        averageScore: achievements.average_score,
        badges,
        allBadges: Object.values(BADGES)
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get achievements'
    });
  }
};
