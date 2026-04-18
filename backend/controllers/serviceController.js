const { prisma } = require('../utils/db');

const getServices = async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { name: 'asc' } });
    res.json({ services });
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const { name, price, description } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Service name and price are required.' });
    }

    const service = await prisma.service.create({
      data: {
        name,
        price: Number(price),
        description,
      },
    });

    res.status(201).json({ service });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, description } = req.body;

    const service = await prisma.service.findUnique({ where: { id: Number(id) } });
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    const updatedService = await prisma.service.update({
      where: { id: Number(id) },
      data: {
        name,
        price: Number(price),
        description,
      },
    });

    res.json({ service: updatedService });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({ where: { id: Number(id) } });
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    // Check if service has bookings
    const bookingCount = await prisma.bookingService.count({
      where: { serviceId: Number(id) },
    });

    if (bookingCount > 0) {
      return res.status(400).json({ message: 'Cannot delete service with existing bookings.' });
    }

    await prisma.service.delete({ where: { id: Number(id) } });
    res.json({ message: 'Service deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getServices, createService, updateService, deleteService };
