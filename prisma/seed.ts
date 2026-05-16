import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Upsert default event info
  await prisma.eventInfo.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'SỰ KIỆN ĐẦU TƯ 2025',
      date: '20/03/2025',
      location: 'TP. Hồ Chí Minh',
    },
  })

  // Create default draw prizes if none exist
  const existingPrizes = await prisma.drawPrize.count()
  if (existingPrizes === 0) {
    await prisma.drawPrize.createMany({
      data: [
        { name: 'Giải Nhất', quantity: 1, order: 0 },
        { name: 'Giải Nhì', quantity: 2, order: 1 },
        { name: 'Giải Ba', quantity: 3, order: 2 },
      ],
    })
  }

  console.log('Seed completed!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
