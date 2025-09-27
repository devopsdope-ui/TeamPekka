const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const Progress = require('../models/Progress');
const User = require('../models/User');

const router = express.Router();

// Mock AI service - In production, you'd integrate with OpenAI or similar
class AIService {
  static async generateHint(problem, userCode, errorType) {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const hints = {
      'syntax_error': [
        "Check your syntax - there might be a missing semicolon or bracket.",
        "Look for typos in variable names or function calls.",
        "Make sure your indentation is correct."
      ],
      'logic_error': [
        "Consider the edge cases - what happens with empty inputs?",
        "Step through your algorithm line by line with a simple example.",
        "Think about the time complexity - can you optimize this approach?"
      ],
      'wrong_answer': [
        "Review the problem constraints carefully.",
        "Test your solution with the provided examples first.",
        "Consider if you're handling all possible input cases."
      ],
      'timeout': [
        "Your algorithm might be too slow. Consider a more efficient approach.",
        "Look for nested loops that might be causing O(n²) complexity.",
        "Can you use a hash table or other data structure to optimize?"
      ]
    };

    const hintList = hints[errorType] || hints['logic_error'];
    return hintList[Math.floor(Math.random() * hintList.length)];
  }

  static async analyzeCode(code, language, problem) {
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500));

    const analysis = {
      codeQuality: {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        feedback: "Code is readable with good variable naming.",
        suggestions: [
          "Consider adding more comments for clarity",
          "Some functions could be broken down into smaller pieces"
        ]
      },
      complexity: {
        time: "O(n log n)",
        space: "O(1)",
        analysis: "The sorting operation dominates the time complexity."
      },
      optimizations: [
        "Consider using a hash table for O(1) lookup",
        "Early termination could improve average case performance"
      ],
      bestPractices: [
        "Good use of descriptive variable names",
        "Consider error handling for edge cases"
      ]
    };

    return analysis;
  }

  static async explainConcept(concept, userLevel = 'beginner') {
    await new Promise(resolve => setTimeout(resolve, 800));

    const explanations = {
      'arrays': {
        beginner: "An array is like a row of boxes, each containing a value. You can access any box directly using its position number (index).",
        intermediate: "Arrays are contiguous memory locations that store elements of the same type, providing O(1) random access.",
        advanced: "Arrays offer cache-efficient memory access patterns due to spatial locality, but have fixed size limitations in most implementations."
      },
      'binary_search': {
        beginner: "Binary search is like looking up a word in a dictionary - you keep splitting the remaining pages in half until you find it.",
        intermediate: "Binary search reduces the search space by half in each iteration, achieving O(log n) time complexity on sorted arrays.",
        advanced: "Binary search leverages the sorted property to eliminate half the search space per comparison, with applications in lower_bound, upper_bound, and various optimization problems."
      }
    };

    return explanations[concept]?.[userLevel] || "I'll help you understand this concept step by step.";
  }

  static async generateStudyPlan(userId) {
    const user = await User.findById(userId).populate('completedTopics.topic');
    const progress = await Progress.find({ user: userId });

    // Simulate AI planning
    await new Promise(resolve => setTimeout(resolve, 1200));

    return {
      weeklyGoal: "Complete 2 topics and solve 15 problems",
      dailyTasks: [
        "Spend 30 minutes on Array problems",
        "Review one algorithm concept",
        "Attempt 3 coding problems"
      ],
      recommendedTopics: ["Dynamic Programming", "Graph Algorithms"],
      skillGaps: ["Need more practice with recursion", "Work on time complexity analysis"],
      estimatedCompletion: "3-4 weeks to reach intermediate level"
    };
  }
}

