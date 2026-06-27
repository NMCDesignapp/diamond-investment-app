import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET event info
export async function GET() {
  try {
    let eventInfo = await db.eventInfo.findUnique({ where: { id: 'default' } });
    if (!eventInfo) {
      eventInfo = await db.eventInfo.create({
        data: {
          id: 'default',
          name: 'SỰ KIỆN ĐẦU TƯ 2025',
          date: '20/03/2025',
          location: 'TP. Hồ Chí Minh',
        },
      });
    }
    return NextResponse.json({ success: true, eventInfo });
  } catch (error: unknown) {
    console.error('EventInfo GET error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load event info';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST update event info
export async function POST(request: NextRequest) {
  try {
    const { name, date, location } = await request.json();

    const eventInfo = await db.eventInfo.upsert({
      where: { id: 'default' },
      update: { name, date, location },
      create: { id: 'default', name, date, location },
    });

    return NextResponse.json({ success: true, eventInfo });
  } catch (error: unknown) {
    console.error('EventInfo POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save event info';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
