import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const challenges = [
  {
    name: "6 AM Early Bird",
    description: "Wake up at 6 AM every day to win your morning. Share your morning routine and victory photos here!",
    duration: "30 Days",
    participants: 1250,
  },
  {
    name: "75 Hard (Modified)",
    description: "A transformative mental toughness program. Two 45-min workouts, gallon of water, clean diet, and 10 pages of reading.",
    duration: "75 Days",
    participants: 840,
  },
  {
    name: "Code Daily",
    description: "Consistency is key. Commit to writing code for at least 1 hour every single day. No zero days!",
    duration: "100 Days",
    participants: 2100,
  },
  {
    name: "Hydro Hero",
    description: "Stay hydrated! Drink 3 liters of water daily. Track your intake and feel the energy boost.",
    duration: "21 Days",
    participants: 3400,
  },
  {
    name: "Mindful Minutes",
    description: "15 minutes of meditation or deep breathing. Find your center in the chaos of daily life.",
    duration: "30 Days",
    participants: 1560,
  },
  {
    name: "Step Master 10K",
    description: "Hit 10,000 steps every day. Perfect for health, weight loss, and mental clarity. Let's walk together!",
    duration: "Ongoing",
    participants: 5200,
  },
];

async function main() {
  console.log('Starting seed...');
  for (const c of challenges) {
    // Create a persistent ChatRoom for the challenge forum
    const forumRoom = await prisma.chatRoom.create({
      data: { isGroup: true, name: `${c.name} Forum` },
    });

    // Create the Challenge and link it to the ChatRoom
    await prisma.challenge.create({
      data: {
        name: c.name,
        description: c.description,
        duration: c.duration,
        participants: c.participants,
        roomId: forumRoom.id,
      },
    });

    console.log(`Created challenge: ${c.name}`);
  }
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
