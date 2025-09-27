const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Topic = require('../models/Topic');
const Problem = require('../models/Problem');
const Progress = require('../models/Progress');
const { auth, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/topics
// @desc    Get all topics with optional filtering
// @access  Public
router.get('/', optionalAuth, [
  query('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
  query('category').optional().isIn(['Data Structures', 'Algorithms', 'Problem Solving', 'System Design']),
  query('featured').optional().isBoolean().toBoolean(),
  query('search').optional().trim(),
  query('sort').optional().isIn(['title', 'difficulty', 'popularity', 'order', 'newest'])
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

    const { difficulty, category, featured, search, sort = 'order' } = req.query;

    // Build query
    const query = { isActive: true, isPublished: true };
    
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (featured) query.isFeatured = true;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'concepts.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort criteria
    let sortCriteria = {};
    switch (sort) {
      case 'difficulty':
        sortCriteria = { difficulty: 1, order: 1 };
        break;
      case 'popularity':
        sortCriteria = { 'stats.popularityScore': -1 };
        break;
      case 'newest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'title':
        sortCriteria = { title: 1 };
        break;
      default:
        sortCriteria = { order: 1, title: 1 };
    }

    // Get topics with problem counts
    let topics = await Topic.find(query)
      .populate('problemCount')
      .sort(sortCriteria);

    // Add user progress for authenticated users
    if (req.user) {
      const userProgress = await Progress.find({ user: req.user.id });
      const progressMap = userProgress.reduce((acc, progress) => {
        acc[progress.topic.toString()] = progress;
        return acc;
      }, {});

      topics = topics.map(topic => ({
        ...topic.toObject(),
        userProgress: progressMap[topic._id.toString()] || null
      }));
    }

    res.json({
      success: true,
      data: { topics }
    });

  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching topics'
    });
  }
});

// @route   GET /api/topics/featured
// @desc    Get featured topics
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const featuredTopics = await Topic.getFeatured(limit);

    res.json({
      success: true,
      data: { topics: featuredTopics }
    });

  } catch (error) {
    console.error('Get featured topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching featured topics'
    });
  }
});

// @route   GET /api/topics/learning-path
// @desc    Get learning path for difficulty level
// @access  Public
router.get('/learning-path', [
  query('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced'])
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

    const { difficulty = 'Beginner' } = req.query;
    const learningPath = await Topic.getLearningPath(difficulty);

    res.json({
      success: true,
      data: { learningPath }
    });

  } catch (error) {
    console.error('Get learning path error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching learning path'
    });
  }
});

// @route   GET /api/topics/recommended
// @desc    Get recommended topics for user
// @access  Private
router.get('/recommended', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const recommendedTopics = await Topic.getRecommendedForUser(req.user.id, limit);

    res.json({
      success: true,
      data: { topics: recommendedTopics }
    });

  } catch (error) {
    console.error('Get recommended topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching recommended topics'
    });
  }
});

// @route   GET /api/topics/:id
// @desc    Get single topic by ID or slug
// @access  Public (but shows different data for authenticated users)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID first, then by slug
    let topic = await Topic.findById(id)
      .populate('prerequisites', 'title slug difficulty')
      .populate('nextTopics', 'title slug difficulty')
      .populate('problemCount');
    
    if (!topic) {
      topic = await Topic.findOne({ slug: id })
        .populate('prerequisites', 'title slug difficulty')
        .populate('nextTopics', 'title slug difficulty')
        .populate('problemCount');
    }

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    if (!topic.isActive || !topic.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    let topicData = topic.toObject();

    // Add user-specific data for authenticated users
    if (req.user) {
      // Get user's progress for this topic
      const progress = await Progress.findOne({
        user: req.user.id,
        topic: topic._id
      });

      // Get user's problems progress for this topic
      const topicProblems = await Problem.find({ topic: topic._id, isActive: true });
      const userSubmissions = await require('../models/Submission').find({
        user: req.user.id,
        problem: { $in: topicProblems.map(p => p._id) },
        status: 'accepted'
      }).distinct('problem');

      // Check if user can access this topic (prerequisites)
      const canAccess = await topic.canUserAccess(req.user.id);

      topicData = {
        ...topicData,
        userProgress: progress,
        solvedProblems: userSubmissions.length,
        canAccess
      };
    }

    res.json({
      success: true,
      data: { topic: topicData }
    });

  } catch (error) {
    console.error('Get topic error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error fetching topic'
    });
  }
});

