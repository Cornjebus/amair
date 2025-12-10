'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, Download, Maximize2 } from 'lucide-react';

interface StoryImage {
  id: string;
  scene_number: number;
  scene_description: string;
  public_url: string;
}

interface IllustrationGalleryProps {
  images: StoryImage[];
  storyTitle: string;
  canDownload?: boolean;
}

export function IllustrationGallery({
  images,
  storyTitle,
  canDownload = false,
}: IllustrationGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const sortedImages = [...images].sort((a, b) => a.scene_number - b.scene_number);

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < sortedImages.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleDownload = (image: StoryImage) => {
    const link = document.createElement('a');
    link.href = image.public_url;
    link.download = `${storyTitle.replace(/[^a-z0-9]/gi, '_')}-scene-${image.scene_number}.png`;
    link.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') setSelectedIndex(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-lavender-900 flex items-center gap-2">
        <span>✨</span>
        Story Illustrations
        <span className="text-sm font-normal text-lavender-500">
          ({sortedImages.length} scenes)
        </span>
      </h3>

      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedImages.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelectedIndex(index)}
            className="group relative aspect-square rounded-xl overflow-hidden border-2 border-lavender-100 hover:border-lavender-300 transition-all hover:shadow-lg"
          >
            <img
              src={image.public_url}
              alt={`Scene ${image.scene_number}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
              <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <span className="text-white text-xs font-medium">
                Scene {image.scene_number}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95">
          {selectedIndex !== null && (
            <div onKeyDown={handleKeyDown} tabIndex={0} className="outline-none">
              {/* Close button */}
              <button
                onClick={() => setSelectedIndex(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Image */}
              <div className="relative aspect-square md:aspect-video flex items-center justify-center p-4">
                <img
                  src={sortedImages[selectedIndex].public_url}
                  alt={`Scene ${sortedImages[selectedIndex].scene_number}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />

                {/* Navigation arrows */}
                {selectedIndex > 0 && (
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}

                {selectedIndex < sortedImages.length - 1 && (
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </div>

              {/* Caption and controls */}
              <div className="p-4 bg-black/80">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">
                      Scene {sortedImages[selectedIndex].scene_number} of {sortedImages.length}
                    </p>
                    <p className="text-white/70 text-sm mt-1 line-clamp-2">
                      {sortedImages[selectedIndex].scene_description}
                    </p>
                  </div>

                  {canDownload && (
                    <Button
                      onClick={() => handleDownload(sortedImages[selectedIndex])}
                      variant="outline"
                      size="sm"
                      className="text-white border-white/30 hover:bg-white/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>

                {/* Thumbnail navigation */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {sortedImages.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedIndex(index)}
                      className={`
                        flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all
                        ${index === selectedIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}
                      `}
                    >
                      <img
                        src={image.public_url}
                        alt={`Scene ${image.scene_number}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
