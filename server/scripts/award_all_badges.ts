import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'da42c474-1255-4ff9-913e-186a3c633719'; // hacckey

  const badges = await prisma.badge.findMany();
  if (!badges.length) {
    console.log('No badges found to award.');
    return;
  }

  for (const b of badges) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: b.id } },
      update: {},
      create: { userId, badgeId: b.id },
    });
    await prisma.notification.create({
      data: {
        userId,
        type: 'ACHIEVEMENT',
        content: `Unlocked "${b.name}" badge!`,
      },
    });
    console.log(`Awarded ${b.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