// @route   GET /api/topics/:id/problems
// @desc    Get problems for a topic
// @access  Public
router.get('/:id/problems', optionalAuth, [
  query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
  query('solved').optional().isBoolean().toBoolean(),
  query('sort').optional().isIn(['title', 'difficulty', 'acceptance', 'newest'])
], async (req, res) => {
  try {
    const { id } = req.params;
    const { difficulty, solved, sort = 'title' } = req.query;

    const topic = await Topic.findOne({
      $or: [{ _id: id }, { slug: id }],
      isActive: true,
      isPublished: true
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Build query
    const query = { topic: topic._id, isActive: true };
    if (difficulty) query.difficulty = difficulty;

    // Filter by solved status for authenticated users
    if (req.user && solved !== undefined) {
      const userSubmissions = await require('../models/Submission').find({
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
      case 'newest':
        sortCriteria = { createdAt: -1 };
        break;
      default:
        sortCriteria = { title: 1 };
    }

    const problems = await Problem.find(query)
      .sort(sortCriteria)
      .select('title slug difficulty category stats tags');

    // Add user status for authenticated users
    let problemsWithUserData = problems;
    if (req.user) {
      const userSubmissions = await require('../models/Submission').find({
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
        topic: {
          id: topic._id,
          title: topic.title,
          slug: topic.slug
        },
        problems: problemsWithUserData 
      }
    });

  } catch (error) {
    console.error('Get topic problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching topic problems'
    });
  }
});

// @route   POST /api/topics
// @desc    Create new topic (Admin only)
// @access  Private (Admin)
router.post('/', auth, authorize('admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('difficulty').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid difficulty'),
  body('category').isIn(['Data Structures', 'Algorithms', 'Problem Solving', 'System Design']).withMessage('Invalid category'),
  body('icon').optional().trim(),
  body('sections').optional().isArray()
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

    // Check if topic with same title already exists
    const existingTopic = await Topic.findOne({ 
      title: req.body.title,
      isActive: true 
    });

    if (existingTopic) {
      return res.status(400).json({
        success: false,
        message: 'Topic with this title already exists'
      });
    }

    const topic = new Topic({
      ...req.body,
      author: req.user.id,
      isPublished: true // Admin created topics are auto-published
    });

    await topic.save();

    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      data: { topic }
    });

  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating topic'
    });
  }
});

// @route   PUT /api/topics/:id
// @desc    Update topic (Admin only)
// @access  Private (Admin)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    const allowedUpdates = [
      'title', 'description', 'difficulty', 'category', 'icon', 'color', 
      'order', 'prerequisites', 'sections', 'quizzes', 'concepts', 
      'resources', 'isActive', 'isPublished', 'isFeatured'
    ];

    const updates = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updatedTopic = await Topic.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Topic updated successfully',
      data: { topic: updatedTopic }
    });

  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating topic'
    });
  }
});

// @route   DELETE /api/topics/:id
// @desc    Delete topic (Admin only)
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Soft delete by setting isActive to false
    topic.isActive = false;
    await topic.save();

    res.json({
      success: true,
      message: 'Topic deleted successfully'
    });

  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting topic'
    });
  }
});

// @route   POST /api/topics/:id/start
// @desc    Start learning a topic
// @access  Private
router.post('/:id/start', auth, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Check if user can access this topic
    const canAccess = await topic.canUserAccess(req.user.id);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Please complete prerequisite topics first'
      });
    }

    // Check if progress already exists
    let progress = await Progress.findOne({
      user: req.user.id,
      topic: topic._id
    });

    if (progress) {
      return res.status(400).json({
        success: false,
        message: 'Topic already started'
      });
    }

    // Create new progress
    progress = new Progress({
      user: req.user.id,
      topic: topic._id,
      isStarted: true,
      startedAt: new Date(),
      sectionsProgress: topic.sections.map(section => ({
        sectionId: section._id,
        sectionTitle: section.title,
        isCompleted: false,
        timeSpent: 0
      }))
    });

    await progress.save();

    res.json({
      success: true,
      message: 'Topic started successfully',
      data: { progress }
    });

  } catch (error) {
    console.error('Start topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting topic'
    });
  }
});

// @route   POST /api/topics/:id/sections/:sectionId/complete
// @desc    Mark section as completed
// @access  Private
router.post('/:id/sections/:sectionId/complete', auth, [
  body('timeSpent').optional().isInt({ min: 0 }),
  body('notes').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { timeSpent = 0, notes = '' } = req.body;

    let progress = await Progress.findOne({
      user: req.user.id,
      topic: id
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Topic progress not found. Please start the topic first.'
      });
    }

    await progress.completeSection(sectionId, timeSpent, notes);

    res.json({
      success: true,
      message: 'Section completed successfully',
      data: { 
        progress: {
          completionPercentage: progress.completionPercentage,
          isCompleted: progress.isCompleted
        }
      }
    });

  } catch (error) {
    console.error('Complete section error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing section'
    });
  }
});

module.exports = router;
