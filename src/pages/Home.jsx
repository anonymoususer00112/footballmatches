import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import MatchList from '../components/MatchList';
import LeagueFilter from '../components/LeagueFilter';
import { matchAPI } from '../services/api';

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState('');

  useEffect(() => {
    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterMatches();
  }, [matches, selectedLeague]);

  const fetchLiveMatches = async () => {
    try {
      const response = await matchAPI.getLiveMatches();
      setMatches(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load matches');
      setLoading(false);
    }
  };

  const filterMatches = () => {
    if (selectedLeague === '') {
      setFilteredMatches(matches);
    } else {
      setFilteredMatches(
        matches.filter(match => match.league.id === parseInt(selectedLeague))
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
        </Col>
        <Col lg={10}>
          <MatchList 
            matches={filteredMatches}
            loading={loading}
            error={error}
            title="Live Matches"
          />
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
