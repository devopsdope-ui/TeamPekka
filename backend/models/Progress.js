const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  // Core References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic is required']
  },
  
  // Progress Status
  isStarted: {
    type: Boolean,
    default: false
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Time Tracking
  startedAt: Date,
  completedAt: Date,
  totalTimeSpent: {
    type: Number, // in minutes
    default: 0
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  
  // Section Progress
  sectionsProgress: [{
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    sectionTitle: String,
    isCompleted: {
      type: Boolean,
      default: false
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0
    },
    completedAt: Date,
    notes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  
  // Quiz Progress
  quizResults: [{
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    totalQuestions: Number,
    correctAnswers: Number,
    attemptedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: Number, // in seconds
    answers: [{
      questionId: mongoose.Schema.Types.ObjectId,
      selectedAnswer: String,
      isCorrect: Boolean,
      timeSpent: Number
    }]
  }],
  
  // Problem Solving Progress
  problemsProgress: {
    attempted: [{
      problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem'
      },
      attempts: Number,
      solved: Boolean,
      firstAttemptAt: Date,
      solvedAt: Date,
      bestSubmission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission'
      }
    }],
    totalAttempted: {
      type: Number,
      default: 0
    },
    totalSolved: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    }
  },
  
  // Learning Milestones
  milestones: [{
    name: String,
    description: String,
    achievedAt: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['time_based', 'problem_count', 'section_completion', 'quiz_score', 'streak', 'custom']
    },
    value: Number // milestone value (e.g., 10 problems, 5 hours, etc.)
  }],
  
  // Performance Metrics
  performance: {
    averageQuizScore: {
      type: Number,
      default: 0
    },
    bestQuizScore: {
      type: Number,
      default: 0
    },
    conceptsMastered: [{
      conceptId: mongoose.Schema.Types.ObjectId,
      conceptName: String,
      masteredAt: Date,
      confidence: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
      }
    }],
    weakAreas: [String],
    strongAreas: [String]
  },
  
  // Learning Preferences
  preferences: {
    studyReminders: {
      type: Boolean,
      default: true
    },
    preferredStudyTime: {
      start: String, // HH:MM format
      end: String    // HH:MM format
    },
    dailyGoal: {
      type: Number, // in minutes
      default: 30
    },
    weeklyGoal: {
      type: Number, // in minutes
      default: 210 // 3.5 hours
    }
  },
  
  // Streaks
  streaks: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastActivityDate: Date
  },
  
  // Study Sessions
  studySessions: [{
    startedAt: {
      type: Date,
      required: true
    },
    endedAt: Date,
    duration: Number, // in minutes
    sectionsStudied: [String],
    problemsAttempted: Number,
    problemsSolved: Number,
    notes: String,
    mood: {
      type: String,
      enum: ['frustrated', 'confused', 'neutral', 'confident', 'excited']
    },
    productivity: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  
  // AI Insights
  aiInsights: {
    learningStyle: String,
    recommendedFocus: [String],
    nextSteps: [String],
    estimatedCompletionDate: Date,
    difficultyAdjustment: {
      type: String,
      enum: ['decrease', 'maintain', 'increase']
    },
    lastAnalyzed: Date
  },
  
  // Feedback and Notes
  feedback: [{
    type: {
      type: String,
      enum: ['self', 'ai', 'mentor', 'peer']
    },
    content: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  personalNotes: String,
  publicNotes: String, // for sharing with community
  
  // Collaboration
  studyGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup'
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
progressSchema.index({ user: 1, topic: 1 }, { unique: true });
progressSchema.index({ user: 1, completionPercentage: -1 });
progressSchema.index({ topic: 1, isCompleted: 1 });
progressSchema.index({ lastActiveAt: -1 });
progressSchema.index({ 'streaks.current': -1 });

// Virtual for estimated completion time
progressSchema.virtual('estimatedTimeRemaining').get(function() {
  if (this.completionPercentage === 0) return null;
  
  const avgTimePerPercent = this.totalTimeSpent / this.completionPercentage;
  const remainingPercent = 100 - this.completionPercentage;
  
  return Math.round(avgTimePerPercent * remainingPercent);
});

// Virtual for current study pace
progressSchema.virtual('studyPace').get(function() {
  if (!this.startedAt) return 'not_started';
  
  const daysSinceStart = Math.max(1, Math.ceil((Date.now() - this.startedAt) / (1000 * 60 * 60 * 24)));
  const avgMinutesPerDay = this.totalTimeSpent / daysSinceStart;
  
  if (avgMinutesPerDay >= 60) return 'intensive';
  if (avgMinutesPerDay >= 30) return 'regular';
  if (avgMinutesPerDay >= 15) return 'moderate';
  return 'light';
});

// Virtual for completion status
progressSchema.virtual('status').get(function() {
  if (this.isCompleted) return 'completed';
  if (this.completionPercentage >= 80) return 'almost_complete';
  if (this.completionPercentage >= 50) return 'halfway';
  if (this.isStarted) return 'in_progress';
  return 'not_started';
});

// Pre-save middleware to update completion status
progressSchema.pre('save', function(next) {
  // Update completion percentage based on sections completed
  if (this.sectionsProgress && this.sectionsProgress.length > 0) {
    const completedSections = this.sectionsProgress.filter(section => section.isCompleted).length;
    this.completionPercentage = Math.round((completedSections / this.sectionsProgress.length) * 100);
    
    // Mark as completed if all sections are done
    if (this.completionPercentage === 100 && !this.isCompleted) {
      this.isCompleted = true;
      this.completedAt = new Date();
    }
  }
  
  // Update problem success rate
  if (this.problemsProgress.totalAttempted > 0) {
    this.problemsProgress.successRate = Math.round(
      (this.problemsProgress.totalSolved / this.problemsProgress.totalAttempted) * 100
    );
  }
  
  // Update activity tracking
  this.lastActiveAt = new Date();
  
  next();
});

// Pre-save middleware to update streaks
progressSchema.pre('save', function(next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = this.streaks.lastActivityDate ? new Date(this.streaks.lastActivityDate) : null;
  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
  }
  
  if (!lastActivity || lastActivity.getTime() !== today.getTime()) {
    const daysDiff = lastActivity ? Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24)) : 0;
    
    if (daysDiff === 1) {
      // Consecutive day - increment streak
      this.streaks.current += 1;
      if (this.streaks.current > this.streaks.longest) {
        this.streaks.longest = this.streaks.current;
      }
    } else if (daysDiff > 1) {
      // Streak broken - reset
      this.streaks.current = 1;
    } else if (daysDiff === 0 && !lastActivity) {
      // First activity
      this.streaks.current = 1;
    }
    
    this.streaks.lastActivityDate = today;
  }
  
  next();
});

// Instance method to start a study session
progressSchema.methods.startStudySession = function() {
  if (!this.isStarted) {
    this.isStarted = true;
    this.startedAt = new Date();
  }
  
  const session = {
    startedAt: new Date(),
    problemsAttempted: 0,
    problemsSolved: 0
  };
  
  this.studySessions.push(session);
  return this.save();
};

// Instance method to end current study session
progressSchema.methods.endStudySession = function(sessionData = {}) {
  const currentSession = this.studySessions[this.studySessions.length - 1];
  if (currentSession && !currentSession.endedAt) {
    currentSession.endedAt = new Date();
    currentSession.duration = Math.round((currentSession.endedAt - currentSession.startedAt) / (1000 * 60));
    
    // Add session data
    Object.assign(currentSession, sessionData);
    
    // Update total time spent
    this.totalTimeSpent += currentSession.duration;
  }
  
  return this.save();
};

// Instance method to complete a section
progressSchema.methods.completeSection = function(sectionId, timeSpent = 0, notes = '') {
  const section = this.sectionsProgress.find(s => s.sectionId.toString() === sectionId.toString());
  
  if (section && !section.isCompleted) {
    section.isCompleted = true;
    section.completedAt = new Date();
    section.timeSpent += timeSpent;
    if (notes) section.notes = notes;
    
    this.totalTimeSpent += timeSpent;
  }
  
  return this.save();
};

// Instance method to attempt a problem
progressSchema.methods.attemptProblem = function(problemId, solved = false) {
  let problemProgress = this.problemsProgress.attempted.find(
    p => p.problem.toString() === problemId.toString()
  );
  
  if (!problemProgress) {
    problemProgress = {
      problem: problemId,
      attempts: 0,
      solved: false,
      firstAttemptAt: new Date()
    };
    this.problemsProgress.attempted.push(problemProgress);
    this.problemsProgress.totalAttempted += 1;
  }
  
  problemProgress.attempts += 1;
  
  if (solved && !problemProgress.solved) {
    problemProgress.solved = true;
    problemProgress.solvedAt = new Date();
    this.problemsProgress.totalSolved += 1;
  }
  
  return this.save();
};

// Instance method to add milestone
progressSchema.methods.addMilestone = function(milestoneData) {
  this.milestones.push({
    ...milestoneData,
    achievedAt: new Date()
  });
  
  return this.save();
};

// Instance method to get learning recommendations
progressSchema.methods.getRecommendations = function() {
  const recommendations = [];
  
  // Based on completion percentage
  if (this.completionPercentage < 25) {
    recommendations.push({
      type: 'focus',
      message: 'Focus on completing the foundational sections first',
      priority: 'high'
    });
  }
  
  // Based on quiz performance
  if (this.performance.averageQuizScore < 60) {
    recommendations.push({
      type: 'review',
      message: 'Review the concepts before moving to harder problems',
      priority: 'medium'
    });
  }
  
  // Based on problem solving
  if (this.problemsProgress.successRate < 40) {
    recommendations.push({
      type: 'practice',
      message: 'Spend more time on easier problems to build confidence',
      priority: 'high'
    });
  }
  
  // Based on study time
  const avgDailyTime = this.preferences.dailyGoal || 30;
  const actualDailyTime = this.studyPace === 'light' ? 15 : 
                          this.studyPace === 'moderate' ? 20 : 
                          this.studyPace === 'regular' ? 40 : 60;
  
  if (actualDailyTime < avgDailyTime) {
    recommendations.push({
      type: 'consistency',
      message: 'Try to maintain your daily study goal for better progress',
      priority: 'medium'
    });
  }
  
  return recommendations;
};

// Static method to get user's overall progress
progressSchema.statics.getUserOverallProgress = async function(userId) {
  const progress = await this.find({ user: userId })
    .populate('topic', 'title difficulty category')
    .sort({ lastActiveAt: -1 });
  
  const totalTopics = progress.length;
  const completedTopics = progress.filter(p => p.isCompleted).length;
  const totalTimeSpent = progress.reduce((sum, p) => sum + p.totalTimeSpent, 0);
  const avgCompletionPercentage = progress.length > 0 ? 
    progress.reduce((sum, p) => sum + p.completionPercentage, 0) / progress.length : 0;
  
  return {
    totalTopics,
    completedTopics,
    totalTimeSpent,
    avgCompletionPercentage: Math.round(avgCompletionPercentage),
    currentStreak: progress.length > 0 ? Math.max(...progress.map(p => p.streaks.current)) : 0,
    longestStreak: progress.length > 0 ? Math.max(...progress.map(p => p.streaks.longest)) : 0,
    recentActivity: progress.slice(0, 5)
  };
};

// Static method to get leaderboard
progressSchema.statics.getLeaderboard = function(timeframe = 'all', limit = 10) {
  const matchConditions = {};
  
  if (timeframe === 'weekly') {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    matchConditions.lastActiveAt = { $gte: oneWeekAgo };
  } else if (timeframe === 'monthly') {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    matchConditions.lastActiveAt = { $gte: oneMonthAgo };
  }
  
  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$user',
        totalTimeSpent: { $sum: '$totalTimeSpent' },
        topicsCompleted: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        avgCompletion: { $avg: '$completionPercentage' },
        maxStreak: { $max: '$streaks.current' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        username: '$user.username',
        avatar: '$user.avatar',
        totalTimeSpent: 1,
        topicsCompleted: 1,
        avgCompletion: { $round: '$avgCompletion' },
        maxStreak: 1,
        score: {
          $add: [
            { $multiply: ['$topicsCompleted', 100] },
            { $multiply: ['$totalTimeSpent', 0.1] },
            { $multiply: ['$maxStreak', 10] }
          ]
        }
      }
    },
    { $sort: { score: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('Progress', progressSchema);