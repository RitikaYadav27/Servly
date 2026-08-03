import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import Provider from '../../../models/Provider';
import User from '../../../models/User';
import { getAllFallbackProviders } from '../../../lib/fallback-store';

const sampleProviders = [
  {
    userEmail: 'amit@servly.in',
    category: 'Plumbing',
    experience: '8 years',
    hourlyRate: '299',
    bio: 'Fast response, leak repair, pipe fitting and emergency plumbing across Bengaluru.',
    phone: '+91 98765 43210',
    city: 'Indiranagar, Bengaluru',
    servicesOffered: ['Leak Repair', 'Bathroom Fittings', 'Water Heater'],
    status: 'active',
    displayName: 'Amit Verma',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
  },
  {
    userEmail: 'nisha@servly.in',
    category: 'Home Cleaning',
    experience: '5 years',
    hourlyRate: '399',
    bio: 'Deep cleaning, move-in and move-out cleaning with eco-friendly products.',
    phone: '+91 91234 56789',
    city: 'Koramangala, Bengaluru',
    servicesOffered: ['Deep Cleaning', 'Kitchen Care', 'Sofa Cleaning'],
    status: 'active',
    displayName: 'Nisha Rao',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
  },
  {
    userEmail: 'karthik@servly.in',
    category: 'Electrician',
    experience: '7 years',
    hourlyRate: '249',
    bio: 'Switch boards, fan installation and repair, appliance wiring and quick fixes.',
    phone: '+91 99887 66554',
    city: 'Jayanagar, Bengaluru',
    servicesOffered: ['Fan Install', 'Wiring', 'Socket Repair'],
    status: 'active',
    displayName: 'Karthik Menon',
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
  },
];

export async function GET(req: NextRequest) {
  try {
    let providers: any[] = [];

    try {
      await connectToDatabase();
      const dbProviders = await Provider.find({ status: 'active' }).lean();
      const emails = dbProviders.map((provider) => provider.userEmail);
      const users = await User.find({ email: { $in: emails } }).lean();
      const userMap = new Map(users.map((user) => [user.email, user]));

      providers = dbProviders.map((provider) => ({
        ...provider,
        displayName: userMap.get(provider.userEmail)?.displayName || provider.userEmail.split('@')[0],
        photoURL: userMap.get(provider.userEmail)?.photoURL || undefined,
        rating: userMap.get(provider.userEmail)?.rating || 4.7,
      }));
    } catch (dbError) {
      console.warn('MongoDB unavailable for provider listing, using fallback store:', dbError);
      const fallbackProviders = await getAllFallbackProviders();
      providers = fallbackProviders
        .filter((provider) => provider.status === 'active')
        .map((provider) => ({
          ...provider,
          displayName: provider.userEmail.split('@')[0],
          rating: 4.7,
        }));
    }

    if (!providers.length) {
      providers = sampleProviders;
    }

    return NextResponse.json({ providers }, { status: 200 });
  } catch (error: any) {
    console.error('Error listing providers:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
