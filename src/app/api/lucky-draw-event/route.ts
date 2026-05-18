import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let event = await db.luckyDrawEvent.findUnique({ where: { id: 'default' } });
    if (!event) {
      event = await db.luckyDrawEvent.create({
        data: { id: 'default', name: 'QUAY SỐ MAY MẮN', date: '', location: '' },
      });
    }
    return NextResponse.json({ success: true, eventInfo: event });
  } catch (error: unknown) {
    console.error('LuckyDrawEvent GET error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch lucky draw event';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, date, location } = await request.json();
    const event = await db.luckyDrawEvent.upsert({
      where: { id: 'default' },
      update: { name, date, location },
      create: { id: 'default', name, date, location },
    });
    return NextResponse.json({ success: true, eventInfo: event });
  } catch (error: unknown) {
    console.error('LuckyDrawEvent POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save lucky draw event';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
