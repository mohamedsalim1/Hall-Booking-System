# نظام اليزن لإدارة القاعات والمناسبات (Al-Yazan Events Hall) ✨

A premium, full-stack management system designed specifically for luxury wedding halls and event venues. Featuring a custom **Luxury Bento UI**, this system streamlines the entire booking lifecycle from initial inquiry to final contract printing and archiving.

---

## 🌟 Key Features

### 🏛️ Premium Venue Management
- **Smart Calendar**: Real-time availability tracking across multiple halls and time slots.
- **Luxury Bento UI**: A modern, high-end dashboard with gold accents and intuitive grid-based navigation.
- **Full Localization**: Optimized for Arabic language with perfect RTL alignment and typography.

### 📅 Advanced Booking Lifecycle
- **Step-by-Step Wizard**: Streamlined booking process with dynamic input for guests, tables, and services.
- **Status Tracking**: Manage Pendings, Confirmed, and Cancelled bookings with real-time UI updates.
- **Draft & Archive System**: Keep your active list clean by archiving completed events while maintaining full access via pagination.

### 📝 Professional Documentation
- **A4 Optimized Printing**: Generate professional contracts and reports directly from the browser (no external PDF generators needed).
- **Snapshot Pricing**: Records hall and service prices at the time of booking to ensure historical accuracy.

### 📊 Analytics & Reporting
- **Performance Dashboards**: Visual tracking of booking volumes, hall popularity, and event density.
- **Usage Statistics**: Understand your peak periods with per-month and per-hall analytics.
- **Data Export**: Export any list or report to Excel for integration with external accounting software.

---

## 🛠️ Technology Stack

### Frontend (React 18)
- **Framework**: Functional components with custom Hooks for real-time state synchronization.
- **Charts**: `Chart.js` for beautiful data visualization.
- **Navigation**: `React Router 6`.
- **Styling**: Vanilla CSS / CSS Modules with a custom-built "Luxury Bento" design system.

### Backend (Node.js & Express)
- **Database**: PostgreSQL with **Prisma ORM** for high-performance data management.
- **Security**: Helmet, CORS, and Express Rate Limit integration.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+

### Installation & Setup

1. **Clone & Install**
   ```bash
   git clone <repository-url>
   cd appByMeForBooking
   ```

2. **Backend Configuration**
   ```bash
   cd backend
   npm install
   # Create a .env file and set your DATABASE_URL
   # Example: DATABASE_URL="postgresql://user:pass@localhost:5432/alyazan_db?schema=public"
   npx prisma migrate dev
   npm run seed
   ```

3. **Frontend Configuration**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Run Development Mode**
   ```bash
   # Terminal 1 (Backend)
   cd backend && npm run dev

   # Terminal 2 (Frontend)
   cd frontend && npm start
   ```

---

## 📂 Project Structure

```text
alyazan-booking/
├── backend/
│   ├── controllers/      # Business logic (Bookings, Tables, Payments)
│   ├── prisma/           # Database schema and seed data
│   ├── middleware/       # Security and validation
│   └── server.js         # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable "Luxury" UI components
│   │   ├── pages/        # Dashboard, Calendar, Reports, Booking List
│   │   ├── services/     # API integration (Axios)
│   │   └── utils/        # Formatting and printing utilities
└── README.md
```

---

## 🔒 Security & Performance
- **Data Integrity**: Uses Prisma transactions for complex booking operations.
- **Real-time Sync**: The UI automatically refreshes to reflect background status changes (e.g., payments or confirmations).
- **Optimized Loading**: Pagination for archived lists to ensure smooth performance even with thousands of records.

---

## 📜 License
This project is private and tailored specifically for **قصر اليزن للمناسبات**.
