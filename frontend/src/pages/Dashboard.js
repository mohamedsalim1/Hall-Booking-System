import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { fetchBookings } from '../services/api';
import { formatCurrency } from '../utils/format';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    monthlyRevenue: 0,
    remainingBalances: 0,
  });
  const [upcomingBookings, setUpcomingBookings] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // Fetch all bookings to extract payments made this month across any booking
        const bookingsData = await fetchBookings({ limit: -1, archived: 'all' });
        const allBookings = bookingsData.bookings || [];

        // 1. Stats based on Event Date (for this month's workload)
        const thisMonthEventBookings = allBookings.filter(b => {
          const bDate = new Date(b.date);
          return bDate.getMonth() + 1 === currentMonth && bDate.getFullYear() === currentYear;
        });

        const totalBookings = thisMonthEventBookings.length;
        const confirmedBookings = thisMonthEventBookings.filter(b => b.status === 'confirmed').length;
        const pendingBookings = thisMonthEventBookings.filter(b => b.status === 'pending').length;

        // 2. Revenue based on Payment Date (Cash Flow - any payment created this month)
        let monthlyRevenue = 0;
        allBookings.forEach(b => {
          b.payments?.forEach(p => {
            const pDate = new Date(p.createdAt);
            if (pDate.getMonth() + 1 === currentMonth && pDate.getFullYear() === currentYear) {
              monthlyRevenue += p.amountPaid;
            }
          });
        });

        // 3. Remaining Balances (Expected income from confirmed bookings this month)
        const remainingBalances = thisMonthEventBookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => {
            const paid = b.payments?.reduce((pSum, p) => pSum + p.amountPaid, 0) || 0;
            return sum + (b.totalAmount - paid);
          }, 0);

        const upcoming = allBookings
          .filter(b => new Date(b.date) >= currentDate && b.status !== 'cancelled')
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5);

        setStats({
          totalBookings,
          confirmedBookings,
          pendingBookings,
          monthlyRevenue,
          remainingBalances,
        });
        setUpcomingBookings(upcoming);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
  }, []);

  const statusLabels = {
    confirmed: 'مؤكد',
    pending: 'معلق',
    cancelled: 'ملغى'
  };

  return (
    <div className="dashboard">
      <div className="admin-hero-banner">
        <div className="admin-hero-content">
          <h1 style={{ color: '#FFFFFF' }}>لوحة تحكم قصر اليزن للمناسبات</h1>
          <p style={{ color: '#ebc374', fontWeight: '500' }}>نظرة عامة على حجوزات وإدارة صالات المناسبات الفاخرة</p>
        </div>
      </div>

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-value">{stats.totalBookings}</div>
          <div className="stat-label">إجمالي الحجوزات</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value">{stats.confirmedBookings}</div>
          <div className="stat-label">مؤكدة</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value">{stats.pendingBookings}</div>
          <div className="stat-label">قيد الانتظار</div>
        </Card>

      </div>

      <div className="upcoming-section">
        <Card>
          <h2>الحجوزات القادمة</h2>
          <div className="upcoming-list">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="upcoming-item">
                  <div className="upcoming-info">
                    <strong>{booking.customerName}</strong>
                    <span>{booking.hall.name} • {booking.timeSlot.name}</span>
                    <span>{new Date(booking.date).toLocaleDateString()}</span>
                  </div>
                  <Badge status={booking.status}>{statusLabels[booking.status] || booking.status}</Badge>
                </div>
              ))
            ) : (
              <p className="no-data">لا توجد حجوزات قادمة</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;