// @route   POST /api/ai/hint
// @desc    Get AI-powered hint for a problem
// @access  Private
router.post('/hint', auth, [
  body('problemId').isMongoId().withMessage('Valid problem ID is required'),
  body('userCode').optional().trim(),
  body('errorType').optional().isIn(['syntax_error', 'logic_error', 'wrong_answer', 'timeout'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { problemId, userCode = '', errorType = 'logic_error' } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Check if user has attempted this problem recently
    const recentSubmission = await Submission.findOne({
      user: req.user.id,
      problem: problemId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).sort({ createdAt: -1 });

    if (!recentSubmission && !userCode) {
      return res.status(400).json({
        success: false,
        message: 'Please attempt the problem first or provide your current code'
      });
    }

    const hint = await AIService.generateHint(problem, userCode, errorType);

    // Log hint request for analytics
    console.log(`Hint requested by user ${req.user.id} for problem ${problemId}`);

    res.json({
      success: true,
      data: {
        hint,
        problemTitle: problem.title,
        hintType: errorType
      }
    });

  } catch (error) {
    console.error('AI hint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating hint'
    });
  }
});

// @route   POST /api/ai/analyze-code
// @desc    Get AI analysis of submitted code
// @access  Private
router.post('/analyze-code', auth, [
  body('submissionId').isMongoId().withMessage('Valid submission ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { submissionId } = req.body;

    const submission = await Submission.findOne({
      _id: submissionId,
      user: req.user.id
    }).populate('problem', 'title difficulty');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if analysis already exists
    if (submission.aiAnalysis && submission.aiAnalysis.codeQuality) {
      return res.json({
        success: true,
        data: { analysis: submission.aiAnalysis },
        cached: true
      });
    }

    const analysis = await AIService.analyzeCode(
      submission.code,
      submission.language,
      submission.problem
    );

    // Save analysis to submission
    submission.aiAnalysis = analysis;
    await submission.save();

    res.json({
      success: true,
      data: { analysis }
    });

  } catch (error) {
    console.error('AI code analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error analyzing code'
    });
  }
});

