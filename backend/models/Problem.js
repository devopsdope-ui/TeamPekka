const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Problem title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Problem description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  
  // Problem Classification
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: [true, 'Difficulty level is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Topic Association
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic is required']
  },
  
  // Problem Content
  examples: [{
    input: {
      type: String,
      required: true
    },
    output: {
      type: String,
      required: true
    },
    explanation: String
  }],
  
  constraints: [{
    type: String,
    required: true
  }],
  
  hints: [{
    content: String,
    difficulty: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced'],
      default: 'basic'
    },
    order: {
      type: Number,
      default: 1
    }
  }],
  
  // Code Templates
  starterCode: {
    python: {
      type: String,
      default: ''
    },
    javascript: {
      type: String,
      default: ''
    },
    cpp: {
      type: String,
      default: ''
    },
    java: {
      type: String,
      default: ''
    },
    c: {
      type: String,
      default: ''
    }
  },
  
  // Solution Templates (for reference)
  solutions: {
    python: {
      code: String,
      explanation: String,
      timeComplexity: String,
      spaceComplexity: String
    },
    javascript: {
      code: String,
      explanation: String,
      timeComplexity: String,
      spaceComplexity: String
    },
    cpp: {
      code: String,
      explanation: String,
      timeComplexity: String,
      spaceComplexity: String
    },
    java: {
      code: String,
      explanation: String,
      timeComplexity: String,
      spaceComplexity: String
    },
    c: {
      code: String,
      explanation: String,
      timeComplexity: String,
      spaceComplexity: String
    }
  },
  
  // Test Cases
  testCases: [{
    input: {
      type: String,
      required: true
    },
    expectedOutput: {
      type: String,
      required: true
    },
    isHidden: {
      type: Boolean,
      default: false
    },
    weight: {
      type: Number,
      default: 1
    }
  }],
  
  // Statistics
  stats: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    totalSolved: {
      type: Number,
      default: 0
    },
    acceptanceRate: {
      type: Number,
      default: 0
    },
    averageAttempts: {
      type: Number,
      default: 0
    },
    averageTimeToSolve: {
      type: Number, // in minutes
      default: 0
    }
  },
  
  // Difficulty Analysis
  analysis: {
    estimatedTime: {
      type: Number, // in minutes
      default: 30
    },
    keyTopics: [{
      type: String,
      trim: true
    }],
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    }],
    followUp: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    }]
  },
  
  // Editorial Content
  editorial: {
    approach: String,
    intuition: String,
    algorithm: String,
    implementation: String,
    complexityAnalysis: String,
    alternativeApproaches: [{
      name: String,
      description: String,
      timeComplexity: String,
      spaceComplexity: String,
      code: String
    }]
  },
  
  // Problem Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  
  // Authoring
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewStatus: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  
  // User Interactions
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  dislikes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Reporting
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['incorrect', 'unclear', 'spam', 'inappropriate', 'other']
    },
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
problemSchema.index({ difficulty: 1 });
problemSchema.index({ category: 1 });
problemSchema.index({ topic: 1 });
problemSchema.index({ tags: 1 });
problemSchema.index({ 'stats.acceptanceRate': -1 });
problemSchema.index({ 'stats.totalAttempts': -1 });
problemSchema.index({ slug: 1 });
problemSchema.index({ title: 'text', description: 'text' });

// Virtual for like count
problemSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for dislike count
problemSchema.virtual('dislikeCount').get(function() {
  return this.dislikes ? this.dislikes.length : 0;
});

// Virtual for difficulty score
problemSchema.virtual('difficultyScore').get(function() {
  const difficultyMap = { Easy: 1, Medium: 2, Hard: 3 };
  return difficultyMap[this.difficulty] || 1;
});

// Pre-save middleware to generate slug
problemSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Pre-save middleware to update acceptance rate
problemSchema.pre('save', function(next) {
  if (this.isModified('stats.totalAttempts') || this.isModified('stats.totalSolved')) {
    if (this.stats.totalAttempts > 0) {
      this.stats.acceptanceRate = Math.round((this.stats.totalSolved / this.stats.totalAttempts) * 100);
    } else {
      this.stats.acceptanceRate = 0;
    }
  }
  next();
});

// Instance method to check if user liked the problem
problemSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Instance method to check if user disliked the problem
problemSchema.methods.isDislikedBy = function(userId) {
  return this.dislikes.some(dislike => dislike.user.toString() === userId.toString());
};

// Instance method to toggle like
problemSchema.methods.toggleLike = function(userId) {
  const isLiked = this.isLikedBy(userId);
  
  if (isLiked) {
    // Remove like
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  } else {
    // Add like and remove dislike if exists
    this.likes.push({ user: userId });
    this.dislikes = this.dislikes.filter(dislike => dislike.user.toString() !== userId.toString());
  }
  
  return this.save();
};

// Instance method to toggle dislike
problemSchema.methods.toggleDislike = function(userId) {
  const isDisliked = this.isDislikedBy(userId);
  
  if (isDisliked) {
    // Remove dislike
    this.dislikes = this.dislikes.filter(dislike => dislike.user.toString() !== userId.toString());
  } else {
    // Add dislike and remove like if exists
    this.dislikes.push({ user: userId });
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  }
  
  return this.save();
};

// Instance method to update statistics
problemSchema.methods.updateStats = function(solved = false) {
  this.stats.totalAttempts += 1;
  if (solved) {
    this.stats.totalSolved += 1;
  }
  
  // Update acceptance rate
  this.stats.acceptanceRate = Math.round((this.stats.totalSolved / this.stats.totalAttempts) * 100);
  
  return this.save();
};

// Static method to get problems by difficulty
problemSchema.statics.getByDifficulty = function(difficulty, limit = 10) {
  return this.find({ difficulty, isActive: true })
    .populate('topic', 'title')
    .sort({ 'stats.acceptanceRate': 1 })
    .limit(limit);
};

// Static method to get trending problems
problemSchema.statics.getTrending = function(limit = 10) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return this.find({ 
    isActive: true,
    createdAt: { $gte: oneWeekAgo }
  })
  .sort({ 'stats.totalAttempts': -1 })
  .limit(limit);
};

// Static method to search problems
problemSchema.statics.searchProblems = function(query, filters = {}) {
  const searchQuery = {
    isActive: true,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };
  
  // Apply filters
  if (filters.difficulty) {
    searchQuery.difficulty = filters.difficulty;
  }
  if (filters.category) {
    searchQuery.category = filters.category;
  }
  if (filters.topic) {
    searchQuery.topic = filters.topic;
  }
  
  return this.find(searchQuery)
    .populate('topic', 'title')
    .sort({ 'stats.acceptanceRate': 1 });
};

// Static method to get recommended problems for user
problemSchema.statics.getRecommendedForUser = async function(userId, limit = 5) {
  const User = require('./User');
  const user = await User.findById(userId).populate('completedTopics.topic');
  
  if (!user) return [];
  
  const completedProblemIds = await require('./Submission')
    .find({ user: userId, status: 'accepted' })
    .distinct('problem');
  
  const userDifficulty = user.preferences.difficulty;
  const difficultyMap = { beginner: 'Easy', intermediate: 'Medium', advanced: 'Hard' };
  
  return this.find({
    isActive: true,
    _id: { $nin: completedProblemIds },
    difficulty: difficultyMap[userDifficulty] || 'Easy'
  })
  .sort({ 'stats.acceptanceRate': -1 })
  .limit(limit);
};

module.exports = mongoose.model('Problem', problemSchema);