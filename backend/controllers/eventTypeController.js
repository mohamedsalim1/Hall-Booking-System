const { prisma } = require('../utils/db');

const getEventTypes = async (req, res, next) => {
  try {
    const eventTypes = await prisma.eventType.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ eventTypes });
  } catch (error) {
    next(error);
  }
};

const createEventType = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Event type name is required.' });
    }

    const eventType = await prisma.eventType.create({
      data: {
        name,
        description,
      },
    });

    res.status(201).json({ eventType });
  } catch (error) {
    next(error);
  }
};

const updateEventType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const eventType = await prisma.eventType.findUnique({ where: { id: Number(id) } });
    if (!eventType) {
      return res.status(404).json({ message: 'Event type not found.' });
    }

    const updatedEventType = await prisma.eventType.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
      },
    });

    res.json({ eventType: updatedEventType });
  } catch (error) {
    next(error);
  }
};

const deleteEventType = async (req, res, next) => {
  try {
    const { id } = req.params;

    const eventType = await prisma.eventType.findUnique({ where: { id: Number(id) } });
    if (!eventType) {
      return res.status(404).json({ message: 'Event type not found.' });
    }

    // Check if event type has bookings
    const bookingCount = await prisma.booking.count({
      where: { eventTypeId: Number(id) },
    });

    if (bookingCount > 0) {
      return res.status(400).json({ message: 'Cannot delete event type with existing bookings.' });
    }

    await prisma.eventType.delete({ where: { id: Number(id) } });
    res.json({ message: 'Event type deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEventTypes, createEventType, updateEventType, deleteEventType };
