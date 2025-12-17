'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, CreditCard, Bell, Shield } from 'lucide-react';
import { cn } from '@/lib/design/utils';

const settingsNavItems = [
  {
    title: 'Profile',
    href: '/settings/profile',
    icon: User,
    description: 'Manage your account details',
  },
  {
    title: 'Subscription',
    href: '/settings/subscription',
    icon: CreditCard,
    description: 'Billing and plan management',
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
    description: 'Email and push preferences',
  },
  {
    title: 'Privacy',
    href: '/settings/privacy',
    icon: Shield,
    description: 'Data and privacy settings',
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-amari-cream">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-semibold text-amari-charcoal mb-2">
            Settings
          </h1>
          <p className="text-amari-muted">
            Manage your account preferences and subscription
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-amari-sand p-2 space-y-1">
              {settingsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-amari-terracotta/10 text-amari-terracotta'
                        : 'text-amari-charcoal hover:bg-amari-sand/50'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', isActive ? 'text-amari-terracotta' : 'text-amari-muted')} />
                    <div>
                      <p className={cn('font-medium', isActive && 'text-amari-terracotta')}>
                        {item.title}
                      </p>
                      <p className="text-xs text-amari-muted hidden sm:block">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
