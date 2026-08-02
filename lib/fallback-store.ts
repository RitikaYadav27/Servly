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

type FallbackStore = {
  users: Record<string, FallbackUser>;
  providers: Record<string, FallbackProvider>;
};

const fallbackPath = path.join(process.cwd(), '.servly-fallback-data.json');

async function readStore(): Promise<FallbackStore> {
  try {
    const raw = await fs.readFile(fallbackPath, 'utf8');
    const parsed = JSON.parse(raw) as FallbackStore;
    return {
      users: parsed.users || {},
      providers: parsed.providers || {},
    };
  } catch {
    return { users: {}, providers: {} };
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
