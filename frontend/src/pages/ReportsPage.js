import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import * as XLSX from 'xlsx';
// jsPDF removed due to lack of Arabic support. Replaced with native print.
import { fetchBookings, fetchHalls } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import './ReportsPage.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ReportsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const [filters, setFilters] = useState({
    year: currentYear,
    month: '',
    hallId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, hallsData] = await Promise.all([
        fetchBookings({ limit: -1, archived: 'all' }),
        fetchHalls(),
      ]);
      setBookings(bookingsData.bookings || []);
      setHalls(hallsData);
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل في تحميل بيانات التقارير. يرجى التأكد من تشغيل الخادم.';
      setError(msg);
      console.error('Error fetching reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const matchesYear = bookingDate.getFullYear() === parseInt(filters.year);
    const matchesMonth = !filters.month || bookingDate.getMonth() + 1 === parseInt(filters.month);
    const matchesHall = !filters.hallId || booking.hallId === parseInt(filters.hallId);

    return matchesYear && matchesMonth && matchesHall;
  });

  const calculateMetrics = () => {
    const totalBookings = filteredBookings.length;
    const totalContractValue = filteredBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    // Calculate total cash received in the selected period (by Payment Date)
    let totalCashReceived = 0;
    const yearFilter = parseInt(filters.year);
    const monthFilter = filters.month ? parseInt(filters.month) : null;

    bookings.forEach(b => {
      b.payments?.forEach(p => {
        const pDate = new Date(p.createdAt);
        const matchesYear = pDate.getFullYear() === yearFilter;
        const matchesMonth = !monthFilter || pDate.getMonth() + 1 === monthFilter;
        
        if (matchesYear && matchesMonth) {
          totalCashReceived += p.amountPaid;
        }
      });
    });

    const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = filteredBookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled').length;

    return {
      totalBookings,
      totalContractValue,
      totalCashReceived,
      confirmedBookings,
      pendingBookings,
      cancelledBookings
    };
  };

  const getMonthlyData = () => {
    const monthlyBookings = {};
    const monthlyCashInflow = {};
    const yearFilter = parseInt(filters.year);

    // Bookings count based on Event Date
    filteredBookings.forEach(booking => {
      const month = new Date(booking.date).getMonth() + 1;
      monthlyBookings[month] = (monthlyBookings[month] || 0) + 1;
    });

    // Cash Inflow based on Payment Date
    bookings.forEach(b => {
      b.payments?.forEach(p => {
        const pDate = new Date(p.createdAt);
        if (pDate.getFullYear() === yearFilter) {
          const month = pDate.getMonth() + 1;
          monthlyCashInflow[month] = (monthlyCashInflow[month] || 0) + p.amountPaid;
        }
      });
    });

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const monthLabels = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return {
      labels: monthLabels,
      bookings: months.map(m => monthlyBookings[m] || 0),
      cashInflow: months.map(m => monthlyCashInflow[m] || 0)
    };
  };

  const getHallUsageData = () => {
    const hallUsage = {};

    filteredBookings.forEach(booking => {
      const hallName = halls.find(h => h.id === booking.hallId)?.name || 'غير معروف';
      hallUsage[hallName] = (hallUsage[hallName] || 0) + 1;
    });

    return {
      labels: Object.keys(hallUsage),
      data: Object.values(hallUsage)
    };
  };

  const statusLabels = {
    confirmed: 'مؤكد',
    pending: 'معلق',
    cancelled: 'ملغى'
  };

  const getStatusData = () => {
    const statusCount = {
      confirmed: filteredBookings.filter(b => b.status === 'confirmed').length,
      pending: filteredBookings.filter(b => b.status === 'pending').length,
      cancelled: filteredBookings.filter(b => b.status === 'cancelled').length
    };

    return {
      labels: [statusLabels.confirmed, statusLabels.pending, statusLabels.cancelled],
      data: [statusCount.confirmed, statusCount.pending, statusCount.cancelled]
    };
  };

  const exportToExcel = () => {
    const data = filteredBookings.map(booking => ({
      'معرف الحجز': booking.id,
      'اسم العميل': booking.customerName,
      'هاتف العميل': booking.customerPhone,
      'البريد الإلكتروني': booking.customerEmail,
      'الصالة': halls.find(h => h.id === booking.hallId)?.name || 'غير معروف',
      'نوع الفعالية': booking.eventType?.name || 'غير معروف',
      'التاريخ': formatDate(booking.date),
      'الفترة': booking.timeSlot?.startTime + ' - ' + booking.timeSlot?.endTime,
      'عدد الضيوف': booking.guestCount,
      'المبلغ الإجمالي': booking.totalAmount,
      'المبلغ المدفوع': booking.paidAmount,
      'الرصيد': booking.totalAmount - booking.paidAmount,
      'الحالة': statusLabels[booking.status] || booking.status,
      'ملاحظات': booking.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير الحجوزات');
    XLSX.writeFile(wb, `تقرير-الحجوزات-${filters.year}${filters.month ? `-${filters.month}` : ''}.xlsx`);
  };

  const exportToPDF = () => {
    // Relying on browser's native print-to-PDF which handles Arabic fonts perfectly
    window.print();
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="reports-page">
        <div className="loading">جارٍ تحميل التقارير...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  const metrics = calculateMetrics();
  const monthlyData = getMonthlyData();
  const hallUsageData = getHallUsageData();
  const statusData = getStatusData();

  const barChartData = {
    labels: monthlyData.labels,
    datasets: [{
      label: 'عدد الحجوزات',
      data: monthlyData.bookings,
      backgroundColor: '#FAD4C0',
      borderColor: '#FAD4C0',
      borderWidth: 1
    }]
  };

  const lineChartData = {
    labels: monthlyData.labels,
    datasets: [{
      label: 'التحصيل النقدي (Cash flow)',
      data: monthlyData.cashInflow,
      borderColor: '#80A1C1',
      backgroundColor: 'rgba(128, 161, 193, 0.1)',
      tension: 0.4
    }]
  };

  const pieChartData = {
    labels: hallUsageData.labels,
    datasets: [{
      data: hallUsageData.data,
      backgroundColor: ['#FAD4C0', '#80A1C1', '#16A34A', '#D97706'],
      borderWidth: 1
    }]
  };

  const statusPieData = {
    labels: statusData.labels,
    datasets: [{
      data: statusData.data,
      backgroundColor: ['#16A34A', '#D97706', '#DC2626'],
      borderWidth: 1
    }]
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>لوحة التقارير</h1>
        <div className="filters">
          <select
            value={filters.year}
            onChange={(e) => setFilters({...filters, year: e.target.value})}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
                  <select
              value={filters.month}
              onChange={(e) => setFilters({...filters, month: e.target.value})}
            >
              <option value="">كل الأشهر</option>
              <option value="1">يناير</option>
              <option value="2">فبراير</option>
              <option value="3">مارس</option>
              <option value="4">أبريل</option>
              <option value="5">مايو</option>
              <option value="6">يونيو</option>
              <option value="7">يوليو</option>
              <option value="8">أغسطس</option>
              <option value="9">سبتمبر</option>
              <option value="10">أكتوبر</option>
              <option value="11">نوفمبر</option>
              <option value="12">ديسمبر</option>
            </select>
            <select
              value={filters.hallId}
              onChange={(e) => setFilters({...filters, hallId: e.target.value})}
            >
              <option value="">كل الصالات</option>
              {halls.map(hall => (
                <option key={hall.id} value={hall.id}>{hall.name}</option>
              ))}
            </select>
        </div>
        <div className="export-actions">
            <button onClick={exportToExcel} className="btn btn-secondary">
              تصدير إكسل
            </button>
            <button onClick={exportToPDF} className="btn btn-secondary">
              تصدير PDF
            </button>
            <button onClick={printReport} className="btn btn-secondary">
              طباعة التقرير
            </button>
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <h3>إجمالي الحجوزات</h3>
            <div className="metric-value">{metrics.totalBookings}</div>
          </div>
          <div className="metric-card">
            <h3>مؤكد</h3>
            <div className="metric-value">{metrics.confirmedBookings}</div>
          </div>
          <div className="metric-card">
            <h3>معلق</h3>
            <div className="metric-value">{metrics.pendingBookings}</div>
          </div>
          <div className="metric-card">
            <h3>ملغى</h3>
            <div className="metric-value">{metrics.cancelledBookings}</div>
          </div>
        </div>
      <div className="charts-grid">
        <div className="chart-card">
          <h3>حجوزات الشهر</h3>
          <Bar data={barChartData} options={{ responsive: true }} />
        </div>
        <div className="chart-card">
          <h3>استخدام الصالات</h3>
          <Pie data={pieChartData} options={{ responsive: true }} />
        </div>
        <div className="chart-card">
          <h3>حالة الحجز</h3>
          <Pie data={statusPieData} options={{ responsive: true }} />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;