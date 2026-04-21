const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('../generated/client');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

function parseSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function main() {
  const migrationPath = path.resolve(
    __dirname,
    '../prisma/migrations/20260416201807_init/migration.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf8');
  const statements = parseSqlStatements(sql);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log('SQLite schema initialized successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
