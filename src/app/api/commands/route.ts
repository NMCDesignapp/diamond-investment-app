import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET pending commands (polling from main app)
export async function GET() {
  try {
    const commands = await db.remoteCommand.findMany({
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return NextResponse.json({ success: true, commands });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load commands' }, { status: 500 });
  }
}

// POST send a command from remote
export async function POST(request: NextRequest) {
  try {
    const { command, payload } = await request.json();
    if (!command) {
      return NextResponse.json({ success: false, error: 'Command is required' }, { status: 400 });
    }
    const cmd = await db.remoteCommand.create({
      data: {
        command,
        payload: payload ? JSON.stringify(payload) : '{}',
      },
    });
    return NextResponse.json({ success: true, command: cmd });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to send command' }, { status: 500 });
  }
}

// DELETE consumed commands (after main app processes them)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    if (ids) {
      const idList = ids.split(',');
      await db.remoteCommand.deleteMany({
        where: { id: { in: idList } },
      });
    } else {
      // Delete all commands
      await db.remoteCommand.deleteMany();
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete commands' }, { status: 500 });
  }
}
