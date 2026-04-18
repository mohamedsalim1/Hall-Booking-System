import React, { useState } from 'react';
import { submitBooking } from '../services/api';

const BookingPage = ({ halls }) => {
  const [form, setForm] = useState({
    clientName: '',
    hallId: halls[0]?.id || '',
    eventDate: '',
    venueSize: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    const result = await submitBooking({
      ...form,
      hallId: Number(form.hallId),
    });

    if (result.booking) {
      setMessage('Booking submitted successfully.');
      setForm({ clientName: '', hallId: halls[0]?.id || '', eventDate: '', venueSize: '' });
    } else {
      setMessage(result.message || 'Unable to complete booking.');
    }
  };

  return (
    <section>
      <div className="section-header">
        <div>
          <h1>Book your elegant hall today.</h1>
          <p>Submit your event request through a refined booking form for a seamless reservation experience.</p>
        </div>
      </div>

      <div className="panel">
        <form onSubmit={handleSubmit} className="input-group">
          <label>
            Guest name
            <input
              type="text"
              name="clientName"
              value={form.clientName}
              onChange={handleChange}
              placeholder="Full name"
              required
            />
          </label>
          <label>
            Select hall
            <select name="hallId" value={form.hallId} onChange={handleChange} required>
              {halls.length > 0 ? (
                halls.map((hall) => (
                  <option key={hall.id} value={hall.id}>
                    {hall.name}
                  </option>
                ))
              ) : (
                <option value="">No halls available</option>
              )}
            </select>
          </label>
          <label>
            Event date
            <input
              type="date"
              name="eventDate"
              value={form.eventDate}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Venue size
            <input
              type="text"
              name="venueSize"
              value={form.venueSize}
              onChange={handleChange}
              placeholder="Example: 200 guests"
              required
            />
          </label>
          <button className="action-button" type="submit">
            Reserve now
          </button>
        </form>
        {message && <p className="footer-note">{message}</p>}
      </div>
    </section>
  );
};

export default BookingPage;
