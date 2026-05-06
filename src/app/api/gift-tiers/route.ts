import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET all gift tiers
export async function GET() {
  try {
    const tiers = await db.giftTier.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json({ success: true, tiers });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load gift tiers' }, { status: 500 });
  }
}

// POST save all gift tiers (replace all)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tiers = body.tiers;

    if (!Array.isArray(tiers)) {
      return NextResponse.json({ success: false, error: 'Invalid tiers data' }, { status: 400 });
    }

    // Delete existing and create new
    await db.giftTier.deleteMany();

    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      await db.giftTier.create({
        data: {
          minFee: parseFloat(String(t.minFee)) || 0,
          maxFee: parseFloat(String(t.maxFee)) || 0,
          giftName: t.giftName || '',
          giftValue: parseFloat(String(t.giftValue)) || 0,
          order: i,
        },
      });
    }

    const updated = await db.giftTier.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json({ success: true, tiers: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save gift tiers' }, { status: 500 });
  }
}
