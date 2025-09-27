const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Problem = require('../models/Problem');
const Topic = require('../models/Topic');
const Submission = require('../models/Submission');
const Progress = require('../models/Progress');
const { auth, authorize, requirePremium, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/problems
// @desc    Get all problems with filtering and pagination
// @access  Public (but shows different data for authenticated users)
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
  query('category').optional().trim(),
  query('topic').optional().isMongoId(),
  query('search').optional().trim(),
  query('sort').optional().isIn(['title', 'difficulty', 'acceptance', 'attempts', 'newest', 'oldest']),
  query('solved').optional().isBoolean().toBoolean()
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

    const {
      page = 1,
      limit = 20,
      difficulty,
      category,
      topic,
      search,
      sort = 'title',
      solved
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = new RegExp(category, 'i');
    if (topic) query.topic = topic;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filter by solved status for authenticated users
    if (req.user && solved !== undefined) {
      const userSubmissions = await Submission.find({
        user: req.user.id,
        status: 'accepted'
      }).distinct('problem');

      if (solved) {
        query._id = { $in: userSubmissions };
      } else {
        query._id = { $nin: userSubmissions };
      }
    }

    // Build sort criteria
    let sortCriteria = {};
    switch (sort) {
      case 'difficulty':
        sortCriteria = { difficulty: 1, title: 1 };
        break;
      case 'acceptance':
        sortCriteria = { 'stats.acceptanceRate': -1 };
        break;
      case 'attempts':
        sortCriteria = { 'stats.totalAttempts': -1 };
        break;
      case 'newest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'oldest':
        sortCriteria = { createdAt: 1 };
        break;
      default:
        sortCriteria = { title: 1 };
    }

    // Execute query with pagination
    const problems = await Problem.find(query)
      .populate('topic', 'title slug')
      .sort(sortCriteria)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('title slug description difficulty category tags stats likes dislikes createdAt topic');

    const total = await Problem.countDocuments(query);

    // Add user-specific data for authenticated users
    let problemsWithUserData = problems;
    if (req.user) {
      const userSubmissions = await Submission.find({
        user: req.user.id,
        problem: { $in: problems.map(p => p._id) }
      }).select('problem status');

      const submissionMap = userSubmissions.reduce((acc, sub) => {
        if (!acc[sub.problem] || sub.status === 'accepted') {
          acc[sub.problem] = sub.status;
        }
        return acc;
      }, {});

      problemsWithUserData = problems.map(problem => ({
        ...problem.toObject(),
        userStatus: submissionMap[problem._id] || 'not_attempted'
      }));
    }

    res.json({
      success: true,
      data: {
        problems: problemsWithUserData,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching problems'
    });
  }
});

// @route   GET /api/problems/recommended
// @desc    Get recommended problems for user
// @access  Private
router.get('/recommended', auth, async (req, res) => {
  try {
    const recommendedProblems = await Problem.getRecommendedForUser(req.user.id);

    res.json({
      success: true,
      data: { problems: recommendedProblems }
    });

  } catch (error) {
    console.error('Get recommended problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching recommended problems'
    });
  }
});

// @route   GET /api/problems/trending
// @desc    Get trending problems
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const trendingProblems = await Problem.getTrending(limit);

    res.json({
      success: true,
      data: { problems: trendingProblems }
    });

  } catch (error) {
    console.error('Get trending problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching trending problems'
    });
  }
});

// @route   GET /api/problems/:id
// @desc    Get single problem by ID or slug
// @access  Public (but shows different data for authenticated users)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID first, then by slug
    let problem = await Problem.findById(id).populate('topic', 'title slug');
    if (!problem) {
      problem = await Problem.findOne({ slug: id }).populate('topic', 'title slug');
    }

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    if (!problem.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Check premium access
    if (problem.isPremium && (!req.user || !req.user.isPremium)) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required to access this problem'
      });
    }

    let problemData = problem.toObject();

    // Add user-specific data for authenticated users
    if (req.user) {
      // Get user's submissions for this problem
      const userSubmissions = await Submission.find({
        user: req.user.id,
        problem: problem._id
      }).sort({ createdAt: -1 }).limit(10);

      // Check if user liked/disliked the problem
      const isLiked = problem.isLikedBy(req.user.id);
      const isDisliked = problem.isDislikedBy(req.user.id);

      problemData = {
        ...problemData,
        userSubmissions,
        isLiked,
        isDisliked,
        userStatus: userSubmissions.length > 0 
          ? userSubmissions.find(s => s.status === 'accepted') ? 'solved' : 'attempted'
          : 'not_attempted'
      };
    }

    res.json({
      success: true,
      data: { problem: problemData }
    });

  } catch (error) {
    console.error('Get problem error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error fetching problem'
    });
  }
});

// @route   POST /api/problems
// @desc    Create new problem (Admin only)
// @access  Private (Admin)
router.post('/', auth, authorize('admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('topic').isMongoId().withMessage('Valid topic ID is required'),
  body('examples').isArray().withMessage('Examples must be an array'),
  body('constraints').isArray().withMessage('Constraints must be an array'),
  body('testCases').isArray().withMessage('Test cases must be an array')
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

    // Verify topic exists
    const topic = await Topic.findById(req.body.topic);
    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic not found'
      });
    }

    const problem = new Problem({
      ...req.body,
      author: req.user.id,
      reviewStatus: 'approved' // Admin created problems are auto-approved
    });

    await problem.save();

    // Update topic statistics
    await topic.updateStats();

    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      data: { problem }
    });

  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating problem'
    });
  }
});

