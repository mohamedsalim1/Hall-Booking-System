import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import BookingForm from './pages/BookingForm';
import BookingsList from './pages/BookingsList';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ContractPage from './pages/ContractPage';
import { fetchHalls, fetchEventTypes, fetchTimeSlots, fetchServices } from './services/api';
import './App.css';

const AppLayout = ({ children }) => {
  return (
    <div className="app-shell admin-layout">
      <Navbar />
      <main className="page-container">
        {children}
      </main>
    </div>
  );
};

function App() {
  const [halls, setHalls] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [hallsData, eventTypesData, timeSlotsData, servicesData] = await Promise.all([
          fetchHalls(),
          fetchEventTypes(),
          fetchTimeSlots(),
          fetchServices(),
        ]);
        setHalls(hallsData);
        setEventTypes(eventTypesData);
        setTimeSlots(timeSlotsData);
        setServices(servicesData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage halls={halls} timeSlots={timeSlots} />} />
          <Route path="/booking/step:step" element={<BookingForm halls={halls} eventTypes={eventTypes} timeSlots={timeSlots} services={services} />} />
          <Route path="/booking/new" element={<BookingForm halls={halls} eventTypes={eventTypes} timeSlots={timeSlots} services={services} />} />
          <Route path="/bookings" element={<BookingsList />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/contract/:id" element={<ContractPage />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