// @route   POST /api/ai/explain-concept
// @desc    Get AI explanation of a programming concept
// @access  Private
router.post('/explain-concept', auth, [
  body('concept').trim().notEmpty().withMessage('Concept is required'),
  body('context').optional().trim(),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { concept, context = '', difficulty } = req.body;
    
    // Use user's preference for difficulty if not specified
    const userDifficulty = difficulty || req.user.preferences?.difficulty || 'beginner';

    const explanation = await AIService.explainConcept(concept, userDifficulty);

    // Log for analytics
    console.log(`Concept explanation requested: ${concept} (${userDifficulty}) by user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        concept,
        explanation,
        difficulty: userDifficulty,
        relatedTopics: [] // Could be expanded with actual related topics
      }
    });

  } catch (error) {
    console.error('AI concept explanation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error explaining concept'
    });
  }
});

// @route   GET /api/ai/study-plan
// @desc    Get personalized AI-generated study plan
// @access  Private
router.get('/study-plan', auth, async (req, res) => {
  try {
    const studyPlan = await AIService.generateStudyPlan(req.user.id);

    res.json({
      success: true,
      data: { studyPlan }
    });

  } catch (error) {
    console.error('AI study plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating study plan'
    });
  }
});

// @route   POST /api/ai/debug-help
// @desc    Get AI debugging assistance for failed submission
// @access  Private
router.post('/debug-help', auth, [
  body('submissionId').isMongoId().withMessage('Valid submission ID is required'),
  body('specificError').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { submissionId, specificError } = req.body;

    const submission = await Submission.findOne({
      _id: submissionId,
      user: req.user.id
    }).populate('problem', 'title testCases');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    if (submission.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'This submission was already accepted'
      });
    }

    // Analyze the failed submission
    const debugAnalysis = {
      issue: submission.status,
      suggestions: [],
      codeReview: [],
      testCaseAnalysis: []
    };

    switch (submission.status) {
      case 'wrong_answer':
        debugAnalysis.suggestions = [
          "Check edge cases like empty input or single elements",
          "Verify your algorithm logic with the provided examples",
          "Make sure you're handling the input/output format correctly"
        ];
        break;
      
      case 'time_limit_exceeded':
        debugAnalysis.suggestions = [
          "Your algorithm might be too slow - current complexity seems high",
          "Consider using more efficient data structures (hash tables, sets)",
          "Look for unnecessary nested loops or redundant operations"
        ];
        break;
      
      case 'runtime_error':
        debugAnalysis.suggestions = [
          "Check for array index out of bounds errors",
          "Ensure you're not dividing by zero",
          "Verify all variables are properly initialized"
        ];
        break;
      
      default:
        debugAnalysis.suggestions = [
          "Review the problem statement carefully",
          "Test with simple examples first",
          "Check your code syntax and logic"
        ];
    }

    // Add specific error context if provided
    if (specificError) {
      debugAnalysis.specificErrorAnalysis = `Based on the error "${specificError}", consider checking your variable declarations and loop bounds.`;
    }

    res.json({
      success: true,
      data: {
        debugAnalysis,
        problemTitle: submission.problem.title,
        submissionStatus: submission.status
      }
    });

  } catch (error) {
    console.error('AI debug help error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error providing debug help'
    });
  }
});

// @route   POST /api/ai/learning-insights
// @desc    Get AI insights about user's learning progress
// @access  Private
router.get('/learning-insights', auth, async (req, res) => {
  try {
    const userProgress = await Progress.find({ user: req.user.id })
      .populate('topic', 'title difficulty');
    
    const userSubmissions = await Submission.find({ user: req.user.id })
      .select('status language createdAt performance')
      .sort({ createdAt: -1 })
      .limit(50);

    // Simulate AI analysis of learning patterns
    const insights = {
      learningVelocity: "Moderate pace - solving 3-4 problems per week",
      strongAreas: ["Array manipulation", "Basic sorting algorithms"],
      improvementAreas: ["Dynamic programming", "Graph traversal"],
      recommendations: [
        "Focus on understanding recursion before tackling DP problems",
        "Practice more medium-level problems to build confidence",
        "Consider reviewing time complexity analysis"
      ],
      nextMilestones: [
        "Complete Tree data structure topic",
        "Solve 10 medium-difficulty problems",
        "Achieve 80% success rate on Easy problems"
      ],
      studyPattern: "Most active in evenings, consistent 4-5 days per week"
    };

    res.json({
      success: true,
      data: { insights }
    });

  } catch (error) {
    console.error('AI learning insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating learning insights'
    });
  }
});

// @route   POST /api/ai/code-review
// @desc    Get AI code review for accepted solution
// @access  Private
router.post('/code-review', auth, [
  body('submissionId').isMongoId().withMessage('Valid submission ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { submissionId } = req.body;

    const submission = await Submission.findOne({
      _id: submissionId,
      user: req.user.id,
      status: 'accepted'
    }).populate('problem', 'title difficulty');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Accepted submission not found'
      });
    }

    // Generate comprehensive code review
    const review = {
      overallRating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
      strengths: [
        "Clean and readable code structure",
        "Good variable naming conventions",
        "Efficient algorithm choice"
      ],
      improvements: [
        "Consider adding input validation",
        "Could benefit from more descriptive comments",
        "Some edge cases might need explicit handling"
      ],
      alternativeApproaches: [
        {
          name: "Hash Table Approach",
          description: "Using a hash table could reduce space complexity",
          tradeoffs: "Better time complexity but more memory usage"
        }
      ],
      performanceAnalysis: {
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(1)",
        ranking: "Better than 75% of submissions"
      }
    };

    res.json({
      success: true,
      data: {
        review,
        problemTitle: submission.problem.title,
        submissionDate: submission.createdAt
      }
    });

  } catch (error) {
    console.error('AI code review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating code review'
    });
  }
});
fetch("https://your-n8n-instance.com/webhook/my-workflow", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ key: "value" }) // any data your workflow needs
})
.then(res => res.json())
.then(data => console.log(data));


module.exports = router;