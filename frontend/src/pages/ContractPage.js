import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Button from '../components/Button';
import { fetchBookingById } from '../services/api';
import { formatCurrency } from '../utils/format';
import './ContractPage.css';

const ContractPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contractNote, setContractNote] = useState('ملاحظة هامة: يتم دفع كامل المبلغ قبل الموعد بحد اقصى 7 أيام');
  const contractRef = useRef();

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const bookingData = await fetchBookingById(id);
        setBooking(bookingData);
      } catch (error) {
        console.error('Error loading booking:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [id]);

  const handlePrint = useReactToPrint({
    content: () => contractRef.current,
    documentTitle: `Booking-${booking?.customerName}-${booking?.id}`,
  });

  if (loading) {
    return <div className="loading">جاري تحميل تقرير الحجز...</div>;
  }

  if (!booking) {
    return (
      <div className="error">
        <p>الحجز غير موجود</p>
        <Button onClick={() => navigate('/bookings')}>العودة لقائمة الحجوزات</Button>
      </div>
    );
  }

  const totalPaid = booking.payments?.reduce((sum, payment) => sum + payment.amountPaid, 0) || 0;
  const remainingBalance = booking.totalAmount - totalPaid;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const paymentTypeLabel = (type) => {
    const labels = {
      cash: 'كاش',
      transfer: 'تحويل بنكي',
      deposit: 'دفعة مقدمة',
      final: 'دفعة أخيرة',
      other: 'أخرى'
    };
    return labels[type] || type;
  };

  return (
    <div className="contract-page">
      <div className="contract-actions no-print">
        <Button onClick={handlePrint} className="luxury-btn">طباعة التقرير</Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>رجوع</Button>
      </div>

      <div className="contract-container rtl" ref={contractRef}>
        <div className="contract-header">
          <div className="logo-section">
            <div className="logo-crest">O</div>
            <h1>قصر اليزن للمناسبات</h1>
            <p>للمناسبات والأفراح الفاخرة</p>
          </div>
          <div className="report-title">
            <h2>تفاصيل تأكيد الحجز</h2>
            <p>رقم الحجز: #{booking.id}</p>
          </div>
        </div>

        <div className="contract-body">
          <div className="contract-info-grid">
            <div className="contract-section">
              <h3>معلومات العميل</h3>
              <div className="contract-row">
                <span>اسم العميل:</span>
                <strong>{booking.customerName}</strong>
              </div>
              <div className="contract-row">
                <span>رقم الهاتف:</span>
                <strong>{booking.customerPhone}</strong>
              </div>
            </div>

            <div className="contract-section">
              <h3>تفاصيل الحجز</h3>
              <div className="contract-row">
                <span>القاعة:</span>
                <strong>{booking.hall.name}</strong>
              </div>
              <div className="contract-row">
                <span>نوع المناسبة:</span>
                <strong>{booking.eventType.name}</strong>
              </div>
              <div className="contract-row">
                <span>تاريخ المناسبة:</span>
                <strong>{formatDate(booking.date)}</strong>
              </div>
              <div className="contract-row">
                <span>الفترة الزمنية:</span>
                <strong>{booking.timeSlot.name} ({booking.timeSlot.startTime} - {booking.timeSlot.endTime})</strong>
              </div>
              <div className="contract-row">
                <span>عدد الطاولات:</span>
                <strong>{booking.numberOfTables}</strong>
              </div>
              <div className="contract-row">
                <span>إجمالي عدد الضيوف:</span>
                <strong>{booking.guestCount} ضيف تقريباً</strong>
              </div>
            </div>
          </div>

          <div className="contract-info-grid">
            <div className="contract-section financial-section">
              <h3>الملخص المالي</h3>
              <div className="contract-row">
                <span>سعر الصالة (ثابت):</span>
                <strong>{formatCurrency(booking.hall.price)}</strong>
              </div>
              <div className="contract-row">
                <span>سعر الطاولات ({booking.numberOfTables} * {formatCurrency(booking.tablePrice || 0)}):</span>
                <strong>{formatCurrency(booking.numberOfTables * (booking.tablePrice || 0))}</strong>
              </div>
              <div className="contract-row">
                <span>الإجمالي:</span>
                <strong>{formatCurrency(booking.totalAmount)}</strong>
              </div>
              <div className="contract-row">
                <span>إجمالي المبالغ المدفوعة:</span>
                <strong className="text-success">{formatCurrency(totalPaid)}</strong>
              </div>
              <div className="contract-row total-row">
                <span>المبلغ المتبقي:</span>
                <strong className={remainingBalance > 0 ? "text-danger" : "text-success"}>
                  {formatCurrency(remainingBalance)}
                </strong>
              </div>
              <div className="contract-row">
                <span>حالة الحجز:</span>
                <strong>{booking.status === 'confirmed' ? 'مؤكد' : booking.status === 'pending' ? 'معلق' : 'ملغى'}</strong>
              </div>
            </div>

            {booking.bookingServices && booking.bookingServices.length > 0 && (
              <div className="contract-section">
                <h3>الخدمات والمزايا المضافة</h3>
                {booking.bookingServices.map(bs => (
                  <div key={bs.id} className="contract-row">
                    <span>{bs.service.name}:</span>
                    <strong>{bs.service.price ? formatCurrency(bs.service.price) : 'مشمولة'}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {booking.payments && booking.payments.length > 0 && (
            <div className="contract-section">
              <h3>سجل الدفعات</h3>
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>طريقة الدفع</th>
                    <th>المبلغ</th>
                    <th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.payments.map(p => (
                    <tr key={p.id}>
                      <td>{new Date(p.createdAt).toLocaleDateString('ar-SA')}</td>
                      <td>{paymentTypeLabel(p.paymentType)}</td>
                      <td>{formatCurrency(p.amountPaid)}</td>
                      <td>{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="contract-section terms-section">
            <textarea
              className="contract-note-editor no-print"
              value={contractNote}
              onChange={(e) => setContractNote(e.target.value)}
              placeholder="أدخل ملاحظات العقد هنا..."
            />
            <p className="contract-note-display">{contractNote}</p>
          </div>
        </div>

        <div className="contract-footer">
          <div className="auth-box">
            <p>توقيع العميل</p>
            <div className="signature-space"></div>
          </div>
          <div className="auth-box">
            <p>ختم وتوقيع الإدارة</p>
            <div className="signature-space"></div>
          </div>
        </div>

        <div className="contract-print-footer">
          <p>تم استخراج هذا التقرير آلياً في {new Date().toLocaleString('ar-SA')}</p>
          <p>قصر اليزن للمناسبات - إدارة وتنظيم المناسبات</p>
        </div>
      </div>
    </div>
  );
};

export default ContractPage;