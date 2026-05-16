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

  // Create default gift tiers if none exist
  const existingTiers = await prisma.giftTier.count()
  if (existingTiers === 0) {
    await prisma.giftTier.createMany({
      data: [
        { minFee: 0, maxFee: 50000000, giftName: 'Quà Bạc', giftValue: 500000, order: 0 },
        { minFee: 50000000, maxFee: 200000000, giftName: 'Quà Vàng', giftValue: 2000000, order: 1 },
        { minFee: 200000000, maxFee: 500000000, giftName: 'Quà Kim Cương', giftValue: 5000000, order: 2 },
        { minFee: 500000000, maxFee: 999999999999, giftName: 'Quà VIP', giftValue: 10000000, order: 3 },
      ],
    })
  }

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
