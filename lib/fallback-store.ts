import fs from 'fs/promises';
import path from 'path';

type FallbackUser = {
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  city?: string;
  bio?: string;
  isProvider: boolean;
  completedOrders: number;
  rating: number;
  safetyScore: string;
};

type FallbackProvider = {
  userEmail: string;
  category: string;
  experience: string;
  hourlyRate: string;
  bio: string;
  phone: string;
  city: string;
  servicesOffered: string[];
  status: 'active' | 'pending' | 'paused';
};

type FallbackBooking = {
  bookingId: string;
  providerEmail: string;
  providerName: string;
  providerCategory: string;
  providerPhoto?: string;
  customerEmail: string;
  customerName: string;
  date: string;
  time: string;
  status: string;
  createdAt: string;
};

type FallbackStore = {
  users: Record<string, FallbackUser>;
  providers: Record<string, FallbackProvider>;
  providerMedia: Record<string, string[]>;
  bookings: FallbackBooking[];
};

const fallbackPath = path.join(process.cwd(), '.servly-fallback-data.json');

async function readStore(): Promise<FallbackStore> {
  try {
    const raw = await fs.readFile(fallbackPath, 'utf8');
    const parsed = JSON.parse(raw) as FallbackStore;
    return {
      users: parsed.users || {},
      providers: parsed.providers || {},
      providerMedia: parsed.providerMedia || {},
      bookings: parsed.bookings || [],
    };
  } catch {
    return { users: {}, providers: {}, providerMedia: {}, bookings: [] };
  }
}

async function writeStore(store: FallbackStore): Promise<void> {
  await fs.mkdir(path.dirname(fallbackPath), { recursive: true });
  await fs.writeFile(fallbackPath, JSON.stringify(store, null, 2));
}

export async function getFallbackUser(email: string): Promise<FallbackUser | null> {
  const store = await readStore();
  return store.users[email] || null;
}

export async function saveFallbackUser(user: FallbackUser): Promise<FallbackUser> {
  const store = await readStore();
  store.users[user.email] = user;
  await writeStore(store);
  return user;
}

export async function getFallbackProvider(email: string): Promise<FallbackProvider | null> {
  const store = await readStore();
  return store.providers[email] || null;
}

export async function saveFallbackProvider(provider: FallbackProvider): Promise<FallbackProvider> {
  const store = await readStore();
  store.providers[provider.userEmail] = provider;
  await writeStore(store);
  return provider;
}

export async function getAllFallbackProviders(): Promise<FallbackProvider[]> {
  const store = await readStore();
  return Object.values(store.providers);
}

export async function getFallbackProviderMedia(providerEmail: string): Promise<string[] | null> {
  const store = await readStore();
  return store.providerMedia[providerEmail] || null;
}

export async function saveFallbackProviderMedia(providerEmail: string, photos: string[]): Promise<string[]> {
  const store = await readStore();
  store.providerMedia[providerEmail] = photos;
  await writeStore(store);
  return store.providerMedia[providerEmail];
}

export async function deleteFallbackProviderMedia(providerEmail: string, photos: string[]): Promise<string[]> {
  const store = await readStore();
  store.providerMedia[providerEmail] = photos;
  await writeStore(store);
  return store.providerMedia[providerEmail];
}

export async function getAllFallbackProviderMedia(): Promise<Record<string, string[]>> {
  const store = await readStore();
  return store.providerMedia || {};
}

export async function getAllFallbackBookings(): Promise<FallbackBooking[]> {
  const store = await readStore();
  return (store.bookings || []).map((booking) => ({ ...booking, id: booking.bookingId }));
}

export async function saveFallbackBooking(booking: FallbackBooking): Promise<FallbackBooking> {
  const store = await readStore();
  const existingIndex = store.bookings.findIndex((item) => item.bookingId === booking.bookingId);
  if (existingIndex >= 0) {
    store.bookings[existingIndex] = booking;
  } else {
    store.bookings.push(booking);
  }
  await writeStore(store);
  return booking;
}
