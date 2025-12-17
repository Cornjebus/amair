'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Smartphone, Sparkles, Gift, Clock } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface NotificationSettings {
  emailNewStory: boolean;
  emailWeeklyDigest: boolean;
  emailPromoOffers: boolean;
  pushNewStory: boolean;
  pushReminders: boolean;
  pushTips: boolean;
}

export default function NotificationSettingsPage() {
  const { success } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNewStory: true,
    emailWeeklyDigest: true,
    emailPromoOffers: false,
    pushNewStory: true,
    pushReminders: true,
    pushTips: false,
  });

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: !prev[key] };
      // In production, this would save to API
      success({ title: 'Settings updated', description: 'Your notification preferences have been saved.' });
      return newSettings;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-semibold text-amari-charcoal mb-2">
          Notification Settings
        </h1>
        <p className="text-amari-muted">
          Control how and when Amari contacts you
        </p>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50">
              <Mail className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-xl text-amari-charcoal">Email Notifications</CardTitle>
              <CardDescription>Updates sent to your email</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amari-muted" />
              <div>
                <Label className="text-amari-charcoal font-medium">New Story Ready</Label>
                <p className="text-sm text-amari-muted">Get notified when your story is generated</p>
              </div>
            </div>
            <Switch
              checked={settings.emailNewStory}
              onCheckedChange={() => handleToggle('emailNewStory')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amari-muted" />
              <div>
                <Label className="text-amari-charcoal font-medium">Weekly Digest</Label>
                <p className="text-sm text-amari-muted">Summary of stories and usage stats</p>
              </div>
            </div>
            <Switch
              checked={settings.emailWeeklyDigest}
              onCheckedChange={() => handleToggle('emailWeeklyDigest')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-amari-muted" />
              <div>
                <Label className="text-amari-charcoal font-medium">Promotions & Offers</Label>
                <p className="text-sm text-amari-muted">Special deals and new features</p>
              </div>
            </div>
            <Switch
              checked={settings.emailPromoOffers}
              onCheckedChange={() => handleToggle('emailPromoOffers')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-50">
              <Smartphone className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-xl text-amari-charcoal">Push Notifications</CardTitle>
              <CardDescription>Notifications on your device</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amari-muted" />
              <div>
                <Label className="text-amari-charcoal font-medium">Story Updates</Label>
                <p className="text-sm text-amari-muted">When your story is ready to read</p>
              </div>
            </div>
            <Switch
              checked={settings.pushNewStory}
              onCheckedChange={() => handleToggle('pushNewStory')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-amari-muted" />
              <div>
                <Label className="text-amari-charcoal font-medium">Bedtime Reminders</Label>
                <p className="text-sm text-amari-muted">Remind you when it's story time</p>
              </div>
            </div>
            <Switch
              checked={settings.pushReminders}
              onCheckedChange={() => handleToggle('pushReminders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-amari-muted" />
              <div>
                <Label className="text-amari-charcoal font-medium">Story Tips</Label>
                <p className="text-sm text-amari-muted">Suggestions for better stories</p>
              </div>
            </div>
            <Switch
              checked={settings.pushTips}
              onCheckedChange={() => handleToggle('pushTips')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
