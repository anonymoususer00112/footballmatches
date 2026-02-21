const League = require('../models/League');
const apiService = require('../services/apiService');

// Get all leagues
exports.getAllLeagues = async (req, res) => {
  try {
    const leagues = await League.find({ active: true }).sort({ name: 1 });
    res.json(leagues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sync leagues from API
exports.syncLeagues = async (req, res) => {
  try {
    await apiService.fetchLeagues();
    res.json({ message: 'Leagues synced successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
