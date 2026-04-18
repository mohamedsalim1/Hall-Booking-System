import React from 'react';
import DashboardSummary from '../components/DashboardSummary';
import { formatDate } from '../utils/format';

const AdminPage = ({ halls, bookings }) => {
  return (
    <section>
      <div className="section-header">
        <div>
          <h1>Admin dashboard</h1>
          <p>Monitor bookings and hall performance with a calm, premium interface.</p>
        </div>
      </div>

      <DashboardSummary halls={halls} bookings={bookings} />

      <div style={{ marginTop: '26px' }}>
        <div className="panel">
          <h2 className="card-title">Upcoming bookings</h2>
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <div key={booking.id} className="summary-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <strong>{booking.clientName}</strong>
                <span>{booking.hall?.name || 'Hall not found'} • {formatDate(booking.eventDate)}</span>
                <span className="text-muted">Venue size: {booking.venueSize}</span>
              </div>
            ))
          ) : (
            <p className="text-muted">No bookings have been received yet.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminPage;
