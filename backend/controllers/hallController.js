const { prisma } = require('../utils/db');

const getHalls = async (req, res, next) => {
  try {
    const halls = await prisma.hall.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.json({ halls });
  } catch (error) {
    next(error);
  }
};

const createHall = async (req, res, next) => {
  try {
    const { name, capacity, price, tablePrice, description } = req.body;

    if (!name || !capacity || !price) {
      return res.status(400).json({ message: 'Hall name, capacity, and price are required.' });
    }

    const hall = await prisma.hall.create({
      data: {
        name,
        capacity: Number(capacity),
        price: Number(price),
        tablePrice: Number(tablePrice) || 0,
        description,
      },
    });

    res.status(201).json({ hall });
  } catch (error) {
    next(error);
  }
};

const updateHall = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, capacity, price, tablePrice, description } = req.body;

    const hall = await prisma.hall.findUnique({ where: { id: Number(id) } });
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found.' });
    }

    const updatedHall = await prisma.hall.update({
      where: { id: Number(id) },
      data: {
        name,
        capacity: Number(capacity),
        price: Number(price),
        tablePrice: Number(tablePrice) || 0,
        description,
      },
    });

    res.json({ hall: updatedHall });
  } catch (error) {
    next(error);
  }
};

const deleteHall = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hall = await prisma.hall.findUnique({ where: { id: Number(id) } });
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found.' });
    }

    // Check if hall has bookings
    const bookingCount = await prisma.booking.count({
      where: { hallId: Number(id) },
    });

    if (bookingCount > 0) {
      return res.status(400).json({ message: 'Cannot delete hall with existing bookings.' });
    }

    await prisma.hall.delete({ where: { id: Number(id) } });
    res.json({ message: 'Hall deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHalls, createHall, updateHall, deleteHall };
