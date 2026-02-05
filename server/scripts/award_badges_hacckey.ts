import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { username: 'hacckeyy' } });
  if (!user) {
    console.log('User not found');
    return;
  }

  const badgeNames = ['The Starter', 'On Fire'];
  const badges = await prisma.badge.findMany({ where: { name: { in: badgeNames } } });

  for (const b of badges) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: user.id, badgeId: b.id } },
      update: {},
      create: { userId: user.id, badgeId: b.id },
    });
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'ACHIEVEMENT',
        content: `Unlocked "${b.name}" badge!`,
      },
    });
    console.log(`Awarded ${b.name} to ${user.username}`);
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
