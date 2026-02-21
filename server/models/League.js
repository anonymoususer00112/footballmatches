const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
  apiId: {
    type: Number,
    unique: true,
    required: true
  },
  name: String,
  country: String,
  logo: String,
  flag: String,
  season: Number,
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('League', leagueSchema);
