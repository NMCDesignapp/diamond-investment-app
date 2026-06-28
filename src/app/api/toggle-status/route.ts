import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST toggle customer received status from remote
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Customer ID is required' }, { status: 400 });
    }
    const customer = await db.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }
    const newStatus = customer.status === 'Đã nhận quà' ? 'Chưa nhận quà' : 'Đã nhận quà';
    const updated = await db.customer.update({
      where: { id },
      data: { status: newStatus },
    });
    return NextResponse.json({ success: true, customer: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to toggle status' }, { status: 500 });
  }
}
