const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const connectDB = require('./config/db');
const matchRoutes = require('./routes/matches');
const leagueRoutes = require('./routes/leagues');
const apiService = require('./services/apiService');

// Load .env from server directory so it works when running from project root
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Connect to MongoDB
connectDB();

// Middleware - UPDATED CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/matches', matchRoutes);
app.use('/api/leagues', leagueRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Cron job to update live matches every 1 minute
cron.schedule('*/1 * * * *', async () => {
  console.log('🔄 Updating live matches...');
  try {
    await apiService.fetchLiveMatches();
  } catch (error) {
    console.error('❌ Error updating live matches:', error.message);
  }
});

// Cron job to fetch upcoming matches every 2 minutes and save to MongoDB
cron.schedule('*/2 * * * *', async () => {
  console.log('🔄 Cron: Fetching upcoming matches (saving to MongoDB)...');
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0];
    await apiService.fetchUpcomingMatches(today, nextWeek);
    console.log('✅ Cron: Upcoming matches updated in MongoDB');
  } catch (error) {
    console.error('❌ Cron: Error fetching upcoming matches:', error.message);
  }
});

// Cron job to fetch finished matches (top 10 teams) every 10 minutes and save to MongoDB
cron.schedule('*/10 * * * *', async () => {
  console.log('🔄 Cron: Fetching finished matches (top 10 teams, saving to MongoDB)...');
  try {
    await apiService.fetchFinishedMatches();
    console.log('✅ Cron: Finished matches updated in MongoDB');
  } catch (error) {
    console.error('❌ Cron: Error fetching finished matches:', error.message);
  }
});

// Initial fetch on server start
setTimeout(async () => {
  console.log('🚀 Initial fetch of upcoming matches on server start...');
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0];
    const matches = await apiService.fetchUpcomingMatches(today, nextWeek);
    console.log(`✅ Initial fetch: Loaded ${matches.length} upcoming matches`);
  } catch (error) {
    console.error('❌ Initial fetch error:', error.message);
  }
}, 5000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
