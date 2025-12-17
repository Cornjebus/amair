'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, CreditCard, Bell, Shield, ChevronRight } from 'lucide-react';

const settingsSections = [
  {
    title: 'Profile',
    description: 'Manage your account details and child profiles',
    icon: User,
    href: '/settings/profile',
    color: 'text-amari-terracotta',
    bgColor: 'bg-amari-terracotta/10',
  },
  {
    title: 'Subscription',
    description: 'View your plan, usage, and billing',
    icon: CreditCard,
    href: '/settings/subscription',
    color: 'text-amari-sage',
    bgColor: 'bg-amari-sage/10',
  },
  {
    title: 'Notifications',
    description: 'Control email and push notifications',
    icon: Bell,
    href: '/settings/notifications',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Privacy & Security',
    description: 'Manage your data and security settings',
    icon: Shield,
    href: '/settings/privacy',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-semibold text-amari-charcoal mb-2">
          Settings
        </h1>
        <p className="text-amari-muted">
          Manage your account preferences and subscription
        </p>
      </div>

      <div className="grid gap-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="py-5">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${section.bgColor}`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg text-amari-charcoal group-hover:text-amari-terracotta transition-colors">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-amari-muted">
                        {section.description}
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-amari-muted group-hover:text-amari-terracotta transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
