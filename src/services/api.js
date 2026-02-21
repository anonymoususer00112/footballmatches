import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const matchAPI = {
  getLiveMatches: () => api.get('/matches/live'),
  getUpcomingMatches: (config) => api.get('/matches/upcoming', config),
  getFinishedMatches: () => api.get('/matches/finished'),
  getMatchesByDate: (date) => api.get('/matches/by-date', { params: { date } }),
  getMatchesByLeague: (leagueId) => api.get(`/matches/league/${leagueId}`),
  getMatchById: (id) => api.get(`/matches/${id}`),
  syncMatches: () => api.post('/matches/sync'),
};

export const leagueAPI = {
  getAllLeagues: () => api.get('/leagues'),
  syncLeagues: () => api.post('/leagues/sync'),
};

export default api;
