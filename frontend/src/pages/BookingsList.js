import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import Select from "../components/Select";
import Badge from "../components/Badge";
import Table from "../components/Table";
import Modal from "../components/Modal";
import BookingDetails from "./BookingDetails";
import Pagination from "../components/Pagination";
import {
  fetchBookings,
  fetchHalls,
  archiveBooking,
  unarchiveBooking,
} from "../services/api";
import { formatCurrency } from "../utils/format";
import "./BookingsList.css";

const BookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    totalBookings: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
  });
  const [halls, setHalls] = useState([]);
  const [filters, setFilters] = useState({
    month: "",
    year: "",
    hall_id: "",
    status: "",
    search: "",
    showArchived: false,
    page: 1,
    limit: 10,
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsData, hallsData] = await Promise.all([
        fetchBookings({
          archived: filters.showArchived,
          month: filters.month,
          year: filters.year,
          hall_id: filters.hall_id,
          status: filters.status,
          search: filters.search,
          page: filters.page,
          limit: filters.limit,
        }),
        fetchHalls(),
      ]);
      setBookings(bookingsData.bookings || []);
      setPagination(bookingsData.pagination);
      setHalls(hallsData);

      // Refresh selectedBooking if it's currently open
      if (selectedBooking) {
        const freshBooking = (bookingsData.bookings || []).find(b => b.id === selectedBooking.id);
        if (freshBooking) {
          setSelectedBooking(freshBooking);
        }
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: field === "page" ? value : 1, // Reset page to 1 unless only the page changed
    }));
  };

  const handleArchiveToggle = async (id, isCurrentlyArchived) => {
    try {
      if (isCurrentlyArchived) {
        await unarchiveBooking(id);
      } else {
        await archiveBooking(id);
      }
      // Refresh list
      loadData();
    } catch (error) {
      console.error("Error toggling archive status:", error);
      alert("حدث خطأ أثناء تغيير حالة الأرشفة.");
    }
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const monthOptions = [
    { value: "", label: "جميع الأشهر" },
    { value: 1, label: "يناير" },
    { value: 2, label: "فبراير" },
    { value: 3, label: "مارس" },
    { value: 4, label: "أبريل" },
    { value: 5, label: "مايو" },
    { value: 6, label: "يونيو" },
    { value: 7, label: "يوليو" },
    { value: 8, label: "أغسطس" },
    { value: 9, label: "سبتمبر" },
    { value: 10, label: "أكتوبر" },
    { value: 11, label: "نوفمبر" },
    { value: 12, label: "ديسمبر" },
  ];

  const yearOptions = [
    { value: "", label: "جميع السنوات" },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - 2 + i;
      return { value: year, label: year.toString() };
    })
  ];

  const hallOptions = halls.map((hall) => ({
    value: hall.id,
    label: hall.name,
  }));

  const statusOptions = [
    { value: "pending", label: "معلق" },
    { value: "confirmed", label: "مؤكد" },
    { value: "cancelled", label: "ملغى" },
  ];

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: "معلق",
      confirmed: "مؤكد",
      cancelled: "ملغى",
    };
    return statusMap[status] || status;
  };

  const tableHeaders = [
    "العميل",
    "الحدث",
    "الصالة",
    "التاريخ",
    "الوقت",
    "الطاولات",
    "الضيوف",
    "الحالة",
    "الإجمالي",
    "الإجراءات",
  ];

  const renderTableRow = (booking) => (
    <>
      <td>
        <div>
          <strong>{booking.customerName}</strong>
          <br />
          <small>{booking.customerPhone}</small>
        </div>
      </td>
      <td>{booking.eventType.name}</td>
      <td>{booking.hall.name}</td>
      <td>{new Date(booking.date).toLocaleDateString()}</td>
      <td>{booking.timeSlot.name}</td>
      <td>{booking.numberOfTables}</td>
      <td>{booking.guestCount}</td>
      <td>
        <Badge status={booking.status}>{getStatusLabel(booking.status)}</Badge>
      </td>
      <td>{formatCurrency(booking.totalAmount)}</td>
      <td className="actions-column">
        <div style={{ display: "flex", gap: "8px" }}>
          <Button size="small" onClick={() => handleViewBooking(booking)}>
            عرض
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() => handleArchiveToggle(booking.id, booking.isArchived)}
          >
            {booking.isArchived ? "إلغاء الأرشفة" : "أرشفة"}
          </Button>
        </div>
      </td>
    </>
  );

  if (loading) {
    return <div className="loading">جاري تحميل الحجوزات...</div>;
  }

  return (
    <div className="bookings-list">
      <div className="list-header">
        <div>
          <h1>إدارة الحجوزات</h1>
          <p>عرض وإدارة جميع حجوزات صالات المناسبات</p>
        </div>
        <Link to="/booking/new">
          <Button>حجز جديد</Button>
        </Link>
      </div>

      <Card className="filters-section">
        <h2>الفلاتر والبحث</h2>
        <div className="filters-grid">
          <div className="filter-group">
            <label>الشهر</label>
            <Select
              options={monthOptions}
              value={filters.month}
              onChange={(value) => handleFilterChange("month", value)}
            />
          </div>
          <div className="filter-group">
            <label>السنة</label>
            <Select
              options={yearOptions}
              value={filters.year}
              onChange={(value) => handleFilterChange("year", value)}
            />
          </div>
          <div className="filter-group">
            <label>الصالة</label>
            <Select
              options={hallOptions}
              value={filters.hall_id}
              onChange={(value) => handleFilterChange("hall_id", value)}
              placeholder="جميع الصالات"
            />
          </div>
          <div className="filter-group">
            <label>الحالة</label>
            <Select
              options={statusOptions}
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              placeholder="جميع الحالات"
            />
          </div>
          <div className="filter-group search-group">
            <label>بحث</label>
            <input
              type="text"
              placeholder="اسم العميل أو رقم الهاتف..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>عرض المؤرشف</label>
            <div className="toggle-container">
              <input
                type="checkbox"
                checked={filters.showArchived}
                onChange={(e) =>
                  handleFilterChange("showArchived", e.target.checked)
                }
              />
              <span>إظهار الحجوزات المؤرشفة</span>
            </div>
          </div>
        </div>
      </Card>

    <Card>
      <div className="table-header">
        <h2>
          الحجوزات ({pagination.totalBookings})
        </h2>
      </div>
      {bookings.length > 0 ? (
        <>
          <Table
            headers={tableHeaders}
            data={bookings}
            renderRow={renderTableRow}
          />
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalBookings}
            pageSize={pagination.pageSize}
            onPageChange={(page) => handleFilterChange("page", page)}
          />
        </>
      ) : (
        <div className="no-data">
          <p>لم يتم العثور على حجوزات تطابق بحثك.</p>
        </div>
      )}
    </Card>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="تفاصيل الحجز"
      >
        {selectedBooking && (
          <BookingDetails
            booking={selectedBooking}
            onClose={() => setShowDetailsModal(false)}
            onUpdate={() => {
              // Refresh only the data without full page reload
              loadData();
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default BookingsList;
