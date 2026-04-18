import React from 'react';
import HallCard from '../components/HallCard';

const HomePage = ({ halls }) => {
  return (
    <section>
      <div className="section-header">
        <div>
          <h1>Reserve the finest spaces for your event.</h1>
          <p>
            Explore three premium halls designed for weddings, celebrations, and exclusive gatherings.
            Every space is crafted for elegance, comfort, and memorable experiences.
          </p>
        </div>
      </div>
      <div className="grid-3">
        {halls.length > 0 ? (
          halls.map((hall) => <HallCard key={hall.id} hall={hall} />)
        ) : (
          <div className="panel">
            <h2 className="card-title">No hall data available</h2>
            <p className="text-muted">Please ensure the backend is running and the database is seeded.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomePage;
