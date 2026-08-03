import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import { Booking, ProviderMedia, Review } from '../../../models/ServiceActivity';
import {
  getAllFallbackProviderMedia,
  getFallbackProviderMedia,
  saveFallbackProviderMedia,
  deleteFallbackProviderMedia,
  getAllFallbackBookings,
  saveFallbackBooking,
} from '../../../lib/fallback-store';

const emailOf = (value?: string | null) => (value || '').trim().toLowerCase();

export async function GET(req: NextRequest) {
  let connected = true;
  try {
    await connectToDatabase();
  } catch (dbError: any) {
    connected = false;
    console.warn('MongoDB unavailable for activity fetch, using fallback activity data:', dbError);
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const email = emailOf(searchParams.get('email'));
    const providerEmail = emailOf(searchParams.get('providerEmail'));

    if (!connected) {
      if (type === 'portfolio') {
        const photos = providerEmail ? (await getFallbackProviderMedia(providerEmail)) || [] : [];
        return NextResponse.json({ photos });
      }
      if (type === 'reviews') {
        return NextResponse.json({ reviews: [] });
      }
      if (type === 'bookings') {
        const bookings = await getAllFallbackBookings();
        return NextResponse.json({ bookings: email ? bookings.filter((item) => item.customerEmail === email || item.providerEmail === email) : bookings });
      }
      const providerPhotos = await getAllFallbackProviderMedia();
      const bookings = await getAllFallbackBookings();
      const filteredBookings = email ? bookings.filter((item) => item.customerEmail === email || item.providerEmail === email) : bookings;
      return NextResponse.json({ providerPhotos, reviews: [], bookings: filteredBookings });
    }

    if (type === 'portfolio') {
      const media = providerEmail ? await ProviderMedia.findOne({ providerEmail }).lean() : null;
      return NextResponse.json({ photos: media?.photos || [] });
    }
    if (type === 'reviews') {
      const reviews = await Review.find(providerEmail ? { providerEmail } : {}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ reviews });
    }
    if (type === 'bookings') {
      const bookings = await Booking.find(email ? { $or: [{ customerEmail: email }, { providerEmail: email }] } : {}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ bookings });
    }

    const [media, reviews, bookings] = await Promise.all([
      ProviderMedia.find({}).lean(),
      Review.find({}).sort({ createdAt: -1 }).lean(),
      email ? Booking.find({ $or: [{ customerEmail: email }, { providerEmail: email }] }).sort({ createdAt: -1 }).lean() : Promise.resolve([]),
    ]);
    return NextResponse.json({
      providerPhotos: Object.fromEntries(media.map((item) => [item.providerEmail, item.photos])),
      reviews,
      bookings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'MongoDB activity request failed' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  let connected = true;
  try {
    await connectToDatabase();
  } catch (dbError: any) {
    connected = false;
    console.warn('MongoDB unavailable for activity save, using fallback store:', dbError);
  }

  try {
    const body = await req.json();
    const type = body.type;

    if (type === 'portfolio') {
      const providerEmail = emailOf(body.providerEmail);
      const photos = Array.isArray(body.photos) ? body.photos.filter((photo: unknown) => typeof photo === 'string') : [];
      if (!providerEmail || !photos.length) return NextResponse.json({ error: 'Provider and photos are required' }, { status: 400 });
      if (!connected) {
        const savedPhotos = await saveFallbackProviderMedia(providerEmail, photos.slice(-12));
        return NextResponse.json({ photos: savedPhotos });
      }
      const media = await ProviderMedia.findOneAndUpdate(
        { providerEmail },
        { $set: { providerEmail, photos: photos.slice(-12) } },
        { new: true, upsert: true }
      );
      return NextResponse.json({ photos: media?.photos || [] });
    }

    if (type === 'booking') {
      const providerEmail = emailOf(body.providerEmail);
      const customerEmail = emailOf(body.customerEmail);
      const providerName = typeof body.providerName === 'string' ? body.providerName.trim() : '';
      const providerCategory = typeof body.providerCategory === 'string' ? body.providerCategory.trim() : '';
      const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
      const date = typeof body.date === 'string' ? body.date.trim() : '';
      const time = typeof body.time === 'string' ? body.time.trim() : '';

      if (!providerEmail || !customerEmail || !providerName || !providerCategory || !customerName || !date || !time) {
        return NextResponse.json({ error: 'Missing booking required fields' }, { status: 400 });
      }

      const bookingId = typeof body.bookingId === 'string' && body.bookingId.trim()
        ? body.bookingId.trim()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const bookingData = {
        bookingId,
        providerEmail,
        providerName,
        providerCategory,
        providerPhoto: typeof body.providerPhoto === 'string' ? body.providerPhoto : undefined,
        customerEmail,
        customerName,
        date,
        time,
        status: typeof body.status === 'string' && body.status.trim() ? body.status.trim() : 'Requested',
        createdAt: new Date().toISOString(),
      };

      if (!connected) {
        const savedBooking = await saveFallbackBooking(bookingData);
        return NextResponse.json({ booking: { ...savedBooking, id: savedBooking.bookingId } }, { status: 201 });
      }

      const booking = await Booking.create(bookingData);
      return NextResponse.json({ booking: { ...booking.toObject(), id: booking.bookingId } }, { status: 201 });
    }

    if (type === 'review') {
      const review = await Review.create({ ...body, reviewId: body.id, providerEmail: emailOf(body.providerEmail) });
      return NextResponse.json({ review }, { status: 201 });
    }

    return NextResponse.json({ error: 'Unsupported activity type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'MongoDB activity save failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  let connected = true;
  try {
    await connectToDatabase();
  } catch (dbError: any) {
    connected = false;
    console.warn('MongoDB unavailable for activity delete, using fallback store:', dbError);
  }

  try {
    const body = await req.json();
    const providerEmail = emailOf(body.providerEmail);
    const photos = Array.isArray(body.photos) ? body.photos : [];
    if (!providerEmail) return NextResponse.json({ error: 'Provider email required' }, { status: 400 });

    if (!connected) {
      const savedPhotos = await deleteFallbackProviderMedia(providerEmail, photos);
      return NextResponse.json({ photos: savedPhotos });
    }

    const media = await ProviderMedia.findOneAndUpdate({ providerEmail }, { $set: { photos } }, { new: true });
    return NextResponse.json({ photos: media?.photos || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'MongoDB activity delete failed' }, { status: 500 });
  }
}
