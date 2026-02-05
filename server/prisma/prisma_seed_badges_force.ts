import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const badges = [
  { name: 'The Starter', description: 'Created your first 5 habits.', icon: 'Zap', type: 'HABIT_COUNT', threshold: 5 },
  { name: 'On Fire', description: 'Reached a 7-day streak!', icon: 'Flame', type: 'STREAK', threshold: 7 },
  { name: 'Habit Master', description: 'Created 20 habits. You are unstoppable!', icon: 'Trophy', type: 'HABIT_COUNT', threshold: 20 },
  { name: 'Unbreakable', description: 'Reached a 30-day streak!', icon: 'Lock', type: 'STREAK', threshold: 30 },
  { name: 'Social Butterfly', description: 'Added 5 friends.', icon: 'Users', type: 'SOCIAL', threshold: 5 },
];

async function main() {
  console.log('Starting badge seed (UPSERT MODE)...');
  for (const b of badges) {
    const badge = await prisma.badge.upsert({
      where: { name: b.name },
      update: {
        description: b.description,
        icon: b.icon,
        type: b.type,
        threshold: b.threshold,
      },
      create: {
        name: b.name,
        description: b.description,
        icon: b.icon,
        type: b.type,
        threshold: b.threshold,
      },
    });
    console.log(`Upserted badge: ${badge.name}`);
  }
  const count = await prisma.badge.count();
  console.log(`Total badges in database: ${count}`);
  console.log('Badge seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
