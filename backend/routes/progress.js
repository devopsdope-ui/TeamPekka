// @route   GET /api/progress/analytics
// @desc    Get detailed progress analytics
// @access  Private
router.get('/analytics', auth, [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year'])
], async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get progress data for the user in this timeframe
    const userProgress = await Progress.find({
      user: req.user.id,
      updatedAt: { $gte: startDate, $lte: now }
    }).populate('topic', 'title slug difficulty');

    // Aggregate analytics (example: total study time, sessions, milestones)
    const totalTimeSpent = userProgress.reduce((acc, prog) => acc + (prog.totalTimeSpent || 0), 0);
    const totalSessions = userProgress.reduce((acc, prog) => acc + (prog.studySessions?.length || 0), 0);
    const milestonesAchieved = userProgress.reduce((acc, prog) => acc + (prog.milestones?.length || 0), 0);

    // Optionally, prepare per-topic breakdown
    const topicsAnalytics = userProgress.map(p => ({
      topic: {
        id: p.topic._id,
        title: p.topic.title,
        slug: p.topic.slug,
        difficulty: p.topic.difficulty
      },
      totalTimeSpent: p.totalTimeSpent || 0,
      sessions: p.studySessions?.length || 0,
      milestones: p.milestones?.length || 0,
      completed: p.isCompleted
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalTimeSpent,
          totalSessions,
          milestonesAchieved,
          period
        },
        topics: topicsAnalytics
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics'
    });
  }
});
const topics = await Topic.find(topicQuery).sort({ order: 1 });
const userProgress = await Progress.find({ user: req.user.id });
const supabase = require('../supabaseClient');
const supabase = require('../supabaseClient');

const { data, error } = await supabase
  .from('topics')
  .select('*')
  .order('order', { ascending: true });

if (error) {
  return res.status(500).json({ message: error.message });
}

res.json(data);


module.exports = router;

