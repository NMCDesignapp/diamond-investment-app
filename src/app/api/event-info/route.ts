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
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load event info' }, { status: 500 });
  }
}

// POST update event info
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, date, location } = body;

    // Get current values to preserve fields not provided
    const current = await db.eventInfo.findUnique({ where: { id: 'default' } });

    const eventInfo = await db.eventInfo.upsert({
      where: { id: 'default' },
      update: {
        name: name !== undefined ? name : (current?.name || 'SỰ KIỆN ĐẦU TƯ 2025'),
        date: date !== undefined ? date : (current?.date || ''),
        location: location !== undefined ? location : (current?.location || ''),
      },
      create: {
        id: 'default',
        name: name || 'SỰ KIỆN ĐẦU TƯ 2025',
        date: date !== undefined ? date : '',
        location: location !== undefined ? location : '',
      },
    });

    return NextResponse.json({ success: true, eventInfo });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save event info' }, { status: 500 });
  }
}
