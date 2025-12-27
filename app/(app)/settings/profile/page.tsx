'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Baby, Plus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useConfirmation } from '@/hooks/useConfirmation';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  favoriteThings: string[];
}

export default function ProfileSettingsPage() {
  const { user, isLoaded } = useUser();
  const { success, error } = useToast();
  const { confirmDelete } = useConfirmation();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [newChild, setNewChild] = useState({ name: '', age: '' });
  const [showAddChild, setShowAddChild] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadChildren() {
      try {
        const response = await fetch('/api/children');
        if (response.ok) {
          const data = await response.json();
          setChildren(data.children || []);
        }
      } catch (err) {
        console.error('Error loading children:', err);
      }
    }
    if (isLoaded) {
      loadChildren();
    }
  }, [isLoaded]);

  const handleAddChild = async () => {
    if (!newChild.name || !newChild.age) return;
    setSaving(true);
    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChild.name, age: parseInt(newChild.age) }),
      });
      if (response.ok) {
        const data = await response.json();
        setChildren([...children, data.child]);
        setNewChild({ name: '', age: '' });
        setShowAddChild(false);
        success({ title: 'Child profile added', description: `${data.child.name} has been added.` });
      } else {
        error({ title: 'Failed to add child', description: 'Please try again.' });
      }
    } catch (err) {
      error({ title: 'Error', description: 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    const confirmed = await confirmDelete(`${childName}'s profile`, async () => {
      const response = await fetch(`/api/children/${childId}`, { method: 'DELETE' });
      if (response.ok) {
        setChildren(children.filter((c) => c.id !== childId));
        success({ title: 'Profile removed', description: `${childName}'s profile has been removed.` });
      } else {
        throw new Error('Failed to remove profile');
      }
    });

    if (!confirmed) return;
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-semibold text-amari-charcoal mb-2">
          Profile Settings
        </h1>
        <p className="text-amari-muted">
          Manage your account and child profiles
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amari-terracotta/10">
              <User className="h-6 w-6 text-amari-terracotta" />
            </div>
            <div>
              <CardTitle className="text-xl text-amari-charcoal">Account Information</CardTitle>
              <CardDescription>Your personal account details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-amari-muted text-sm">Name</Label>
              <p className="text-amari-charcoal font-medium">{user?.fullName || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-amari-muted text-sm">Email</Label>
              <p className="text-amari-charcoal font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-amari-muted" />
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Button variant="outline" onClick={() => window.open('/user-profile', '_blank')}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit in Clerk
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Child Profiles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amari-sage/10">
                <Baby className="h-6 w-6 text-amari-sage" />
              </div>
              <div>
                <CardTitle className="text-xl text-amari-charcoal">Child Profiles</CardTitle>
                <CardDescription>Stories are personalized for each child</CardDescription>
              </div>
            </div>
            {!showAddChild && (
              <Button onClick={() => setShowAddChild(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Child
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Child Form */}
          {showAddChild && (
            <div className="p-4 border border-amari-sand rounded-xl bg-amari-cream/50 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="childName">Child's Name</Label>
                  <Input
                    id="childName"
                    placeholder="Enter name"
                    value={newChild.name}
                    onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="childAge">Age</Label>
                  <Input
                    id="childAge"
                    type="number"
                    min="1"
                    max="12"
                    placeholder="Enter age"
                    value={newChild.age}
                    onChange={(e) => setNewChild({ ...newChild, age: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddChild} disabled={saving || !newChild.name || !newChild.age}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Save
                </Button>
                <Button variant="ghost" onClick={() => { setShowAddChild(false); setNewChild({ name: '', age: '' }); }}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Children List */}
          {children.length === 0 && !showAddChild ? (
            <div className="text-center py-8 text-amari-muted">
              <Baby className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No child profiles yet.</p>
              <p className="text-sm">Add a child to personalize their stories!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-amari-sand hover:bg-amari-cream/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amari-rose/30 flex items-center justify-center">
                      <span className="text-amari-charcoal font-display font-semibold">
                        {child.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-display font-semibold text-amari-charcoal">{child.name}</p>
                      <p className="text-sm text-amari-muted">{child.age} years old</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {child.favoriteThings && child.favoriteThings.length > 0 && (
                      <div className="hidden md:flex gap-1">
                        {child.favoriteThings.slice(0, 3).map((thing, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {thing}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteChild(child.id, child.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
