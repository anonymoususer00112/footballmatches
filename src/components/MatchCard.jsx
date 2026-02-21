import React from 'react';
import { Card } from 'react-bootstrap';
import { FaCircle } from 'react-icons/fa';
import './MatchCard.css';

const MatchCard = ({ match }) => {
  const league = match.league || {};
  const homeTeam = match.homeTeam || {};
  const awayTeam = match.awayTeam || {};
  const score = match.score || { home: 0, away: 0 };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(match.status);

  return (
    <Card className="match-card mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <small className="text-muted">
            <img 
              src={league.logo} 
              alt={league.name}
              style={{ width: '16px', height: '16px', marginRight: '5px' }}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/16'; }}
            />
            {league.name}
          </small>
          {isLive && (
            <span className="live-badge">
              <FaCircle className="live-icon" /> LIVE {match.minute && `${match.minute}'`}
            </span>
          )}
          {(match.status === 'SCHEDULED' || match.status === 'TIMED') && (
            <small className="text-muted">{formatDate(match.matchDate || match.utcDate)}</small>
          )}
          {match.status === 'FINISHED' && (
            <span className="badge bg-secondary">FT</span>
          )}
        </div>

        <div className="match-teams">
          <div className="team-row">
            <div className="team-info">
              <img 
                src={homeTeam.logo} 
                alt={homeTeam.name}
                className="team-logo"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/24'; }}
              />
              <span className="team-name">{homeTeam.name}</span>
            </div>
            <span className="score">{score.home}</span>
          </div>

          <div className="team-row">
            <div className="team-info">
              <img 
                src={awayTeam.logo} 
                alt={awayTeam.name}
                className="team-logo"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/24'; }}
              />
              <span className="team-name">{awayTeam.name}</span>
            </div>
            <span className="score">{score.away}</span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default MatchCard;
