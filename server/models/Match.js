const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  apiId: {
    type: Number,
    unique: true,
    sparse: true
  },
  homeTeam: {
    id: Number,
    name: String,
    logo: String
  },
  awayTeam: {
    id: Number,
    name: String,
    logo: String
  },
  score: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'TIMED', 'LIVE', 'IN_PLAY', 'PAUSED', 'FINISHED', 'POSTPONED', 'CANCELLED', 'SUSPENDED'],
    default: 'SCHEDULED'
  },
  matchDate: {
    type: Date,
    required: true
  },
  league: {
    id: Number,
    name: String,
    country: String,
    logo: String
  },
  minute: Number,
  venue: String
}, {
  timestamps: true
});

matchSchema.index({ matchDate: -1, status: 1 });
matchSchema.index({ matchDate: 1, status: 1 }); // For upcoming matches query
matchSchema.index({ apiId: 1 }); // For upsert operations

module.exports = mongoose.model('Match', matchSchema);