// @route   PUT /api/problems/:id
// @desc    Update problem (Admin only)
// @access  Private (Admin)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'difficulty', 'category', 'tags', 'examples', 
      'constraints', 'hints', 'starterCode', 'solutions', 'testCases', 
      'editorial', 'isActive', 'isPremium'
    ];

    const updates = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updatedProblem = await Problem.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('topic', 'title slug');

    res.json({
      success: true,
      message: 'Problem updated successfully',
      data: { problem: updatedProblem }
    });

  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating problem'
    });
  }
});

// @route   DELETE /api/problems/:id
// @desc    Delete problem (Admin only)
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Soft delete by setting isActive to false
    problem.isActive = false;
    await problem.save();

    res.json({
      success: true,
      message: 'Problem deleted successfully'
    });

  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting problem'
    });
  }
});

// @route   POST /api/problems/:id/like
// @desc    Toggle like on problem
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    await problem.toggleLike(req.user.id);

    res.json({
      success: true,
      message: problem.isLikedBy(req.user.id) ? 'Problem liked' : 'Problem like removed',
      data: {
        isLiked: problem.isLikedBy(req.user.id),
        likeCount: problem.likeCount
      }
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling like'
    });
  }
});

// @route   POST /api/problems/:id/dislike
// @desc    Toggle dislike on problem
// @access  Private
router.post('/:id/dislike', auth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    await problem.toggleDislike(req.user.id);

    res.json({
      success: true,
      message: problem.isDislikedBy(req.user.id) ? 'Problem disliked' : 'Problem dislike removed',
      data: {
        isDisliked: problem.isDislikedBy(req.user.id),
        dislikeCount: problem.dislikeCount
      }
    });

  } catch (error) {
    console.error('Toggle dislike error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling dislike'
    });
  }
});

// @route   POST /api/problems/:id/submit
// @desc    Submit solution for problem
// @access  Private
router.post('/:id/submit', auth, [
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('language').isIn(['python', 'javascript', 'cpp', 'java', 'c']).withMessage('Invalid language')
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

    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Check premium access
    if (problem.isPremium && !req.user.isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required'
      });
    }

    const { code, language } = req.body;

    // Create submission
    const submission = new Submission({
      user: req.user.id,
      problem: problem._id,
      language,
      code,
      startTime: new Date(),
      sessionId: req.sessionID,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // TODO: Execute code and run test cases
    // This would integrate with a code execution service
    // For now, we'll simulate the result
    const isAccepted = Math.random() > 0.3; // 70% success rate for demo

    submission.status = isAccepted ? 'accepted' : 'wrong_answer';
    submission.endTime = new Date();
    submission.performance = {
      executionTime: Math.floor(Math.random() * 1000) + 100, // Random 100-1100ms
      memoryUsage: Math.floor(Math.random() * 1024 * 1024) + 1024 * 512, // Random 0.5-1.5MB
      codeLength: code.length
    };

    if (isAccepted) {
      submission.testResults = problem.testCases.map(tc => ({
        testCaseId: tc._id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: tc.expectedOutput,
        passed: true,
        executionTime: Math.floor(Math.random() * 100) + 50,
        memoryUsed: Math.floor(Math.random() * 1024 * 100)
      }));
    }

    await submission.save();

    // Update problem statistics
    await problem.updateStats(isAccepted);

    // Update user progress
    const progress = await Progress.findOne({
      user: req.user.id,
      topic: problem.topic
    });

    if (progress) {
      await progress.attemptProblem(problem._id, isAccepted);
    }

    res.json({
      success: true,
      message: 'Solution submitted successfully',
      data: {
        submission: {
          id: submission._id,
          status: submission.status,
          executionTime: submission.performance.executionTime,
          memoryUsage: submission.performance.memoryUsage,
          testResults: submission.testResults
        }
      }
    });

  } catch (error) {
    console.error('Submit solution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting solution'
    });
  }
});

// @route   GET /api/problems/:id/submissions
// @desc    Get user's submissions for a problem
// @access  Private
router.get('/:id/submissions', auth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    const submissions = await Submission.find({
      user: req.user.id,
      problem: problem._id
    }).sort({ createdAt: -1 }).limit(20);

    res.json({
      success: true,
      data: { submissions }
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching submissions'
    });
  }
});

// @route   GET /api/problems/:id/statistics
// @desc    Get problem statistics
// @access  Public
router.get('/:id/statistics', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    const stats = await Submission.getProblemStats(problem._id);

    res.json({
      success: true,
      data: {
        problemStats: problem.stats,
        submissionStats: stats
      }
    });

  } catch (error) {
    console.error('Get problem statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

// @route   POST /api/problems/:id/report
// @desc    Report a problem
// @access  Private
router.post('/:id/report', auth, [
  body('reason').isIn(['incorrect', 'unclear', 'spam', 'inappropriate', 'other']).withMessage('Invalid reason'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long')
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

    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    const { reason, description } = req.body;

    // Check if user already reported this problem
    const existingReport = problem.reports.find(
      report => report.user.toString() === req.user.id.toString()
    );

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this problem'
      });
    }

    problem.reports.push({
      user: req.user.id,
      reason,
      description: description || ''
    });

    await problem.save();

    res.json({
      success: true,
      message: 'Problem reported successfully'
    });

  } catch (error) {
    console.error('Report problem error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error reporting problem'
    });
  }
});

module.exports = router;