-- CreateTable
CREATE TABLE "EventInfo" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'SỰ KIỆN ĐẦU TƯ 2025',
    "date" TEXT NOT NULL DEFAULT '20/03/2025',
    "location" TEXT NOT NULL DEFAULT 'TP. Hồ Chí Minh'
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "advisor" TEXT NOT NULL DEFAULT '',
    "investmentFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gift" TEXT NOT NULL DEFAULT '',
    "giftValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Chưa nhận quà',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftTier" (
    "id" TEXT NOT NULL,
    "minFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxFee" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "giftName" TEXT NOT NULL DEFAULT 'Quà mới',
    "giftValue" DOUBLE PRECISION NOT NULL DEFAULT 500000,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GiftTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawPrize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Giải nhất',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DrawPrize_pkey" PRIMARY KEY ("id")
);

-- Seed default event info
INSERT INTO "EventInfo" ("id", "name", "date", "location") VALUES ('default', 'SỰ KIỆN ĐẦU TƯ 2025', '20/03/2025', 'TP. Hồ Chí Minh');
