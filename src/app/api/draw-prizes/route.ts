import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const prizes = await db.drawPrize.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json({ success: true, prizes });
  } catch (error: unknown) {
    console.error('DrawPrizes GET error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch draw prizes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prizes } = await request.json();
    // Delete all existing and recreate
    await db.drawPrize.deleteMany();
    const created = await Promise.all(
      prizes.map((p: { name: string; quantity: number }, idx: number) =>
        db.drawPrize.create({
          data: { name: p.name, quantity: p.quantity, order: idx },
        })
      )
    );
    return NextResponse.json({ success: true, prizes: created });
  } catch (error: unknown) {
    console.error('DrawPrizes POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save draw prizes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
