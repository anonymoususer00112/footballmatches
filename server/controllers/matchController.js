const Match = require('../models/Match');
const apiService = require('../services/apiService');

// Get live matches
exports.getLiveMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      status: { $in: ['LIVE', 'IN_PLAY', 'PAUSED'] }
    }).sort({ matchDate: -1 });
    
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get matches by date
exports.getMatchesByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const matches = await Match.find({
      matchDate: { $gte: startDate, $lte: endDate }
    }).sort({ matchDate: 1 });

    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get upcoming matches - read from MongoDB only (cron fills data every 2 min)
exports.getUpcomingMatches = async (req, res) => {
  try {
    const now = new Date();
    const limit = parseInt(req.query.limit) || 50;

    const matches = await Match.find({
      matchDate: { $gte: now },
      status: { $in: ['SCHEDULED', 'TIMED', 'LIVE', 'IN_PLAY', 'PAUSED'] }
    })
      .sort({ matchDate: 1 })
      .limit(limit);

    res.json(matches);
  } catch (error) {
    console.error('❌ Error in getUpcomingMatches:', error.message);
    res.status(500).json({ message: error.message || 'Failed to load upcoming matches' });
  }
};

// Get finished matches
exports.getFinishedMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      status: 'FINISHED'
    })
    .sort({ matchDate: -1 })
    .limit(20);

    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get match by ID
exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get matches by league
exports.getMatchesByLeague = async (req, res) => {
  try {
    const { leagueId } = req.params;
    const matches = await Match.find({
      'league.id': parseInt(leagueId)
    }).sort({ matchDate: -1 });

    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sync matches from API (admin function)
exports.syncMatches = async (req, res) => {
  try {
    console.log('🔄 Starting manual sync...');
    
    // Fetch live matches
    const liveMatches = await apiService.fetchLiveMatches();
    console.log(`✅ Synced ${liveMatches.length} live matches`);
    
    // Fetch upcoming matches (API allows max 10-day period)
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0];
    const upcomingMatches = await apiService.fetchUpcomingMatches(today, nextWeek);
    console.log(`✅ Synced ${upcomingMatches.length} upcoming matches`);

    res.json({ 
      message: 'Matches synced successfully',
      liveMatches: liveMatches.length,
      upcomingMatches: upcomingMatches.length
    });
  } catch (error) {
    console.error('❌ Sync error:', error.message);
    res.status(500).json({ message: error.message });
  }
};
