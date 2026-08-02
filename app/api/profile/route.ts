import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import User from '../../../models/User';
import Provider from '../../../models/Provider';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || 'demo@servly.in';

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        displayName: email.includes('@') ? email.split('@')[0] : 'Servly Member',
        city: 'Indiranagar, Bengaluru',
        bio: 'Welcome to my Servly profile! I use Servly for trusted home and local services.',
        isProvider: false,
        completedOrders: 0,
        rating: 5.0,
      });
    }

    let provider = null;
    if (user.isProvider) {
      provider = await Provider.findOne({ userEmail: email });
    }

    return NextResponse.json({ user, provider }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, city, bio, phone, displayName, photoURL } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { 
        $set: { 
          ...(city && { city }), 
          ...(bio !== undefined && { bio }), 
          ...(phone && { phone }),
          ...(displayName && { displayName }),
          ...(photoURL && { photoURL })
        } 
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
