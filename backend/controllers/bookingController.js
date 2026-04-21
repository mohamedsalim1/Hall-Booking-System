const { prisma } = require('../utils/db');

// Helper: Validate booking data
const validateBookingData = (data) => {
  const { customerName, customerPhone, eventTypeId, hallId, date, timeSlotId, numberOfTables } = data;

  if (!customerName || !customerPhone || !eventTypeId || !hallId || !date || !timeSlotId || !numberOfTables) {
    return 'جميع حقول الحجز مطلوبة.';
  }

  if (numberOfTables <= 0) {
    return 'يجب أن يكون عدد الطاولات أكبر من 0.';
  }

  const [year, month, day] = date.split('-');
  const bookingDate = new Date(year, month - 1, day);
  bookingDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (bookingDate < today) {
    return 'لا يمكن الحجز في تواريخ ماضية.';
  }

  return null; // No errors
};

// Helper: Check for conflicts
const checkBookingConflict = async (hallId, date, timeSlotId) => {
  const existing = await prisma.booking.findFirst({
    where: {
      hallId: Number(hallId),
      date: new Date(date),
      timeSlotId: Number(timeSlotId),
      status: { in: ['pending', 'confirmed'] },
    },
  });

  if (existing) {
    return existing.status === 'confirmed'
      ? 'هذه الصالة محجوزة بالفعل في التاريخ والفترة المحددة.'
      : 'هذه الفترة قيد الحجز حالياً وربما تؤكد قريباً.';
  }

  return null; // No conflict
};

const listBookings = async (req, res, next) => {
  try {
    const { date, hall_id, status, month, year, archived, search, page = 1, limit = 10 } = req.query;
    let where = {};
    if (archived !== 'all') {
      where.isArchived = archived === 'true';
    }

    if (date) {
      where.date = new Date(date);
    }

    if (hall_id) {
      where.hallId = Number(hall_id);
    }

    if (status) {
      where.status = status;
    }

    if (year) {
      if (month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);
        where.date = { gte: startDate, lt: endDate };
      } else {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(Number(year) + 1, 0, 1);
        where.date = { gte: startDate, lt: endDate };
      }
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerPhone: { contains: search } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit) === -1 ? undefined : Number(limit);

    const [bookings, totalBookings] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: limit === -1 ? undefined : skip,
        take,
        orderBy: { date: 'asc' },
        include: {
          hall: true,
          eventType: true,
          timeSlot: true,
          bookingServices: { include: { service: true } },
          payments: true,
        },
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      bookings,
      pagination: {
        totalBookings,
        totalPages: take ? Math.ceil(totalBookings / take) : 1,
        currentPage: Number(page),
        pageSize: take || totalBookings
      }
    });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: {
        hall: true,
        eventType: true,
        timeSlot: true,
        bookingServices: { include: { service: true } },
        payments: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: 'الحجز غير موجود.' });
    }

    res.json({ booking });
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      eventTypeId,
      hallId,
      date,
      timeSlotId,
      numberOfTables,
      notes,
      serviceIds = [],
    } = req.body;

    const validationError = validateBookingData(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const hall = await prisma.hall.findUnique({ where: { id: Number(hallId) } });
    if (!hall) {
      return res.status(404).json({ message: 'الصالة غير موجودة.' });
    }

    if (Number(numberOfTables) > hall.capacity) {
      return res.status(400).json({ message: 'عدد الطاولات المطلوب يتجاوز سعة الصالة.' });
    }

    const eventType = await prisma.eventType.findUnique({ where: { id: Number(eventTypeId) } });
    if (!eventType) {
      return res.status(400).json({ message: 'نوع الحدث المحدد غير متاح.' });
    }

    const timeSlot = await prisma.timeSlot.findUnique({ where: { id: Number(timeSlotId) } });
    if (!timeSlot) {
      return res.status(400).json({ message: 'الفترة الزمنية المحددة غير صالحة.' });
    }

    const conflictError = await checkBookingConflict(hallId, date, timeSlotId);
    if (conflictError) {
      return res.status(400).json({ message: conflictError });
    }

    const guestCount = (req.body.guestCount !== undefined && req.body.guestCount !== '') ? Number(req.body.guestCount) : (Number(numberOfTables) * 10);
    const hallPriceFlat = hall.price || 0;
    const appliedTablePrice = (req.body.tablePrice !== undefined && req.body.tablePrice !== null && req.body.tablePrice !== '') ? Number(req.body.tablePrice) : (hall.tablePrice || 0);
    
    const tablesTotal = Number(numberOfTables) * appliedTablePrice;
    const timeSlotTotal = timeSlot.price || 0;
    const servicesTotal = 0; // Will be calculated if services are added

    const totalAmount = hallPriceFlat + tablesTotal + timeSlotTotal + servicesTotal;

    const booking = await prisma.booking.create({
      data: {
        customerName,
        customerPhone,
        customerEmail,
        eventTypeId: Number(eventTypeId),
        hallId: Number(hallId),
        date: new Date(date),
        timeSlotId: Number(timeSlotId),
        guestCount,
        numberOfTables: Number(numberOfTables),
        tablePrice: appliedTablePrice,
        totalAmount,
        paidAmount: 0,
        status: 'pending',
        notes,
      },
    });

    if (Array.isArray(serviceIds) && serviceIds.length > 0) {
      const bookingServices = serviceIds.map((serviceId) => ({
        bookingId: booking.id,
        serviceId: Number(serviceId),
      }));
      await prisma.bookingService.createMany({ data: bookingServices });

      // Recalculate total with services
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds.map(id => Number(id)) } }
      });
      const servicesTotal = services.reduce((sum, service) => sum + service.price, 0);
      const newTotal = hallPriceFlat + tablesTotal + timeSlotTotal + servicesTotal;

      await prisma.booking.update({
        where: { id: booking.id },
        data: { totalAmount: newTotal }
      });

      booking.totalAmount = newTotal;
    }

    res.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
};

