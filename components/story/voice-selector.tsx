'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Mic, Crown, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface Voice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
  preview: string;
  isPremium: boolean;
}

interface VoiceSelectorProps {
  selectedVoiceId: string | null;
  onSelectVoice: (voiceId: string) => void;
  onGenerateAudio: (voiceId: string) => void;
  isGenerating: boolean;
  premiumVoicesRemaining?: number;
  hasPremiumAccess?: boolean;
}

export function VoiceSelector({
  selectedVoiceId,
  onSelectVoice,
  onGenerateAudio,
  isGenerating,
  premiumVoicesRemaining = 0,
  hasPremiumAccess = false,
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<{ free: Voice[]; premium: Voice[] }>({
    free: [],
    premium: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { warning } = useToast();

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/voices');
        const data = await response.json();
        setVoices(data.categories);
      } catch (error) {
        console.error('Error fetching voices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoices();
  }, []);

  const selectedVoice = [...voices.free, ...voices.premium].find(
    (v) => v.id === selectedVoiceId
  );

  const handleSelectAndGenerate = (voiceId: string, isPremium: boolean) => {
    if (isPremium && !hasPremiumAccess) {
      // Show upgrade prompt or redirect
      window.location.href = '/pricing';
      return;
    }

    if (isPremium && premiumVoicesRemaining <= 0) {
      // Show limit reached toast instead of alert
      warning({
        title: 'Premium Voice Limit Reached',
        description: 'You have used all your premium voices for this month. Upgrade your plan for more.',
        action: {
          label: 'Upgrade',
          onClick: () => window.location.href = '/pricing',
        },
      });
      return;
    }

    onSelectVoice(voiceId);
    onGenerateAudio(voiceId);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          disabled={isGenerating}
          className="bg-white border-2 border-amari-terracotta/50 hover:border-amari-terracotta hover:bg-amari-terracotta/5 text-amari-charcoal"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating Audio...
            </>
          ) : (
            <>
              <Mic className="h-5 w-5 mr-2" />
              {selectedVoice ? `Narrate with ${selectedVoice.name}` : 'Listen to Story'}
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-amari-charcoal">
            Choose a Narrator
          </DialogTitle>
          <DialogDescription>
            Select a voice to bring your story to life
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-amari-terracotta" />
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Free Voices */}
            <div>
              <h3 className="text-sm font-semibold text-amari-charcoal mb-3 flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Free Voices
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {voices.free.map((voice) => (
                  <VoiceCard
                    key={voice.id}
                    voice={voice}
                    isSelected={selectedVoiceId === voice.id}
                    onSelect={() => handleSelectAndGenerate(voice.id, false)}
                    disabled={isGenerating}
                  />
                ))}
              </div>
            </div>

            {/* Premium Voices */}
            <div>
              <h3 className="text-sm font-semibold text-amari-charcoal mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Premium Voices
                {hasPremiumAccess && (
                  <Badge variant="secondary" className="ml-2">
                    {premiumVoicesRemaining} remaining
                  </Badge>
                )}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {voices.premium.map((voice) => (
                  <VoiceCard
                    key={voice.id}
                    voice={voice}
                    isSelected={selectedVoiceId === voice.id}
                    onSelect={() => handleSelectAndGenerate(voice.id, true)}
                    disabled={isGenerating || (!hasPremiumAccess)}
                    locked={!hasPremiumAccess}
                  />
                ))}
              </div>

              {!hasPremiumAccess && (
                <p className="mt-3 text-sm text-amari-muted text-center">
                  <a href="/pricing" className="text-amari-terracotta underline">
                    Upgrade your plan
                  </a>{' '}
                  to unlock premium voices
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface VoiceCardProps {
  voice: Voice;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  locked?: boolean;
}

function VoiceCard({
  voice,
  isSelected,
  onSelect,
  disabled,
  locked,
}: VoiceCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled || locked}
      className={`
        relative p-4 rounded-xl border-2 text-left transition-all
        ${isSelected
          ? 'border-amari-terracotta bg-amari-terracotta/5 shadow-md'
          : 'border-amari-sand bg-white hover:border-amari-terracotta/50'
        }
        ${disabled || locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 h-5 w-5 bg-amari-terracotta rounded-full flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Lock indicator for premium */}
      {locked && (
        <div className="absolute top-2 right-2">
          <Crown className="h-5 w-5 text-amber-500" />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`
            h-10 w-10 rounded-full flex items-center justify-center text-lg
            ${voice.gender === 'female' ? 'bg-pink-100' : 'bg-blue-100'}
          `}
        >
          {voice.gender === 'female' ? '👩' : '👨'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-amari-charcoal">{voice.name}</h4>
            {voice.isPremium && (
              <Badge variant="outline" className="text-xs border-amari-rose text-amari-rose">
                Premium
              </Badge>
            )}
          </div>
          <p className="text-sm text-amari-muted">{voice.description}</p>
          <p className="text-xs text-amari-muted/70 mt-1 line-clamp-1">
            {voice.preview}
          </p>
        </div>
      </div>
    </button>
  );
}
