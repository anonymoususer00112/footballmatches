const axios = require('axios');
const Match = require('../models/Match');
const League = require('../models/League');

class SportsAPIService {
  constructor() {
    this.apiKey = process.env.SPORTS_API_KEY;
    this.baseURL = process.env.SPORTS_API_URL || 'https://api.football-data.org/v4';
    
    if (!this.apiKey) {
      console.warn('⚠️  SPORTS_API_KEY not set in environment variables');
    }
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL || "https://api.football-data.org/v4",
      headers: {
        'X-Auth-Token': this.apiKey || 'fbbf8811352c4159a92b51e76584a1ef'
      }
    });
  }

  // Fetch live matches from external API
  async fetchLiveMatches() {
    try {
      const response = await this.axiosInstance.get('/matches', {
        params: { status: 'LIVE' }
      });
      return this.processMatches(response.data.matches);
    } catch (error) {
      console.error('Error fetching live matches:', error.message);
      throw error;
    }
  }

  // Fetch matches by date
  async fetchMatchesByDate(dateFrom, dateTo) {
    try {
      [dateFrom, dateTo] = this._clampDateRange(dateFrom, dateTo);
      const response = await this.axiosInstance.get('/matches', {
        params: { dateFrom, dateTo }
      });
      return this.processMatches(response.data.matches || []);
    } catch (error) {
      console.error('Error fetching matches by date:', error.message);
      if (error.response) {
        console.error('API Response Status:', error.response.status);
        console.error('API Response Data:', error.response.data);
      }
      throw error;
    }
  }

  // Football Data API: specified period must not exceed 10 days
  static get MAX_DATE_RANGE_DAYS() { return 10; }

  // Clamp dateTo so period does not exceed 10 days
  _clampDateRange(dateFrom, dateTo) {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const maxTo = new Date(from);
    maxTo.setDate(maxTo.getDate() + SportsAPIService.MAX_DATE_RANGE_DAYS - 1);
    if (to > maxTo) {
      return [dateFrom, maxTo.toISOString().split('T')[0]];
    }
    return [dateFrom, dateTo];
  }

  // Get team IDs to fetch upcoming matches for (env UPCOMING_TEAM_IDS or default top 10)
  _getUpcomingTeamIds() {
    const envIds = process.env.UPCOMING_TEAM_IDS;
    if (envIds && typeof envIds === 'string') {
      return envIds.split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean);
    }
    // Default: top 10 clubs (Football Data API v4 IDs)
    return [
      86,  // Real Madrid
      81,  // FC Barcelona
      64,  // Liverpool FC
      65,  // Manchester City
      66,  // Manchester United
      61,  // Chelsea FC
      57,  // Arsenal FC
      78,  // Atlético Madrid
      5,   // FC Bayern München
      88   // Paris Saint-Germain
    ];
  }

  // Fetch upcoming matches using /teams/{id}/matches?status=SCHEDULED
  async fetchUpcomingMatches(dateFrom, dateTo) {
    console.log(`📅 Fetching upcoming matches via /teams/{id}/matches?status=SCHEDULED ...`);

    const teamIds = this._getUpcomingTeamIds();
    const seen = new Set();
    let matches = [];
    const now = new Date();

    for (const teamId of teamIds) {
      let list = [];
      for (const status of ['SCHEDULED', 'TIMED']) {
        try {
          const res = await this.axiosInstance.get(`/teams/${teamId}/matches`, {
            params: { status }
          });
          list = Array.isArray(res.data) ? res.data : (res.data?.matches || []);
          if (list.length > 0) break;
          if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
            console.log(`   Team ${teamId} status=${status}: response keys: ${Object.keys(res.data).join(', ')}`);
          }
        } catch (err) {
          const msg = err.response?.data?.message || err.message;
          console.warn(`   Team ${teamId} status=${status}: ${msg}`);
        }
        await new Promise(r => setTimeout(r, 150));
      }
      for (const m of list) {
        if (seen.has(m.id)) continue;
        const matchDate = new Date(m.utcDate || m.date);
        if (matchDate >= now) {
          seen.add(m.id);
          matches.push(m);
        }
      }
      if (list.length > 0) {
        console.log(`   Team ${teamId}: ${list.length} match(es)`);
      }
      await new Promise(r => setTimeout(r, 200));
    }

    console.log(`✅ Total upcoming matches from API: ${matches.length}`);
    return this.processMatches(matches);
  }

  // Fetch finished matches for top 10 teams and save to MongoDB
  async fetchFinishedMatches() {
    const teamIds = this._getUpcomingTeamIds(); // same top 10 teams
    const seen = new Set();
    let matches = [];

    // Optional: limit to last 30 days of finished matches
    const dateTo = new Date();
    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateFromStr = dateFrom.toISOString().split('T')[0];
    const dateToStr = dateTo.toISOString().split('T')[0];

    console.log(`📅 Fetching finished matches (top 10 teams, last 30 days)...`);

    for (const teamId of teamIds) {
      try {
        const res = await this.axiosInstance.get(`/teams/${teamId}/matches`, {
          params: { status: 'FINISHED', dateFrom: dateFromStr, dateTo: dateToStr }
        });
        const list = Array.isArray(res.data) ? res.data : (res.data?.matches || []);
        for (const m of list) {
          if (!seen.has(m.id)) {
            seen.add(m.id);
            matches.push(m);
          }
        }
        if (list.length > 0) {
          console.log(`   Team ${teamId}: ${list.length} finished match(es)`);
        }
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        console.warn(`   Team ${teamId} (finished): ${msg}`);
      }
    }

    console.log(`✅ Total finished matches from API: ${matches.length}`);
    return this.processMatches(matches);
  }

  // Get competition IDs to use (from API or fallback to major leagues)
  async _getAvailableCompetitionIds() {
    try {
      const res = await this.axiosInstance.get('/competitions');
      const comps = res.data.competitions || [];
      const ids = comps.slice(0, 15).map(c => c.id).filter(Boolean);
      if (ids.length > 0) return ids;
    } catch (e) {
      console.log('   Using fallback competition IDs');
    }
    return [2021, 2014, 2002, 2019, 2015, 2003, 2017, 2016];
  }

  // Process and save matches to database
  async processMatches(matches) {
    if (!matches || matches.length === 0) {
      return [];
    }

    const processedMatches = matches?.map(match => {
      // Handle score safely - scheduled matches don't have scores yet
      let score = { home: 0, away: 0 };
      if (match.score && match.score.fullTime) {
        score = {
          home: match.score.fullTime.home ?? 0,
          away: match.score.fullTime.away ?? 0
        };
      } else if (match.score && (match.score.home !== undefined || match.score.away !== undefined)) {
        // Handle different score formats
        score = {
          home: match.score.home ?? 0,
          away: match.score.away ?? 0
        };
      }

      return {
        apiId: match.id,
        homeTeam: {
          id: match.homeTeam?.id || null,
          name: match.homeTeam?.name || 'Unknown',
          logo: match.homeTeam?.crest || match.homeTeam?.logo || 'https://via.placeholder.com/24'
        },
        awayTeam: {
          id: match.awayTeam?.id || null,
          name: match.awayTeam?.name || 'Unknown',
          logo: match.awayTeam?.crest || match.awayTeam?.logo || 'https://via.placeholder.com/24'
        },
        score: score,
        status: match.status || 'SCHEDULED',
        matchDate: new Date(match.utcDate || match.date),
        league: {
          id: match.competition?.id || match.competitionId || null,
          name: match.competition?.name || 'Unknown League',
          country: match.area?.name || match.competition?.area?.name || '',
          logo: match.competition?.emblem || match.competition?.logo || 'https://via.placeholder.com/16'
        },
        minute: match.minute || null,
        venue: match.venue || null
      };
    });

    // Bulk upsert to database
    const bulkOps = processedMatches
      .filter(match => match.apiId) // Only process matches with valid API IDs
      .map(match => ({
        updateOne: {
          filter: { apiId: match.apiId },
          update: { $set: match },
          upsert: true
        }
      }));

    if (bulkOps.length > 0) {
      try {
        await Match.bulkWrite(bulkOps);
        console.log(`✅ Processed and saved ${bulkOps.length} matches`);
      } catch (error) {
        console.error('❌ Error saving matches to database:', error.message);
        // Don't throw - return processed matches even if DB save fails
      }
    }

    return processedMatches;
  }

  // Fetch leagues
  async fetchLeagues() {
    try {
      const response = await this.axiosInstance.get('/competitions');
      const leagues = response.data.competitions.map(comp => ({
        apiId: comp.id,
        name: comp.name,
        country: comp.area.name,
        logo: comp.emblem || 'https://via.placeholder.com/16',
        flag: comp.area.flag,
        season: comp.currentSeason?.startDate ? new Date(comp.currentSeason.startDate).getFullYear() : null
      }));

      // Save to database
      const bulkOps = leagues.map(league => ({
        updateOne: {
          filter: { apiId: league.apiId },
          update: { $set: league },
          upsert: true
        }
      }));

      await League.bulkWrite(bulkOps);
      return leagues;
    } catch (error) {
      console.error('Error fetching leagues:', error.message);
      throw error;
    }
  }
}

module.exports = new SportsAPIService();
