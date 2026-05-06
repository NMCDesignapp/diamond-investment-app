import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET all customers
export async function GET() {
  try {
    const customers = await db.customer.findMany({
      orderBy: { investmentFee: 'desc' },
    });
    return NextResponse.json({ success: true, customers });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load customers' }, { status: 500 });
  }
}

// POST create or update customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, advisor, investmentFee, gift, giftValue, status, note } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Tên khách hàng là bắt buộc' }, { status: 400 });
    }

    let customer;
    if (id) {
      customer = await db.customer.update({
        where: { id },
        data: {
          name: name.trim(),
          advisor: advisor?.trim() || '',
          investmentFee: parseFloat(String(investmentFee)) || 0,
          gift: gift || '',
          giftValue: parseFloat(String(giftValue)) || 0,
          status: status || 'Chưa nhận quà',
          note: note || '',
        },
      });
    } else {
      customer = await db.customer.create({
        data: {
          name: name.trim(),
          advisor: advisor?.trim() || '',
          investmentFee: parseFloat(String(investmentFee)) || 0,
          gift: gift || '',
          giftValue: parseFloat(String(giftValue)) || 0,
          status: status || 'Chưa nhận quà',
          note: note || '',
        },
      });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save customer' }, { status: 500 });
  }
}

// DELETE customer
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }
    await db.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete customer' }, { status: 500 });
  }
}
