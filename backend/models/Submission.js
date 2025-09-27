const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  // Core References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: [true, 'Problem is required']
  },
  
  // Code Details
  language: {
    type: String,
    enum: ['python', 'javascript', 'cpp', 'java', 'c'],
    required: [true, 'Programming language is required']
  },
  code: {
    type: String,
    required: [true, 'Code is required'],
    maxlength: [50000, 'Code cannot exceed 50000 characters']
  },
  
  // Execution Results
  status: {
    type: String,
    enum: [
      'pending',
      'running',
      'accepted',
      'wrong_answer',
      'time_limit_exceeded',
      'memory_limit_exceeded',
      'runtime_error',
      'compile_error',
      'internal_error'
    ],
    default: 'pending'
  },
  
  // Test Case Results
  testResults: [{
    testCaseId: String,
    input: String,
    expectedOutput: String,
    actualOutput: String,
    passed: Boolean,
    executionTime: Number, // in milliseconds
    memoryUsed: Number // in bytes
  }],
  
  // Performance Metrics
  performance: {
    executionTime: {
      type: Number, // in milliseconds
      default: 0
    },
    memoryUsage: {
      type: Number, // in bytes
      default: 0
    },
    codeLength: {
      type: Number,
      default: 0
    }
  },
  
  // Ranking Information
  ranking: {
    timeRank: Number, // percentile for execution time
    memoryRank: Number, // percentile for memory usage
    overallRank: Number
  },
  
  // Error Information
  error: {
    type: String,
    message: String,
    line: Number,
    column: Number,
    stackTrace: String
  },
  
  // Compilation Information
  compilation: {
    success: {
      type: Boolean,
      default: true
    },
    warnings: [String],
    errors: [String],
    compilationTime: Number // in milliseconds
  },
  
  // Attempt Information
  attemptNumber: {
    type: Number,
    default: 1
  },
  isFirstAcceptedSubmission: {
    type: Boolean,
    default: false
  },
  
  // AI Analysis
  aiAnalysis: {
    codeQuality: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      feedback: String,
      suggestions: [String]
    },
    complexity: {
      time: String,
      space: String,
      analysis: String
    },
    optimizations: [String],
    bestPractices: [String]
  },
  
  // Session Information
  sessionId: String,
  ipAddress: String,
  userAgent: String,
  
  // Timing Information
  startTime: Date,
  endTime: Date,
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  },
  
  // Collaboration (for pair programming)
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['driver', 'navigator', 'observer']
    },
    joinedAt: Date,
    leftAt: Date
  }],
  
  // Version Control
  parentSubmission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  },
  childSubmissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  }],
  
  // Notes and Comments
  notes: String,
  tags: [String],
  
  // Competition/Contest Information
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    default: null
  },
  contestRank: Number,
  penaltyTime: Number,
  
  // Review Information
  needsReview: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewComments: String,
  reviewScore: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Plagiarism Detection
  plagiarismCheck: {
    checked: {
      type: Boolean,
      default: false
    },
    similarity: {
      type: Number,
      min: 0,
      max: 100
    },
    suspiciousPatterns: [String],
    flagged: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
submissionSchema.index({ user: 1, problem: 1 });
submissionSchema.index({ user: 1, createdAt: -1 });
submissionSchema.index({ problem: 1, status: 1 });
submissionSchema.index({ status: 1, createdAt: -1 });
submissionSchema.index({ 'performance.executionTime': 1 });
submissionSchema.index({ 'performance.memoryUsage': 1 });
submissionSchema.index({ language: 1 });
submissionSchema.index({ isFirstAcceptedSubmission: 1 });

// Virtual for success status
submissionSchema.virtual('isAccepted').get(function() {
  return this.status === 'accepted';
});

// Virtual for execution time in human readable format
submissionSchema.virtual('executionTimeFormatted').get(function() {
  const time = this.performance.executionTime;
  if (time < 1000) return `${time}ms`;
  return `${(time / 1000).toFixed(2)}s`;
});

// Virtual for memory usage in human readable format
submissionSchema.virtual('memoryUsageFormatted').get(function() {
  const memory = this.performance.memoryUsage;
  if (memory < 1024) return `${memory}B`;
  if (memory < 1024 * 1024) return `${(memory / 1024).toFixed(2)}KB`;
  return `${(memory / (1024 * 1024)).toFixed(2)}MB`;
});

// Virtual for pass rate
submissionSchema.virtual('passRate').get(function() {
  if (!this.testResults || this.testResults.length === 0) return 0;
  const passed = this.testResults.filter(result => result.passed).length;
  return Math.round((passed / this.testResults.length) * 100);
});

// Pre-save middleware to calculate code length
submissionSchema.pre('save', function(next) {
  if (this.isModified('code')) {
    this.performance.codeLength = this.code.length;
  }
  next();
});

// Pre-save middleware to calculate total time spent
submissionSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    this.totalTimeSpent = Math.round((this.endTime - this.startTime) / 1000);
  }
  next();
});

// Pre-save middleware to update attempt number
submissionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments({
      user: this.user,
      problem: this.problem
    });
    this.attemptNumber = count + 1;
  }
  next();
});

