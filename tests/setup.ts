import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './mocks/server';
import { config } from 'dotenv';

// Always load .env.local to get real environment variables
config({ path: '.env.local' });

// Check if we have database connection for integration tests
const hasDbConnection = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

// MSW Server Setup - intercepts network requests (only when no DB connection)
if (!hasDbConnection) {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });
} else {
  // For integration tests, just clear mocks
  afterEach(() => {
    vi.clearAllMocks();
  });
}

// Mock environment variables only when no real env vars are loaded
if (!hasDbConnection) {
  vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic-key');
  vi.stubEnv('ELEVENLABS_API_KEY', 'test-elevenlabs-key');
  vi.stubEnv('STRIPE_SECRET_KEY', 'test-stripe-key');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test.upstash.io');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-upstash-token');
}

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-user-id',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      firstName: 'Test',
      lastName: 'User',
    },
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
    getToken: vi.fn().mockResolvedValue('test-token'),
  }),
  auth: () => ({
    userId: 'test-user-id',
  }),
  currentUser: () => ({
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignIn: () => null,
  SignUp: () => null,
}));

// Global fetch mock fallback (MSW should handle most cases) - only when no DB
if (!hasDbConnection) {
  global.fetch = vi.fn();
}

// Console error suppression for expected test errors
const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
      args[0].includes('Warning: An update to') ||
      args[0].includes('act(...)'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};
