'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Download, Trash2, Eye, Lock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useConfirmation } from '@/hooks/useConfirmation';

export default function PrivacySettingsPage() {
  const { success, warning, info } = useToast();
  const { confirmAction } = useConfirmation();
  const [analytics, setAnalytics] = useState(true);
  const [storyHistory, setStoryHistory] = useState(true);

  const handleExportData = async () => {
    await confirmAction({
      title: 'Export Your Data',
      description: 'We will prepare a download of all your stories, child profiles, and account data. This may take up to 24 hours.',
      confirmLabel: 'Request Export',
      cancelLabel: 'Cancel',
      variant: 'info',
      onConfirm: () => {
        success({
          title: 'Export requested',
          description: 'We\'ll email you a download link within 24 hours.',
        });
      },
    });
  };

  const handleDeleteAccount = async () => {
    await confirmAction({
      title: 'Delete Your Account?',
      description: 'This will permanently delete your account, all stories, child profiles, and subscription data. This action cannot be undone.',
      confirmLabel: 'Delete Account',
      cancelLabel: 'Keep Account',
      variant: 'danger',
      onConfirm: () => {
        info({
          title: 'Account Deletion',
          description: 'Please contact support@amari.com to complete account deletion.',
        });
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-semibold text-amari-charcoal mb-2">
          Privacy & Security
        </h1>
        <p className="text-amari-muted">
          Control your data and security settings
        </p>
      </div>

      {/* Privacy Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-50">
              <Eye className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-xl text-amari-charcoal">Privacy Controls</CardTitle>
              <CardDescription>Manage how your data is used</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-amari-charcoal font-medium">Usage Analytics</Label>
              <p className="text-sm text-amari-muted">Help us improve Amari with anonymous usage data</p>
            </div>
            <Switch
              checked={analytics}
              onCheckedChange={(checked) => {
                setAnalytics(checked);
                success({ title: 'Settings saved' });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-amari-charcoal font-medium">Story History</Label>
              <p className="text-sm text-amari-muted">Keep a record of generated stories</p>
            </div>
            <Switch
              checked={storyHistory}
              onCheckedChange={(checked) => {
                setStoryHistory(checked);
                success({ title: 'Settings saved' });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-50">
              <Lock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-amari-charcoal">Security</CardTitle>
              <CardDescription>Your account is protected by Clerk</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium">Enterprise-grade security</p>
                <p className="text-sm text-green-700">
                  Your account is secured with industry-leading authentication.
                  Manage your password and 2FA in your Clerk profile.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => window.open('/user-profile', '_blank')}>
              Manage Security Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50">
              <Download className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-xl text-amari-charcoal">Your Data</CardTitle>
              <CardDescription>Export or delete your data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-amari-sand">
            <div>
              <p className="font-medium text-amari-charcoal">Export Your Data</p>
              <p className="text-sm text-amari-muted">Download all your stories and account data</p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/50">
            <div>
              <p className="font-medium text-red-800">Delete Account</p>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="bg-amari-cream border-amari-sand">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amari-terracotta mt-0.5" />
            <div className="text-sm text-amari-muted">
              <p className="font-medium text-amari-charcoal">Data Protection</p>
              <p>
                We take your privacy seriously. Read our{' '}
                <a href="/privacy" className="text-amari-terracotta hover:underline">
                  Privacy Policy
                </a>{' '}
                to learn how we protect your data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
