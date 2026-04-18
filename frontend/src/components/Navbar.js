import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="brand">
        <div className="brand-crest">O</div>
        <div className="brand-title">
          <strong>قصر اليزن للمناسبات</strong>
          <small>الإدارة والتنظيم</small>
        </div>
      </div>
      <div className="nav-links">
        <Link
          to="/dashboard"
          className={`nav-link ${location.pathname === '/' || location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          اللوحة
        </Link>
        <Link
          to="/calendar"
          className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}
        >
          التقويم
        </Link>
        <Link
          to="/booking/new"
          className={`nav-link ${location.pathname.includes('/booking/') ? 'active' : ''}`}
        >
          حجز جديد
        </Link>
        <Link
          to="/bookings"
          className={`nav-link ${location.pathname === '/bookings' ? 'active' : ''}`}
        >
          قائمة الحجوزات
        </Link>
        <Link
          to="/reports"
          className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}
        >
          التقارير
        </Link>
        <Link
          to="/settings"
          className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
        >
          الإعدادات
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
