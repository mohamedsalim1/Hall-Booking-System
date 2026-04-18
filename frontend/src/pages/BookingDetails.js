import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { confirmBooking, cancelBooking, createPayment, fetchPayments, deletePayment, archiveBooking, unarchiveBooking } from '../services/api';
import { formatCurrency } from '../utils/format';
import './BookingDetails.css';

const PAYMENT_TYPES = [
  { value: 'cash', label: 'كاش' },
  { value: 'transfer', label: 'تحويل بنكي' },
  { value: 'deposit', label: 'دفعة مقدمة' },
  { value: 'final', label: 'دفعة أخيرة' },
  { value: 'other', label: 'أخرى' },
];

const paymentTypeLabel = (type) =>
  PAYMENT_TYPES.find((t) => t.value === type)?.label || type;

const BookingDetails = ({ booking: initialBooking, onClose, onUpdate }) => {
  const [booking, setBooking] = useState(initialBooking);
  const [payments, setPayments] = useState(initialBooking.payments || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentType: 'cash', notes: '' });
  const [paymentError, setPaymentError] = useState('');

  // Synchronize internal state when props change
  useEffect(() => {
    setBooking(initialBooking);
    setPayments(initialBooking.payments || []);
  }, [initialBooking]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const remainingBalance = booking.totalAmount - totalPaid;

  const refreshPayments = async () => {
    try {
      const updated = await fetchPayments(booking.id);
      setPayments(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirm = async () => {
    if (window.confirm('هل أنت متأكد من تأكيد هذا الحجز؟')) {
      setIsProcessing(true);
      try {
        await confirmBooking(booking.id);
        setBooking((b) => ({ ...b, status: 'confirmed' }));
        onUpdate && onUpdate();
      } catch (error) {
        alert(error.response?.data?.message || 'حدث خطأ أثناء تأكيد الحجز');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCancel = async () => {
    if (window.confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) {
      setIsProcessing(true);
      try {
        await cancelBooking(booking.id);
        setBooking((b) => ({ ...b, status: 'cancelled' }));
        onUpdate && onUpdate();
        onClose();
      } catch (error) {
        alert(error.response?.data?.message || 'حدث خطأ أثناء إلغاء الحجز');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleAddPayment = async () => {
    setPaymentError('');
    const amount = Number(paymentForm.amount);
    if (!amount || amount <= 0) {
      setPaymentError('يرجى إدخال مبلغ صحيح أكبر من صفر.');
      return;
    }
    if (amount > remainingBalance + 0.01) {
      setPaymentError(`المبلغ يتجاوز المتبقي (${formatCurrency(remainingBalance)}).`);
      return;
    }
    setIsProcessing(true);
    try {
      await createPayment({
        bookingId: booking.id,
        amountPaid: amount,
        paymentType: paymentForm.paymentType,
        notes: paymentForm.notes || undefined,
      });
      await refreshPayments();
      setBooking((b) => ({ ...b, paidAmount: totalPaid + amount }));
      setPaymentForm({ amount: '', paymentType: 'cash', notes: '' });
      setShowPaymentModal(false);
      onUpdate && onUpdate();
    } catch (error) {
      setPaymentError(error.response?.data?.message || 'حدث خطأ أثناء إضافة الدفعة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('هل تريد حذف هذه الدفعة؟')) return;
    setIsProcessing(true);
    try {
      await deletePayment(paymentId);
      await refreshPayments();
      onUpdate && onUpdate();
    } catch (error) {
      alert(error.response?.data?.message || 'حدث خطأ أثناء حذف الدفعة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    setIsProcessing(true);
    try {
      if (booking.isArchived) {
        await unarchiveBooking(booking.id);
        setBooking(prev => ({ ...prev, isArchived: false }));
      } else {
        await archiveBooking(booking.id);
        setBooking(prev => ({ ...prev, isArchived: true }));
      }
      onUpdate && onUpdate();
    } catch (error) {
      alert('حدث خطأ أثناء تغيير حالة الأرشفة');
    } finally {
      setIsProcessing(false);
    }
  };

  const statusMap = { confirmed: 'مؤكد', pending: 'معلق', cancelled: 'ملغى' };

  return (
    <div className="booking-details">
      <div className="details-grid">
        <div className="detail-section">
          <h3>معلومات العميل</h3>
          <div className="detail-item">
            <span>الاسم:</span>
            <strong>{booking.customerName}</strong>
          </div>
          <div className="detail-item">
            <span>الهاتف:</span>
            <strong>{booking.customerPhone}</strong>
          </div>
        </div>

        <div className="detail-section">
          <h3>تفاصيل المناسبة</h3>
          <div className="detail-item">
            <span>نوع المناسبة:</span>
            <strong>{booking.eventType?.name}</strong>
          </div>
          <div className="detail-item">
            <span>الصالة:</span>
            <strong>{booking.hall?.name}</strong>
          </div>
          <div className="detail-item">
            <span>التاريخ:</span>
            <strong>{new Date(booking.date).toLocaleDateString('ar-SA')}</strong>
          </div>
          <div className="detail-item">
            <span>الفترة:</span>
            <strong>{booking.timeSlot?.name}</strong>
          </div>
        </div>

        <div className="detail-section">
          <h3>ملخص الحجز</h3>
          <div className="detail-item">
            <span>الطاولات:</span>
            <strong>{booking.numberOfTables || '—'}</strong>
          </div>
          <div className="detail-item">
            <span>الضيوف:</span>
            <strong>{booking.guestCount}</strong>
          </div>
          <div className="detail-item">
            <span>الحالة:</span>
            <Badge status={booking.status}>{statusMap[booking.status] || booking.status}</Badge>
          </div>
        </div>

        {/* Financial summary */}
        <div className="detail-section financial-summary">
          <h3>التفاصيل المالية</h3>
          <div className="detail-item">
            <span>الإجمالي:</span>
            <strong className="amount-total">{formatCurrency(booking.totalAmount)}</strong>
          </div>
          <div className="detail-item">
            <span>المدفوع:</span>
            <strong className="amount-paid">{formatCurrency(totalPaid)}</strong>
          </div>
          <div className="detail-item">
            <span>المتبقي:</span>
            <strong className={remainingBalance > 0.01 ? 'amount-remaining warning-amount' : 'amount-paid'}>
              {formatCurrency(remainingBalance)}
            </strong>
          </div>
          {/* Progress bar */}
          {booking.totalAmount > 0 && (
            <div className="payment-progress-container">
              <div
                className="payment-progress-bar"
                style={{ width: `${Math.min(100, (totalPaid / booking.totalAmount) * 100)}%` }}
              />
              <span className="payment-progress-label">
                {Math.round((totalPaid / booking.totalAmount) * 100)}% مدفوع
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="payments-history">
          <h3>سجل الدفعات</h3>
          <div className="payments-list">
            {payments.map((p) => (
              <div key={p.id} className="payment-row">
                <div className="payment-info">
                  <span className="payment-type-badge">{paymentTypeLabel(p.paymentType)}</span>
                  <strong className="payment-amt">{formatCurrency(p.amountPaid)}</strong>
                  <span className="payment-date">
                    {new Date(p.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                  {p.notes && <span className="payment-notes">{p.notes}</span>}
                </div>
                <button
                  className="payment-delete-btn"
                  onClick={() => handleDeletePayment(p.id)}
                  disabled={isProcessing}
                  title="حذف الدفعة"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {booking.notes && (
        <div className="notes-section">
          <h3>ملاحظات</h3>
          <p>{booking.notes}</p>
        </div>
      )}

      {booking.bookingServices && booking.bookingServices.length > 0 && (
        <div className="services-section">
          <h3>الخدمات الإضافية</h3>
          <ul>
            {booking.bookingServices.map((bs) => (
              <li key={bs.id}>
                {bs.service.name}
                {bs.service.price && ` — ${formatCurrency(bs.service.price)}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="actions-section">
        {booking.status === 'pending' && (
          <>
            <Button onClick={handleConfirm} disabled={isProcessing}>
              ✓ تأكيد الحجز
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={isProcessing}>
              إلغاء الحجز
            </Button>
          </>
        )}

        {booking.status !== 'cancelled' && remainingBalance > 0.01 && (
          <Button onClick={() => setShowPaymentModal(true)} disabled={isProcessing}>
            💰 إضافة دفعة
          </Button>
        )}

        <Button
          variant="secondary"
          onClick={() => window.open(`/contract/${booking.id}`, '_blank')}
          title="فتح تقرير الحجز للطباعة"
        >
          🖨️ طباعة التقرير
        </Button>

        <Button
          variant="secondary"
          onClick={handleArchive}
          disabled={isProcessing}
          title={booking.isArchived ? "إلغاء الأرشفة" : "أرشفة الحجز"}
        >
          {booking.isArchived ? '📂 إلغاء الأرشفة' : '📁 أرشفة'}
        </Button>

        <Button variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setPaymentError(''); }}
        title="تسجيل دفعة جديدة"
      >
        <div className="payment-modal-body">
          <div className="payment-summary-row">
            <div className="ps-item">
              <span>الإجمالي</span>
              <strong>{formatCurrency(booking.totalAmount)}</strong>
            </div>
            <div className="ps-item">
              <span>المدفوع</span>
              <strong className="amount-paid">{formatCurrency(totalPaid)}</strong>
            </div>
            <div className="ps-item">
              <span>المتبقي</span>
              <strong className="warning-amount">{formatCurrency(remainingBalance)}</strong>
            </div>
          </div>

          <div className="form-group">
            <label>المبلغ (ل.س)</label>
            <input
              type="number"
              min="1"
              max={remainingBalance}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder={`الحد الأقصى: ${formatCurrency(remainingBalance)}`}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>طريقة الدفع</label>
            <select
              value={paymentForm.paymentType}
              onChange={(e) => setPaymentForm((f) => ({ ...f, paymentType: e.target.value }))}
              className="select"
            >
              {PAYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>ملاحظات (اختياري)</label>
            <input
              type="text"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="مثال: دفعة مقدمة عند الحجز"
            />
          </div>

          {paymentError && <div className="payment-error">{paymentError}</div>}

          <div className="payment-modal-actions">
            <Button onClick={handleAddPayment} disabled={isProcessing}>
              {isProcessing ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowPaymentModal(false); setPaymentError(''); }}>
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingDetails;