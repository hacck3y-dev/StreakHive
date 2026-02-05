import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const users = await prisma.user.findMany({ select: { id: true, username: true, name: true } });
  console.log(users);
  await prisma.$disconnect();
})();
