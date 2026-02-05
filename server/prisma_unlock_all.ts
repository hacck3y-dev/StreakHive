import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔓 Starting to unlock all badges for all users...');

  const users = await prisma.user.findMany();
  const badges = await prisma.badge.findMany();
  console.log(`Found ${users.length} users and ${badges.length} badges.`);

  if (badges.length === 0) {
    console.error('❌ No badges found! Please run the badge seed script first.');
    return;
  }

  let totalUnlocked = 0;
  for (const user of users) {
    console.log(`Processing user: ${user.name} (${user.email})`);
    for (const badge of badges) {
      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId: user.id, badgeId: badge.id } },
        update: {},
        create: { userId: user.id, badgeId: badge.id },
      });
      totalUnlocked++;
    }
  }

  console.log(`✅ Success! Total of ${totalUnlocked} badge connections ensured.`);
  console.log('All users should now see all badges as unlocked.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
