const { prisma } = require('../utils/db');

const getTimeSlots = async (req, res, next) => {
  try {
    const timeSlots = await prisma.timeSlot.findMany({ orderBy: { id: 'asc' } });
    res.json({ timeSlots });
  } catch (error) {
    next(error);
  }
};

const createTimeSlot = async (req, res, next) => {
  try {
    const { startTime, endTime, price } = req.body;

    if (!startTime || !endTime || !price) {
      return res.status(400).json({ message: 'Start time, end time, and price are required.' });
    }

    const name = `${startTime} - ${endTime}`;

    const timeSlot = await prisma.timeSlot.create({
      data: {
        name,
        startTime,
        endTime,
        price: Number(price),
      },
    });

    res.status(201).json({ timeSlot });
  } catch (error) {
    next(error);
  }
};

const updateTimeSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, price } = req.body;

    const timeSlot = await prisma.timeSlot.findUnique({ where: { id: Number(id) } });
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found.' });
    }

    const name = `${startTime} - ${endTime}`;

    const updatedTimeSlot = await prisma.timeSlot.update({
      where: { id: Number(id) },
      data: {
        name,
        startTime,
        endTime,
        price: Number(price),
      },
    });

    res.json({ timeSlot: updatedTimeSlot });
  } catch (error) {
    next(error);
  }
};

const deleteTimeSlot = async (req, res, next) => {
  try {
    const { id } = req.params;

    const timeSlot = await prisma.timeSlot.findUnique({ where: { id: Number(id) } });
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found.' });
    }

    // Check if time slot has bookings
    const bookingCount = await prisma.booking.count({
      where: { timeSlotId: Number(id) },
    });

    if (bookingCount > 0) {
      return res.status(400).json({ message: 'Cannot delete time slot with existing bookings.' });
    }

    await prisma.timeSlot.delete({ where: { id: Number(id) } });
    res.json({ message: 'Time slot deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot };
