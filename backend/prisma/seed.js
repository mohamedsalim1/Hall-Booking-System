const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('../generated/client');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = crypto.createHash('sha256').update('admin123').digest('hex');
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  // Create halls
  const halls = [
    {
      name: 'Crystal Ballroom',
      capacity: 200,
      price: 2500,
      description: 'Elegant ballroom with crystal chandeliers and premium sound system'
    },
    {
      name: 'Garden Pavilion',
      capacity: 150,
      price: 1800,
      description: 'Outdoor pavilion with garden views and natural lighting'
    },
    {
      name: 'Executive Suite',
      capacity: 80,
      price: 1200,
      description: 'Intimate executive space perfect for corporate events'
    },
  ];

  // Create time slots
  const timeSlots = [
    { startTime: '08:00', endTime: '12:00', price: 500 },
    { startTime: '12:00', endTime: '16:00', price: 600 },
    { startTime: '16:00', endTime: '20:00', price: 700 },
    { startTime: '20:00', endTime: '24:00', price: 800 },
    { startTime: '08:00', endTime: '24:00', price: 2000 },
  ];

  // Create event types
  const eventTypes = [
    { name: 'Wedding', description: 'Wedding ceremony and reception' },
    { name: 'Corporate Event', description: 'Business meetings and conferences' },
    { name: 'Birthday Party', description: 'Birthday celebrations and parties' },
    { name: 'Anniversary', description: 'Anniversary celebrations' },
    { name: 'Graduation', description: 'Graduation ceremonies' },
  ];

  // Create services
  const services = [
    { name: 'Catering Service', price: 500, description: 'Full catering with multiple cuisine options' },
    { name: 'Photography', price: 800, description: 'Professional photography and videography' },
    { name: 'Floral Arrangements', price: 300, description: 'Custom floral decorations' },
    { name: 'DJ Service', price: 400, description: 'Professional DJ with sound system' },
    { name: 'Valet Parking', price: 150, description: 'Valet parking service' },
  ];

  await Promise.all(
    halls.map((hall) =>
      prisma.hall.upsert({
        where: { name: hall.name },
        update: {},
        create: hall,
      })
    )
  );

  await Promise.all(
    timeSlots.map((slot) =>
      prisma.timeSlot.upsert({
        where: { name: `${slot.startTime} - ${slot.endTime}` },
        update: {},
        create: {
          name: `${slot.startTime} - ${slot.endTime}`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          price: slot.price,
        },
      })
    )
  );

  await Promise.all(
    eventTypes.map((eventType) =>
      prisma.eventType.upsert({
        where: { name: eventType.name },
        update: {},
        create: eventType,
      })
    )
  );

  await Promise.all(
    services.map((service) =>
      prisma.service.upsert({
        where: { name: service.name },
        update: {},
        create: service,
      })
    )
  );

  console.log('Seed complete. Admin user created with email: admin@example.com and password: admin123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
