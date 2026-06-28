-- Fix: Add primary key constraint to EventInfo table
-- This was missing from the initial migration, causing upsert to fail
ALTER TABLE "EventInfo" ADD CONSTRAINT "EventInfo_pkey" PRIMARY KEY ("id");
