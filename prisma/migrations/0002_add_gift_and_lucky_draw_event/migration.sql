-- AlterTable: Add gift column to DrawPrize
ALTER TABLE "DrawPrize" ADD COLUMN "gift" TEXT NOT NULL DEFAULT '';

-- CreateTable: LuckyDrawEvent
CREATE TABLE "LuckyDrawEvent" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'QUAY SỐ MAY MẮN',
    "date" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "LuckyDrawEvent_pkey" PRIMARY KEY ("id")
);

-- Seed default lucky draw event
INSERT INTO "LuckyDrawEvent" ("id", "name", "date", "location") VALUES ('default', 'QUAY SỐ MAY MẮN', '', '');