const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const booking = await prisma.booking.findUnique({ where: { id: Number(id) } });
    if (!booking) {
      return res.status(404).json({ message: 'الحجز غير موجود.' });
    }

    if (booking.status === 'confirmed') {
      return res.status(400).json({ message: 'لا يمكن تحديث حجز مؤكد.' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: updates,
    });

    res.json({ booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id: Number(id) } });
    if (!booking) {
      return res.status(404).json({ message: 'الحجز غير موجود.' });
    }

    if (booking.status === 'confirmed') {
      return res.status(400).json({ message: 'لا يمكن حذف حجز مؤكد.' });
    }

    await prisma.booking.delete({ where: { id: Number(id) } });

    res.json({ message: 'تم حذف الحجز بنجاح.' });
  } catch (error) {
    next(error);
  }
};

const confirmBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id: Number(id) } });
    if (!booking) {
      return res.status(404).json({ message: 'الحجز غير موجود.' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'يمكن تأكيد الحجوزات المعلقة فقط.' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { status: 'confirmed' },
    });

    res.json({ booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id: Number(id) } });
    if (!booking) {
      return res.status(404).json({ message: 'الحجز غير موجود.' });
    }

    if (booking.status === 'confirmed') {
      return res.status(400).json({ message: 'لا يمكن إلغاء حجز مؤكد.' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { status: 'cancelled' },
    });

    res.json({ booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};

const archiveBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { isArchived: true },
    });
    res.json({ message: 'تم أرشفة الحجز بنجاح.', booking });
  } catch (error) {
    next(error);
  }
};

const unarchiveBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { isArchived: false },
    });
    res.json({ message: 'تم الغاء أرشفة الحجز بنجاح.', booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  confirmBooking,
  cancelBooking,
  archiveBooking,
  unarchiveBooking,
};
