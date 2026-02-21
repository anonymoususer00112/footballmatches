import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { leagueAPI } from '../services/api';

const LeagueFilter = ({ selectedLeague, onLeagueChange }) => {
  const [leagues, setLeagues] = useState([]);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await leagueAPI.getAllLeagues();
      setLeagues(response.data);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  return (
    <Form.Select 
      value={selectedLeague} 
      onChange={(e) => onLeagueChange(e.target.value)}
      className="mb-3"
    >
      <option value="">All Leagues</option>
      {leagues.map((league) => (
        <option key={league.apiId} value={league.apiId}>
          {league.name} ({league.country})
        </option>
      ))}
    </Form.Select>
  );
};

export default LeagueFilter;
