import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import User from '../../../models/User';
import Provider from '../../../models/Provider';
import {
  getFallbackProvider,
  getFallbackUser,
  saveFallbackProvider,
  saveFallbackUser,
} from '../../../lib/fallback-store';

function normalizeEmail(email?: string | null) {
  return (email || '').trim().toLowerCase();
}

async function buildUserRecord(email: string, body: any) {
  return {
    email,
    displayName: body.displayName || email.split('@')[0] || 'Servly Member',
    photoURL: body.photoURL || undefined,
    phone: body.phone || '',
    city: body.city || 'Indiranagar, Bengaluru',
    bio: body.bio || '',
    isProvider: true,
    completedOrders: 0,
    rating: 5.0,
    safetyScore: '100%',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, category, experience, hourlyRate, bio, phone, city, servicesOffered } = body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !category || !phone || !hourlyRate) {
      return NextResponse.json({ error: 'Missing required provider fields' }, { status: 400 });
    }

    let provider;
    let user;

    try {
      await connectToDatabase();

      const displayName = body.displayName || normalizedEmail.split('@')[0] || 'Servly Member';

      provider = await Provider.findOneAndUpdate(
        { userEmail: normalizedEmail },
        {
          $set: {
            userEmail: normalizedEmail,
            category,
            experience,
            hourlyRate,
            bio,
            phone,
            city,
            servicesOffered: servicesOffered && servicesOffered.length ? servicesOffered : [category + ' General Repair', 'Emergency Service'],
            status: 'active',
          },
        },
        { new: true, upsert: true }
      );

      user = await User.findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { email: normalizedEmail, displayName, isProvider: true, city, phone } },
        { new: true, upsert: true }
      );
    } catch (dbError: any) {
      console.error('MongoDB provider submission failed, using fallback store:', dbError);

      const fallbackUser = await getFallbackUser(normalizedEmail);
      const fallbackProvider = await getFallbackProvider(normalizedEmail);

      const nextUser = await saveFallbackUser({
        ...(fallbackUser || (await buildUserRecord(normalizedEmail, body))),
        email: normalizedEmail,
        displayName: fallbackUser?.displayName || body.displayName || normalizedEmail.split('@')[0] || 'Servly Member',
        phone: phone || fallbackUser?.phone || '',
        city: city || fallbackUser?.city || 'Indiranagar, Bengaluru',
        bio: bio || fallbackUser?.bio || '',
        isProvider: true,
        completedOrders: fallbackUser?.completedOrders || 0,
        rating: fallbackUser?.rating || 5.0,
        safetyScore: fallbackUser?.safetyScore || '100%',
      });

      const nextProvider = await saveFallbackProvider({
        ...(fallbackProvider || {
          userEmail: normalizedEmail,
          category,
          experience,
          hourlyRate,
          bio,
          phone,
          city,
          servicesOffered: servicesOffered && servicesOffered.length ? servicesOffered : [category + ' General Repair', 'Emergency Service'],
          status: 'active',
        }),
        userEmail: normalizedEmail,
        category,
        experience,
        hourlyRate,
        bio,
        phone,
        city,
        servicesOffered: servicesOffered && servicesOffered.length ? servicesOffered : [category + ' General Repair', 'Emergency Service'],
        status: 'active',
      });

      user = nextUser;
      provider = nextProvider;
    }

    return NextResponse.json({ provider, user }, { status: 200 });
  } catch (error: any) {
    console.error('Error creating provider application:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, isProvider } = body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: { email: normalizedEmail, isProvider } },
      { new: true }
    );

    if (isProvider) {
      await Provider.findOneAndUpdate({ userEmail: normalizedEmail }, { $set: { status: 'active' } });
    } else {
      await Provider.findOneAndUpdate({ userEmail: normalizedEmail }, { $set: { status: 'paused' } });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    console.error('Error toggling provider status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
