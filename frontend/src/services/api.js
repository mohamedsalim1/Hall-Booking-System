import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4503/api',
});

// Halls
export const fetchHalls = async () => {
  const response = await api.get('/halls');
  return response.data.halls || [];
};

export const createHall = async (hallData) => {
  const response = await api.post('/halls', hallData);
  return response.data.hall;
};

export const updateHall = async (id, hallData) => {
  const response = await api.put(`/halls/${id}`, hallData);
  return response.data.hall;
};

export const deleteHall = async (id) => {
  await api.delete(`/halls/${id}`);
};

// Event Types
export const fetchEventTypes = async () => {
  const response = await api.get('/event-types');
  return response.data.eventTypes || [];
};

export const createEventType = async (eventTypeData) => {
  const response = await api.post('/event-types', eventTypeData);
  return response.data.eventType;
};

export const updateEventType = async (id, eventTypeData) => {
  const response = await api.put(`/event-types/${id}`, eventTypeData);
  return response.data.eventType;
};

export const deleteEventType = async (id) => {
  await api.delete(`/event-types/${id}`);
};

// Services
export const fetchServices = async () => {
  const response = await api.get('/services');
  return response.data.services || [];
};

export const createService = async (serviceData) => {
  const response = await api.post('/services', serviceData);
  return response.data.service;
};

export const updateService = async (id, serviceData) => {
  const response = await api.put(`/services/${id}`, serviceData);
  return response.data.service;
};

export const deleteService = async (id) => {
  await api.delete(`/services/${id}`);
};

// Time Slots
export const fetchTimeSlots = async () => {
  const response = await api.get('/time-slots');
  return response.data.timeSlots || [];
};

export const createTimeSlot = async (timeSlotData) => {
  const response = await api.post('/time-slots', timeSlotData);
  return response.data.timeSlot;
};

export const updateTimeSlot = async (id, timeSlotData) => {
  const response = await api.put(`/time-slots/${id}`, timeSlotData);
  return response.data.timeSlot;
};

export const deleteTimeSlot = async (id) => {
  await api.delete(`/time-slots/${id}`);
};

// Bookings
export const fetchBookings = async (params = {}) => {
  const response = await api.get('/bookings', { params });
  return response.data;
};

export const fetchBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data.booking;
};

export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

export const updateBooking = async (id, bookingData) => {
  const response = await api.put(`/bookings/${id}`, bookingData);
  return response.data;
};

export const deleteBooking = async (id) => {
  await api.delete(`/bookings/${id}`);
};

export const confirmBooking = async (id) => {
  const response = await api.patch(`/bookings/${id}/confirm`);
  return response.data;
};

export const cancelBooking = async (id) => {
  const response = await api.patch(`/bookings/${id}/cancel`);
  return response.data;
};

export const archiveBooking = async (id) => {
  const response = await api.patch(`/bookings/${id}/archive`);
  return response.data;
};

export const unarchiveBooking = async (id) => {
  const response = await api.patch(`/bookings/${id}/unarchive`);
  return response.data;
};

// Payments
export const createPayment = async (paymentData) => {
  const response = await api.post('/payments', paymentData);
  return response.data;
};

export const fetchPayments = async (bookingId) => {
  const response = await api.get('/payments', { params: { bookingId } });
  return response.data.payments || [];
};

export const deletePayment = async (id) => {
  const response = await api.delete(`/payments/${id}`);
  return response.data;
};

// Availability
export const fetchAvailability = async (date) => {
  const response = await api.get('/availability', { params: { date } });
  return response.data.availability || [];
};

export default api;
