import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- VPS DATABASE VERIFICATION ---');

  const userCount = await prisma.user.count();
  console.log(`Users in DB: ${userCount}`);

  if (userCount > 0) {
    const user = await prisma.user.findFirst({ include: { habits: true } });
    console.log(`Sample User: ${user?.name} | Habits: ${user?.habits.length ?? 0}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
