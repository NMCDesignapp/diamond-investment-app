import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET stats
export async function GET() {
  try {
    const totalCustomers = await db.customer.count();
    const feeResult = await db.customer.aggregate({
      _sum: { investmentFee: true },
    });
    const giftResult = await db.customer.aggregate({
      _sum: { giftValue: true },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers,
        totalFee: feeResult._sum.investmentFee || 0,
        totalGiftValue: giftResult._sum.giftValue || 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load stats' }, { status: 500 });
  }
}