// Pre-save middleware to mark first accepted submission
submissionSchema.pre('save', async function(next) {
  if (this.status === 'accepted' && this.isModified('status')) {
    const hasAcceptedBefore = await this.constructor.findOne({
      user: this.user,
      problem: this.problem,
      status: 'accepted',
      _id: { $ne: this._id }
    });
    
    if (!hasAcceptedBefore) {
      this.isFirstAcceptedSubmission = true;
    }
  }
  next();
});

// Post-save middleware to update problem statistics
submissionSchema.post('save', async function(doc) {
  if (doc.isModified('status') || doc.isNew) {
    const Problem = require('./Problem');
    await Problem.findByIdAndUpdate(doc.problem, {
      $inc: { 'stats.totalAttempts': 1 }
    });
    
    if (doc.status === 'accepted') {
      await Problem.findByIdAndUpdate(doc.problem, {
        $inc: { 'stats.totalSolved': 1 }
      });
    }
  }
});

// Instance method to calculate ranking
submissionSchema.methods.calculateRanking = async function() {
  if (this.status !== 'accepted') return;
  
  const allAcceptedSubmissions = await this.constructor.find({
    problem: this.problem,
    status: 'accepted'
  }).select('performance.executionTime performance.memoryUsage');
  
  if (allAcceptedSubmissions.length === 0) return;
  
  // Calculate time ranking
  const fasterSubmissions = allAcceptedSubmissions.filter(
    sub => sub.performance.executionTime < this.performance.executionTime
  ).length;
  this.ranking.timeRank = Math.round((fasterSubmissions / allAcceptedSubmissions.length) * 100);
  
  // Calculate memory ranking
  const lowerMemorySubmissions = allAcceptedSubmissions.filter(
    sub => sub.performance.memoryUsage < this.performance.memoryUsage
  ).length;
  this.ranking.memoryRank = Math.round((lowerMemorySubmissions / allAcceptedSubmissions.length) * 100);
  
  // Calculate overall ranking (weighted average)
  this.ranking.overallRank = Math.round((this.ranking.timeRank + this.ranking.memoryRank) / 2);
  
  return this.save();
};

// Instance method to get similar solutions
submissionSchema.methods.getSimilarSolutions = async function(limit = 5) {
  return this.constructor.find({
    problem: this.problem,
    language: this.language,
    status: 'accepted',
    _id: { $ne: this._id }
  })
  .sort({ 'performance.executionTime': 1 })
  .limit(limit)
  .populate('user', 'username avatar')
  .select('code performance ranking createdAt user');
};

// Static method to get user's submission history
submissionSchema.statics.getUserHistory = function(userId, options = {}) {
  const { limit = 20, status, language, problemId } = options;
  
  const query = { user: userId };
  if (status) query.status = status;
  if (language) query.language = language;
  if (problemId) query.problem = problemId;
  
  return this.find(query)
    .populate('problem', 'title difficulty slug')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get problem statistics
submissionSchema.statics.getProblemStats = async function(problemId) {
  const stats = await this.aggregate([
    { $match: { problem: mongoose.Types.ObjectId(problemId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgTime: { $avg: '$performance.executionTime' },
        avgMemory: { $avg: '$performance.memoryUsage' }
      }
    }
  ]);
  
  const languageStats = await this.aggregate([
    { $match: { problem: mongoose.Types.ObjectId(problemId), status: 'accepted' } },
    {
      $group: {
        _id: '$language',
        count: { $sum: 1 },
        avgTime: { $avg: '$performance.executionTime' },
        avgMemory: { $avg: '$performance.memoryUsage' }
      }
    }
  ]);
  
  return { statusStats: stats, languageStats };
};

// Static method to detect potential plagiarism
submissionSchema.statics.checkPlagiarism = async function(submission) {
  // Simple similarity check based on code structure
  const similarSubmissions = await this.find({
    problem: submission.problem,
    language: submission.language,
    status: 'accepted',
    _id: { $ne: submission._id }
  }).select('code user');
  
  // This is a simplified plagiarism check
  // In production, you'd use more sophisticated algorithms
  let maxSimilarity = 0;
  const suspiciousPatterns = [];
  
  for (const similar of similarSubmissions) {
    const similarity = calculateCodeSimilarity(submission.code, similar.code);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
    }
    
    if (similarity > 80) {
      suspiciousPatterns.push(`High similarity (${similarity}%) with submission by user ${similar.user}`);
    }
  }
  
  return {
    similarity: maxSimilarity,
    suspiciousPatterns,
    flagged: maxSimilarity > 85
  };
};

// Helper function for code similarity (simplified)
function calculateCodeSimilarity(code1, code2) {
  // Remove whitespace and normalize
  const normalize = (code) => code.replace(/\s+/g, '').toLowerCase();
  const normalized1 = normalize(code1);
  const normalized2 = normalize(code2);
  
  // Simple character-based similarity using Levenshtein distance
  const maxLength = Math.max(normalized1.length, normalized2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(normalized1, normalized2);
  return Math.round((1 - distance / maxLength) * 100);
}

// Simple Levenshtein distance implementation
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

module.exports = mongoose.model('Submission', submissionSchema);