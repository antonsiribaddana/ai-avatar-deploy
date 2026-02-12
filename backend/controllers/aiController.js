const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Mode-specific system prompts
const MODE_PROMPTS = {
  'presentation': {
    role: 'presentation coach',
    focus: 'public speaking, clarity, body language, and audience engagement',
    tips: 'structure, pace, visual aids, and storytelling'
  },
  'interview': {
    role: 'interview coach',
    focus: 'professional communication, answering techniques, and confidence',
    tips: 'STAR method (Situation, Task, Action, Result), specific examples, and quantifiable achievements'
  },
  'free-chat': {
    role: 'communication coach',
    focus: 'conversational skills, active listening, and social interaction',
    tips: 'clear expression, empathy, and engaging dialogue'
  }
};

// Generate AI feedback based on user's answer
exports.generateFeedback = async (req, res) => {
  try {
    const {
      userAnswer,
      confidenceScore,
      mode,
      conversationHistory = []
    } = req.body;

    // Validate input
    if (!userAnswer || !mode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAnswer and mode'
      });
    }

    const modeConfig = MODE_PROMPTS[mode] || MODE_PROMPTS['free-chat'];

    // Build conversation context
    let contextString = '';
    if (conversationHistory.length > 0) {
      contextString = '\n\nPrevious conversation:\n' +
        conversationHistory.map((msg, i) =>
          `${i % 2 === 0 ? 'User' : 'Coach'}: ${msg}`
        ).join('\n');
    }

    // Create the prompt
    const prompt = `You are an AI ${modeConfig.role} helping someone practice their communication skills.

Your focus areas: ${modeConfig.focus}

The user just said: "${userAnswer}"

Their confidence score (based on body language and eye contact): ${confidenceScore || 'N/A'}/100

${contextString}

Please provide:
1. Brief feedback (2-3 sentences) - Be encouraging but specific about what they did well and one thing to improve
2. A relevant follow-up question to help them practice further

Your response MUST be in this exact JSON format:
{
  "feedback": "Your encouraging and specific feedback here",
  "nextQuestion": "Your follow-up question here",
  "tip": "One specific actionable tip based on ${modeConfig.tips}"
}

Keep feedback positive and constructive. Make questions progressively challenging based on their performance.`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let aiResponse;
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      aiResponse = JSON.parse(jsonText);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.error('JSON parse error:', parseError);
      aiResponse = {
        feedback: text.split('\n')[0] || "Great job! Keep practicing.",
        nextQuestion: "Tell me more about your experience.",
        tip: "Remember to speak clearly and maintain eye contact."
      };
    }

    res.json({
      success: true,
      data: {
        feedback: aiResponse.feedback,
        nextQuestion: aiResponse.nextQuestion,
        tip: aiResponse.tip,
        mode: mode
      }
    });

  } catch (error) {
    console.error('AI Feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI feedback',
      details: error.message
    });
  }
};

// Get initial question based on mode
exports.getInitialQuestion = async (req, res) => {
  try {
    const { mode } = req.query;

    if (!mode) {
      return res.status(400).json({
        success: false,
        error: 'Mode is required'
      });
    }

    const modeConfig = MODE_PROMPTS[mode] || MODE_PROMPTS['free-chat'];

    const prompt = `You are an AI ${modeConfig.role}.

Generate a good opening question to start a ${mode} practice session.
Focus areas: ${modeConfig.focus}

Return ONLY the question, nothing else. Make it engaging and appropriate for beginners.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const question = response.text().trim();

    res.json({
      success: true,
      data: {
        question: question.replace(/['"]/g, ''),
        mode: mode
      }
    });

  } catch (error) {
    console.error('Initial question error:', error);

    // Fallback questions if API fails
    const fallbackQuestions = {
      'presentation': 'Tell me about a topic you are passionate about and why others should care about it.',
      'interview': 'Can you tell me about yourself and what makes you unique?',
      'free-chat': 'What is something interesting that happened to you recently?'
    };

    res.json({
      success: true,
      data: {
        question: fallbackQuestions[req.query.mode] || fallbackQuestions['free-chat'],
        mode: req.query.mode,
        fallback: true
      }
    });
  }
};

// Test AI connection
exports.testConnection = async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Say "AI is ready!" in JSON format: {"status": "ready", "message": "..."}');
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      message: 'Gemini AI is connected and working!',
      response: text
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'AI connection failed',
      details: error.message
    });
  }
};
