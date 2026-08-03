import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import User from '../../../models/User';
import Provider from '../../../models/Provider';

function normalizeEmail(email?: string | null) {
  return (email || '').trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, category, experience, hourlyRate, bio, phone, city, servicesOffered } = body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !category || !phone || !hourlyRate) {
      return NextResponse.json({ error: 'Missing required provider fields' }, { status: 400 });
    }

    await connectToDatabase();

    const provider = await Provider.findOneAndUpdate(
      { userEmail: normalizedEmail },
      {
        $set: {
          userEmail: normalizedEmail,
          category,
          experience: experience || '1-2 years',
          hourlyRate,
          bio: bio || '',
          phone,
          city: city || 'Indiranagar, Bengaluru',
          servicesOffered: servicesOffered?.length
            ? servicesOffered
            : [category + ' General Repair', 'Emergency Service'],
          status: 'active',
        },
      },
      { returnDocument: 'after', upsert: true }
    ).lean();

    const userSetFields: Record<string, any> = { isProvider: true };
    if (city) userSetFields.city = city;
    if (phone) userSetFields.phone = phone;

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: userSetFields,
        $setOnInsert: {
          email: normalizedEmail,
          displayName: body.displayName || normalizedEmail.split('@')[0] || 'Servly Member',
          completedOrders: 0,
          rating: 5.0,
          safetyScore: '100%',
        },
      },
      { returnDocument: 'after', upsert: true }
    ).lean();

    return NextResponse.json({ provider, user }, { status: 200 });
  } catch (error: any) {
    console.error('Error creating provider:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, isProvider } = body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: { isProvider } },
      { returnDocument: 'after' }
    ).lean();

    await Provider.findOneAndUpdate(
      { userEmail: normalizedEmail },
      { $set: { status: isProvider ? 'active' : 'paused' } }
    );

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    console.error('Error toggling provider status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
