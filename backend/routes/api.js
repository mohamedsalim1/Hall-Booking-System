const express = require('express');
const { getHalls, createHall, updateHall, deleteHall } = require('../controllers/hallController');
const { getEventTypes, createEventType, updateEventType, deleteEventType } = require('../controllers/eventTypeController');
const { getServices, createService, updateService, deleteService } = require('../controllers/serviceController');
const { getTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot } = require('../controllers/timeSlotController');
const {
  listBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  confirmBooking,
  cancelBooking,
  archiveBooking,
  unarchiveBooking,
} = require('../controllers/bookingController');
const { createPayment, getPayments, deletePayment } = require('../controllers/paymentController');
const { getAvailability } = require('../controllers/availabilityController');

const router = express.Router();

router.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'API ping successful' });
});

router.get('/halls', getHalls);
router.post('/halls', createHall);
router.put('/halls/:id', updateHall);
router.delete('/halls/:id', deleteHall);

router.get('/event-types', getEventTypes);
router.post('/event-types', createEventType);
router.put('/event-types/:id', updateEventType);
router.delete('/event-types/:id', deleteEventType);

router.get('/services', getServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);

router.get('/time-slots', getTimeSlots);
router.post('/time-slots', createTimeSlot);
router.put('/time-slots/:id', updateTimeSlot);
router.delete('/time-slots/:id', deleteTimeSlot);

router.get('/bookings', listBookings);
router.post('/bookings', createBooking);
router.get('/bookings/:id', getBookingById);
router.put('/bookings/:id', updateBooking);
router.delete('/bookings/:id', deleteBooking);
router.patch('/bookings/:id/confirm', confirmBooking);
router.patch('/bookings/:id/cancel', cancelBooking);
router.patch('/bookings/:id/archive', archiveBooking);
router.patch('/bookings/:id/unarchive', unarchiveBooking);

router.post('/payments', createPayment);
router.get('/payments', getPayments);
router.delete('/payments/:id', deletePayment);

router.get('/availability', getAvailability);

module.exports = router;
