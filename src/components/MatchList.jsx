import React from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import MatchCard from './MatchCard';

const MatchList = ({ matches, loading, error, title }) => {
  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-3">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (matches.length === 0) {
    return (
      <Container className="py-3">
        <Alert variant="info">No matches available</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-3">
      {title && <h3 className="mb-4">{title}</h3>}
      <Row>
        <Col lg={8} md={10} className="mx-auto">
          {matches?.length > 0 && matches.map((match, index) => (
            <MatchCard key={match._id || match.apiId || `match-${index}`} match={match} />
          ))}
        </Col>
      </Row>
    </Container>
  );
};

export default MatchList;
