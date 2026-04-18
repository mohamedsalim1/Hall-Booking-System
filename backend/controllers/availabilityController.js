const { prisma } = require('../utils/db');

const getAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required.' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const halls = await prisma.hall.findMany();
    const timeSlots = await prisma.timeSlot.findMany();

    const availability = await Promise.all(
      halls.map(async (hall) => {
        const slots = await Promise.all(
          timeSlots.map(async (slot) => {
            const booking = await prisma.booking.findFirst({
              where: {
                hallId: hall.id,
                date: targetDate,
                timeSlotId: slot.id,
                status: { in: ['pending', 'confirmed'] },
              },
            });

            let status = 'available';
            if (booking) {
              status = booking.status; // 'pending' or 'confirmed'
            }

            return { slot: slot.name, status };
          })
        );

        return { hall: hall.name, slots };
      })
    );

    res.json({ availability });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAvailability };