const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Topic title is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Topic description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Visual Elements
  icon: {
    type: String,
    required: true,
    default: 'Code'
  },
  color: {
    type: String,
    default: '#10B981' // Tailwind green-500
  },
  banner: {
    type: String, // URL to banner image
    default: null
  },
  
  // Topic Classification
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: [true, 'Difficulty level is required']
  },
  category: {
    type: String,
    enum: ['Data Structures', 'Algorithms', 'Problem Solving', 'System Design'],
    required: [true, 'Category is required']
  },
  
  // Learning Path
  order: {
    type: Number,
    default: 0
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  nextTopics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  
  // Content Structure
  sections: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    content: {
      type: String,
      required: true
    },
    codeExamples: [{
      language: {
        type: String,
        enum: ['python', 'javascript', 'cpp', 'java', 'c'],
        required: true
      },
      code: {
        type: String,
        required: true
      },
      explanation: String
    }],
    order: {
      type: Number,
      default: 0
    },
    estimatedTime: {
      type: Number, // in minutes
      default: 15
    }
  }],
  
  // Interactive Elements
  quizzes: [{
    question: {
      type: String,
      required: true
    },
    options: [{
      text: String,
      isCorrect: Boolean
    }],
    explanation: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy'
    }
  }],
  
  // Key Concepts
  concepts: [{
    name: {
      type: String,
      required: true
    },
    definition: {
      type: String,
      required: true
    },
    examples: [String],
    importance: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  
  // Time Complexity Analysis
  complexityAnalysis: {
    timeComplexity: {
      best: String,
      average: String,
      worst: String
    },
    spaceComplexity: String,
    notes: String
  },
  
  // Common Patterns
  patterns: [{
    name: String,
    description: String,
    whenToUse: String,
    codeTemplate: [{
      language: String,
      template: String
    }]
  }],
  
  // Learning Resources
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['video', 'article', 'book', 'course', 'documentation']
    },
    url: String,
    description: String,
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    isPremium: {
      type: Boolean,
      default: false
    }
  }],
  
  // Statistics
  stats: {
    totalProblems: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number, // in hours
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    popularityScore: {
      type: Number,
      default: 0
    }
  },
  
  // User Progress Tracking
  estimatedDuration: {
    type: Number, // in hours
    default: 5
  },
  
  // Content Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Authoring Information
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  contributors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    contribution: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Version Control
  version: {
    type: String,
    default: '1.0.0'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  changeLog: [{
    version: String,
    changes: [String],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
topicSchema.index({ difficulty: 1 });
topicSchema.index({ category: 1 });
topicSchema.index({ order: 1 });
topicSchema.index({ 'stats.popularityScore': -1 });
topicSchema.index({ isActive: 1, isPublished: 1 });
topicSchema.index({ title: 'text', description: 'text' });

// Virtual to populate problems count
topicSchema.virtual('problemCount', {
  ref: 'Problem',
  localField: '_id',
  foreignField: 'topic',
  count: true
});

// Virtual for total learning time
topicSchema.virtual('totalLearningTime').get(function() {
  const sectionTime = this.sections.reduce((total, section) => total + section.estimatedTime, 0);
  return sectionTime + (this.estimatedDuration * 60); // Convert hours to minutes
});

// Virtual for difficulty score
topicSchema.virtual('difficultyScore').get(function() {
  const difficultyMap = { Beginner: 1, Intermediate: 2, Advanced: 3 };
  return difficultyMap[this.difficulty] || 1;
});

// Pre-save middleware to generate slug
topicSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Update lastUpdated when content changes
  if (this.isModified('sections') || this.isModified('concepts') || this.isModified('resources')) {
    this.lastUpdated = new Date();
  }
  
  next();
});

// Pre-save middleware to sort sections by order
topicSchema.pre('save', function(next) {
  if (this.sections && this.sections.length > 0) {
    this.sections.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  next();
});

// Instance method to get topic progress for user
topicSchema.methods.getProgressForUser = async function(userId) {
  const Problem = require('./Problem');
  const Submission = require('./Submission');
  
  // Get all problems for this topic
  const totalProblems = await Problem.countDocuments({ topic: this._id, isActive: true });
  
  // Get solved problems count
  const solvedProblems = await Submission.countDocuments({
    user: userId,
    status: 'accepted'
  }).populate({
    path: 'problem',
    match: { topic: this._id }
  });
  
  const progressPercentage = totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;
  
  return {
    totalProblems,
    solvedProblems,
    progressPercentage,
    isCompleted: progressPercentage === 100
  };
};

// Instance method to check if user can access topic
topicSchema.methods.canUserAccess = async function(userId) {
  const User = require('./User');
  const user = await User.findById(userId).populate('completedTopics.topic');
  
  if (!user) return false;
  
  // Check if user has completed prerequisites
  if (this.prerequisites && this.prerequisites.length > 0) {
    const completedTopicIds = user.completedTopics.map(ct => ct.topic._id.toString());
    const hasPrerequisites = this.prerequisites.every(prereq => 
      completedTopicIds.includes(prereq.toString())
    );
    
    return hasPrerequisites;
  }
  
  return true;
};

// Instance method to add section
topicSchema.methods.addSection = function(sectionData) {
  const newSection = {
    ...sectionData,
    order: sectionData.order || this.sections.length + 1
  };
  
  this.sections.push(newSection);
  this.sections.sort((a, b) => a.order - b.order);
  
  return this.save();
};

// Instance method to update statistics
topicSchema.methods.updateStats = async function() {
  const Problem = require('./Problem');
  const Progress = require('./Progress');
  
  // Update problem count
  this.stats.totalProblems = await Problem.countDocuments({ topic: this._id, isActive: true });
  
  // Calculate completion rate
  const totalUsers = await Progress.countDocuments({ topic: this._id });
  const completedUsers = await Progress.countDocuments({ topic: this._id, isCompleted: true });
  
  this.stats.completionRate = totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0;
  
  // Update popularity score based on recent activity
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentActivity = await Progress.countDocuments({
    topic: this._id,
    updatedAt: { $gte: oneWeekAgo }
  });
  
  this.stats.popularityScore = recentActivity;
  
  return this.save();
};

// Static method to get learning path
topicSchema.statics.getLearningPath = async function(difficulty = 'Beginner') {
  return this.find({ 
    difficulty, 
    isActive: true, 
    isPublished: true 
  })
  .populate('prerequisites', 'title slug')
  .populate('nextTopics', 'title slug')
  .sort({ order: 1 });
};

// Static method to get featured topics
topicSchema.statics.getFeatured = function(limit = 6) {
  return this.find({ 
    isFeatured: true, 
    isActive: true, 
    isPublished: true 
  })
  .sort({ 'stats.popularityScore': -1 })
  .limit(limit);
};

// Static method to get recommended topics for user
topicSchema.statics.getRecommendedForUser = async function(userId, limit = 3) {
  const User = require('./User');
  const user = await User.findById(userId).populate('completedTopics.topic');
  
  if (!user) return [];
  
  const completedTopicIds = user.completedTopics.map(ct => ct.topic._id);
  const userDifficulty = user.preferences.difficulty || 'beginner';
  const difficultyMap = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
  
  return this.find({
    _id: { $nin: completedTopicIds },
    difficulty: difficultyMap[userDifficulty],
    isActive: true,
    isPublished: true
  })
  .sort({ 'stats.popularityScore': -1 })
  .limit(limit);
};

// Static method to search topics
topicSchema.statics.searchTopics = function(query, filters = {}) {
  const searchQuery = {
    isActive: true,
    isPublished: true,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { 'concepts.name': { $regex: query, $options: 'i' } }
    ]
  };
  
  if (filters.difficulty) {
    searchQuery.difficulty = filters.difficulty;
  }
  if (filters.category) {
    searchQuery.category = filters.category;
  }
  
  return this.find(searchQuery).sort({ 'stats.popularityScore': -1 });
};

module.exports = mongoose.model('Topic', topicSchema);