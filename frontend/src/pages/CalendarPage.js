import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import BookingDetails from './BookingDetails';
import { fetchBookings, fetchTimeSlots } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './CalendarPage.css';

const CalendarPage = ({ halls, timeSlots: propTimeSlots }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);

  const [dailyBookings, setDailyBookings] = useState([]);
  const [monthlyBookings, setMonthlyBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [timeSlots, setTimeSlots] = useState(propTimeSlots || []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Load timeslots if not passed as prop
  useEffect(() => {
    if (!propTimeSlots || propTimeSlots.length === 0) {
      fetchTimeSlots().then(setTimeSlots).catch(console.error);
    }
  }, [propTimeSlots]);

  // Load monthly bookings whenever month/year changes
  useEffect(() => {
    const loadMonthlyBookings = async () => {
      try {
        const bookingsData = await fetchBookings({ month: month + 1, year, limit: -1, archived: 'all' });
        setMonthlyBookings(bookingsData.bookings || []);
      } catch (error) {
        console.error('Error loading monthly bookings:', error);
      }
    };
    loadMonthlyBookings();
  }, [month, year]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const loadDayBookings = async (dateStr) => {
    setLoadingDaily(true);
    try {
      const bookingsData = await fetchBookings({ date: dateStr, limit: -1, archived: 'all' });
      setDailyBookings(bookingsData.bookings || []);
    } catch (error) {
      console.error('Error loading daily bookings:', error);
    } finally {
      setLoadingDaily(false);
    }
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${dayStr}`;
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate({ dateStr, isPast: cellDate < today, dayNumber: day });
    setShowDayModal(true);
    loadDayBookings(dateStr);
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowDayModal(false);
    setShowBookingDetails(true);
  };

  const handleBookSlot = (hall, timeSlot) => {
    // Navigate to booking form with preselected hall/date/timeslot
    navigate(`/booking/new`, {
      state: {
        preselectedHallId: hall.id,
        preselectedDate: selectedDate?.dateStr,
        preselectedTimeSlotId: timeSlot.id,
      }
    });
  };

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const weekDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const blanks = Array.from({ length: firstDayOfMonth }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarCells = [...blanks, ...days];

  // For a given day, compute per-timeslot booking status
  const getDaySlotInfo = (day) => {
    if (!day) return [];
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${dayStr}`;
    return timeSlots.map(ts => {
      const booking = monthlyBookings.find(
        b => b.date?.startsWith(dateStr) &&
          b.timeSlotId === ts.id &&
          b.status !== 'cancelled'
      );
      return { timeSlot: ts, booking };
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h1>تقويم الحجوزات</h1>
        <div className="calendar-controls">
          <Button onClick={() => navigateMonth(1)}>التالي ←</Button>
          <h2>{year} {monthNames[month]}</h2>
          <Button onClick={() => navigateMonth(-1)}>→ السابق</Button>
        </div>
      </div>

      <Card className="calendar-month-container">
        <div className="calendar-weekdays">
          {weekDays.map(dayName => (
            <div key={dayName} className="weekday-header">{dayName}</div>
          ))}
        </div>
        <div className="calendar-month-grid">
          {calendarCells.map((day, index) => {
            const isToday = day &&
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();

            // Get per-slot booking info for dot indicators
            const slotInfo = getDaySlotInfo(day);
            const bookedSlots = slotInfo.filter(s => s.booking && s.booking.status === 'confirmed');
            const pendingSlots = slotInfo.filter(s => s.booking && s.booking.status === 'pending');

            return (
              <div
                key={index}
                className={`month-cell fade-in-up ${!day ? 'empty' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => handleDayClick(day)}
                style={{ animationDelay: `${index * 0.015}s` }}
              >
                {day && <span className="cell-day-num">{day}</span>}
                {day && (
                  <div className="cell-slot-dots">
                    {bookedSlots.map(s => (
                      <span key={s.timeSlot.id} className="slot-dot confirmed" title={`محجوز: ${s.timeSlot.name}`} />
                    ))}
                    {pendingSlots.map(s => (
                      <span key={s.timeSlot.id} className="slot-dot pending" title={`معلق: ${s.timeSlot.name}`} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="calendar-legend">
        <span className="legend-item"><span className="slot-dot confirmed" /> محجوز</span>
        <span className="legend-item"><span className="slot-dot pending" /> معلق</span>
      </div>

      {/* Day Detail Modal */}
      <Modal
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
        title={`يوم ${selectedDate?.dateStr}`}
      >
        <div className="daily-modal-content">
          {loadingDaily ? (
            <div className="loading-center">
              <div className="loading-spinner" />
              <p>جاري التحميل...</p>
            </div>
          ) : (
            <div className="day-grid">
              {/* Timeslot × Hall table */}
              <div className="day-matrix">
                {/* Header row: timeslots */}
                <div className="matrix-header">
                  <div className="matrix-corner">الصالة</div>
                  {timeSlots.map(ts => (
                    <div key={ts.id} className="matrix-col-header">
                      <span>{ts.name}</span>
                      <small>{ts.startTime} - {ts.endTime}</small>
                    </div>
                  ))}
                </div>

                {/* Hall rows */}
                {halls.map(hall => (
                  <div key={hall.id} className="matrix-row">
                    <div className="matrix-hall-name">
                      <strong>{hall.name}</strong>
                      <small>سعة {hall.capacity}</small>
                    </div>
                    {timeSlots.map(ts => {
                      const booking = dailyBookings.find(
                        b => b.hallId === hall.id &&
                          b.timeSlotId === ts.id &&
                          b.status !== 'cancelled'
                      );

                      if (booking) {
                        return (
                          <div key={ts.id} className={`matrix-cell booked ${booking.status}`}>
                            <span className={`slot-status-badge ${booking.status}`}>
                              {booking.status === 'confirmed' ? '🔴 محجوز' : '🟡 معلق'}
                            </span>
                            <small className="booking-customer">{booking.customerName}</small>
                            <button
                              className="slot-details-btn"
                              onClick={() => handleViewBooking(booking)}
                            >
                              تفاصيل
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div key={ts.id} className="matrix-cell available">
                          <span className="slot-status-badge available">🟢 متاح</span>
                          {!selectedDate?.isPast && (
                            <button
                              className="slot-book-btn"
                              onClick={() => handleBookSlot(hall, ts)}
                            >
                              حجز
                            </button>
                          )}
                          {selectedDate?.isPast && (
                            <small className="past-label">منتهي</small>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={showBookingDetails}
        onClose={() => setShowBookingDetails(false)}
        title="تفاصيل الحجز"
      >
        {selectedBooking && (
          <BookingDetails
            booking={selectedBooking}
            onClose={() => setShowBookingDetails(false)}
            onUpdate={() => {
              setShowBookingDetails(false);
              if (selectedDate) loadDayBookings(selectedDate.dateStr);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default CalendarPage;