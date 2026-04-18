const { prisma } = require('../utils/db');

// إضافة دفعة جديدة
const createPayment = async (req, res, next) => {
  try {
    const { bookingId, amountPaid, paymentType, notes } = req.body;

    if (!bookingId || !amountPaid || !paymentType) {
      return res.status(400).json({ message: 'bookingId و amountPaid و paymentType مطلوبة.' });
    }

    if (Number(amountPaid) <= 0) {
      return res.status(400).json({ message: 'يجب أن يكون المبلغ أكبر من صفر.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: { payments: true },
    });

    if (!booking) {
      return res.status(404).json({ message: 'الحجز غير موجود.' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'لا يمكن إضافة دفعة لحجز ملغى.' });
    }

    // التحقق من أن المبلغ لا يتجاوز المتبقي
    const currentPaid = booking.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const remaining = booking.totalAmount - currentPaid;

    if (Number(amountPaid) > remaining + 0.01) {
      return res.status(400).json({
        message: `المبلغ المدخل (${amountPaid}) يتجاوز المبلغ المتبقي (${remaining.toFixed(2)}).`,
      });
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: Number(bookingId),
        amountPaid: Number(amountPaid),
        paymentType,
        notes: notes || null,
      },
    });

    // تحديث paidAmount على الحجز
    const newPaidAmount = currentPaid + Number(amountPaid);
    await prisma.booking.update({
      where: { id: Number(bookingId) },
      data: { paidAmount: newPaidAmount },
    });

    res.status(201).json({ payment, newPaidAmount, remaining: booking.totalAmount - newPaidAmount });
  } catch (error) {
    next(error);
  }
};

// جلب دفعات حجز معين
const getPayments = async (req, res, next) => {
  try {
    const { bookingId } = req.query;

    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId مطلوب.' });
    }

    const payments = await prisma.payment.findMany({
      where: { bookingId: Number(bookingId) },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ payments });
  } catch (error) {
    next(error);
  }
};

// حذف دفعة
const deletePayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({ where: { id: Number(id) } });
    if (!payment) {
      return res.status(404).json({ message: 'الدفعة غير موجودة.' });
    }

    await prisma.payment.delete({ where: { id: Number(id) } });

    // إعادة حساب paidAmount
    const remainingPayments = await prisma.payment.findMany({
      where: { bookingId: payment.bookingId },
    });
    const newPaidAmount = remainingPayments.reduce((sum, p) => sum + p.amountPaid, 0);

    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { paidAmount: newPaidAmount },
    });

    res.json({ message: 'تم حذف الدفعة بنجاح.', newPaidAmount });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPayment, getPayments, deletePayment };
