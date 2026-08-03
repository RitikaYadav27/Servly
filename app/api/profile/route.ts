import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import User from '../../../models/User';
import Provider from '../../../models/Provider';

function normalizeEmail(email?: string | null) {
  return (email || '').trim().toLowerCase();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email') || 'demo@servly.in';
  const normalizedEmail = normalizeEmail(email);

  try {
    await connectToDatabase();

    let user = await User.findOne({ email: normalizedEmail }).lean();

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        displayName: normalizedEmail.split('@')[0] || 'Servly Member',
        city: 'Indiranagar, Bengaluru',
        bio: '',
        isProvider: false,
        completedOrders: 0,
        rating: 5.0,
        safetyScore: '100%',
      });
      user = user.toObject ? user.toObject() : user;
    }

    // Always look up provider — don't rely solely on isProvider flag
    const provider = await Provider.findOne({ userEmail: normalizedEmail }).lean();

    // If a provider doc exists but user flag is out of sync, fix it
    if (provider && !user.isProvider) {
      await User.findOneAndUpdate({ email: normalizedEmail }, { $set: { isProvider: true } });
      user = { ...user, isProvider: true };
    }

    return NextResponse.json({ user, provider: provider || null }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, city, bio, phone, displayName, photoURL } = body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          ...(displayName && { displayName }),
          ...(city && { city }),
          ...(bio !== undefined && { bio }),
          ...(phone && { phone }),
          ...(photoURL && { photoURL }),
        },
        $setOnInsert: {
          displayName: displayName || normalizedEmail.split('@')[0] || 'Servly Member',
          isProvider: false,
          completedOrders: 0,
          rating: 5.0,
          safetyScore: '100%',
        },
      },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
