const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/leagueController');

router.get('/', leagueController.getAllLeagues);
router.post('/sync', leagueController.syncLeagues);

module.exports = router;
