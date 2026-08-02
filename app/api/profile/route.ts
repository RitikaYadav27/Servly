import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import User from '../../../models/User';
import Provider from '../../../models/Provider';
import {
  getFallbackProvider,
  getFallbackUser,
  saveFallbackUser,
} from '../../../lib/fallback-store';

function normalizeEmail(email?: string | null) {
  return (email || '').trim().toLowerCase();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || 'demo@servly.in';
    const normalizedEmail = normalizeEmail(email);
    const fallbackUser = await getFallbackUser(normalizedEmail);
    const fallbackProvider = await getFallbackProvider(normalizedEmail);

    if (fallbackUser) {
      return NextResponse.json({
        user: fallbackUser,
        provider: fallbackProvider,
      }, { status: 200 });
    }

    try {
      await connectToDatabase();
    } catch (dbError) {
      console.warn('MongoDB unavailable for profile fetch, returning fallback profile:', dbError);
      return NextResponse.json({
        user: {
          email: normalizedEmail,
          displayName: normalizedEmail.includes('@') ? normalizedEmail.split('@')[0] : 'Servly Member',
          city: 'Indiranagar, Bengaluru',
          bio: 'Welcome to my Servly profile! I use Servly for trusted home and local services.',
          isProvider: false,
          completedOrders: 0,
          rating: 5.0,
          safetyScore: '100%',
        },
        provider: null,
      }, { status: 200 });
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        displayName: normalizedEmail.includes('@') ? normalizedEmail.split('@')[0] : 'Servly Member',
        city: 'Indiranagar, Bengaluru',
        bio: 'Welcome to my Servly profile! I use Servly for trusted home and local services.',
        isProvider: false,
        completedOrders: 0,
        rating: 5.0,
      });
    }

    let provider = null;
    if (user.isProvider) {
      provider = await Provider.findOne({ userEmail: normalizedEmail });
    }

    return NextResponse.json({ user, provider }, { status: 200 });
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

    const fallbackUser = await getFallbackUser(normalizedEmail);
    const nextUser = {
      ...(fallbackUser || {
        email: normalizedEmail,
        displayName: displayName || normalizedEmail.split('@')[0] || 'Servly Member',
        photoURL,
        phone: phone || '',
        city: city || 'Indiranagar, Bengaluru',
        bio: bio || '',
        isProvider: false,
        completedOrders: 0,
        rating: 5.0,
        safetyScore: '100%',
      }),
      email: normalizedEmail,
      displayName: displayName || fallbackUser?.displayName || normalizedEmail.split('@')[0] || 'Servly Member',
      photoURL: photoURL || fallbackUser?.photoURL,
      phone: phone || fallbackUser?.phone || '',
      city: city || fallbackUser?.city || 'Indiranagar, Bengaluru',
      bio: bio !== undefined ? bio : fallbackUser?.bio || '',
      isProvider: fallbackUser?.isProvider || false,
      completedOrders: fallbackUser?.completedOrders || 0,
      rating: fallbackUser?.rating || 5.0,
      safetyScore: fallbackUser?.safetyScore || '100%',
    };

    try {
      await connectToDatabase();
    } catch (dbError) {
      console.warn('MongoDB unavailable for profile update, storing fallback user object:', dbError);
      await saveFallbackUser(nextUser);
      return NextResponse.json({ user: nextUser }, { status: 200 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { 
        $set: {
          email: normalizedEmail,
          displayName: displayName || normalizedEmail.split('@')[0] || 'Servly Member',
          ...(city && { city }),
          ...(bio !== undefined && { bio }),
          ...(phone && { phone }),
          ...(photoURL && { photoURL })
        }
      },
      { new: true, upsert: true }
    );

    await saveFallbackUser({
      ...nextUser,
      ...updatedUser.toObject(),
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
