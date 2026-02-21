import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import MatchList from '../components/MatchList';
import LeagueFilter from '../components/LeagueFilter';
import { matchAPI } from '../services/api';

const Upcoming = () => {
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState('');

  useEffect(() => {
    fetchUpcomingMatches();
  }, []);

  useEffect(() => {
    filterMatches();
  }, [matches, selectedLeague]);

  const fetchUpcomingMatches = async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await matchAPI.getUpcomingMatches(refresh ? { params: { refresh: 'true' } } : undefined);
      // Backend always returns an array; handle legacy { matches: [] } shape
      const list = Array.isArray(response.data) ? response.data : (response.data?.matches || []);
      setMatches(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load matches');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const filterMatches = () => {
    if (selectedLeague === '') {
      setFilteredMatches(matches);
    } else {
      setFilteredMatches(
        matches.filter(match => match.league?.id === parseInt(selectedLeague, 10))
      );
    }
  };

  return (
    <Container fluid>
      <Row>
        <Col lg={2} className="bg-light p-3">
          <h5>Filters</h5>
          <LeagueFilter 
            selectedLeague={selectedLeague}
            onLeagueChange={setSelectedLeague}
          />
          <button
            type="button"
            className="btn btn-outline-primary btn-sm mt-2 w-100"
            onClick={() => fetchUpcomingMatches(true)}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh from API'}
          </button>
        </Col>
        <Col lg={10}>
          <MatchList 
            matches={filteredMatches}
            loading={loading}
            error={error}
            title="Upcoming Matches"
          />
        </Col>
      </Row>
    </Container>
  );
};

export default Upcoming;
