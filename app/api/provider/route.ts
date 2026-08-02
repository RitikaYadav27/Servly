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

    if (!email || !category || !phone || !hourlyRate) {
      return NextResponse.json({ error: 'Missing required provider fields' }, { status: 400 });
    }

    let provider;
    let user;

    try {
      await connectToDatabase();

      provider = await Provider.findOneAndUpdate(
        { userEmail: email },
        {
          $set: {
            userEmail: email,
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
        { email },
        { $set: { isProvider: true, city, phone } },
        { new: true, upsert: true }
      );
    } catch (dbError: any) {
      console.error('MongoDB provider submission failed, using fallback store:', dbError);

      const fallbackUser = await getFallbackUser(email);
      const fallbackProvider = await getFallbackProvider(email);

      const nextUser = await saveFallbackUser({
        ...(fallbackUser || (await buildUserRecord(email, body))),
        email,
        displayName: fallbackUser?.displayName || body.displayName || email.split('@')[0] || 'Servly Member',
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
          userEmail: email,
          category,
          experience,
          hourlyRate,
          bio,
          phone,
          city,
          servicesOffered: servicesOffered && servicesOffered.length ? servicesOffered : [category + ' General Repair', 'Emergency Service'],
          status: 'active',
        }),
        userEmail: email,
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

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { $set: { isProvider } },
      { new: true }
    );

    if (isProvider) {
      await Provider.findOneAndUpdate({ userEmail: email }, { $set: { status: 'active' } });
    } else {
      await Provider.findOneAndUpdate({ userEmail: email }, { $set: { status: 'paused' } });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    console.error('Error toggling provider status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
