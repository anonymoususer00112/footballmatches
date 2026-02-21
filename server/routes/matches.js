const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

router.get('/live', matchController.getLiveMatches);
router.get('/upcoming', matchController.getUpcomingMatches);
router.get('/finished', matchController.getFinishedMatches);
router.get('/by-date', matchController.getMatchesByDate);
router.get('/league/:leagueId', matchController.getMatchesByLeague);
router.get('/:id', matchController.getMatchById);
router.post('/sync', matchController.syncMatches);

module.exports = router;
