'use client';

import React, { useCallback, useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Star, GripVertical, ImagePlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ProfilePhoto } from '@/types';
import { IMAGE_CONSTRAINTS } from '@/types';
import { validateAndCompressImage } from '@/lib/image-utils';
import { useProfileStore } from '@/stores/profile-store';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api-client';

interface SortablePhotoProps {
  photo: ProfilePhoto;
  onSetPrimary: (id: string) => void;
  onDelete: (id: string) => void;
  isUploading: boolean;
}

function SortablePhoto({ photo, onSetPrimary, onDelete, isUploading }: SortablePhotoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group aspect-[3/4] rounded-xl overflow-hidden border-2 bg-muted',
        isDragging ? 'z-50 shadow-2xl border-primary opacity-90 scale-105' : 'border-border',
        photo.isPrimary && 'border-yellow-400 ring-2 ring-yellow-400/30'
      )}
    >
      <img
        src={photo.url}
        alt={`Profile photo ${photo.order + 1}`}
        className="w-full h-full object-cover"
        draggable={false}
      />

      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {photo.isPrimary && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-yellow-500 text-white text-xs font-medium flex items-center gap-1">
          <Star className="w-3 h-3 fill-white" />
          Primary
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
        {!photo.isPrimary && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 min-w-[44px] px-2 text-white hover:text-yellow-400 hover:bg-white/10 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onSetPrimary(photo.id);
            }}
            disabled={isUploading}
          >
            <Star className="w-3.5 h-3.5 mr-1" />
            Primary
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 min-w-[44px] px-2 text-white hover:text-red-400 hover:bg-white/10 ml-auto text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(photo.id);
          }}
          disabled={isUploading}
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Remove
        </Button>
      </div>

      <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        {photo.order + 1}
      </div>
    </div>
  );
}

interface PhotoManagerProps {
  userId: string;
}

export function PhotoManager({ userId }: PhotoManagerProps) {
  const {
    profile,
    isUploading,
    setUploading,
    optimisticAddPhoto,
    optimisticRemovePhoto,
    optimisticReorderPhotos,
    optimisticSetPrimary,
    revertProfile,
    setProfile,
  } = useProfileStore();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPhotos, setLocalPhotos] = useState<ProfilePhoto[]>(
    profile?.photos || []
  );

  React.useEffect(() => {
    if (profile?.photos) {
      setLocalPhotos(profile.photos);
    }
  }, [profile?.photos]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = localPhotos.findIndex((p) => p.id === active.id);
      const newIndex = localPhotos.findIndex((p) => p.id === over.id);

      const newOrder = arrayMove(localPhotos, oldIndex, newIndex).map((p, i) => ({
        ...p,
        order: i,
      }));

      setLocalPhotos(newOrder);
      optimisticReorderPhotos(newOrder);

      try {
        // ✅ No userId in body — session provides it
        const res = await apiFetch('/api/profile/photos/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photoOrders: newOrder.map((p) => ({ id: p.id, order: p.order })),
          }),
        });

        if (res.status === 401) {
          throw new Error('Please log in to reorder photos.');
        }

        if (!res.ok) throw new Error('Failed to reorder');

        const data = await res.json();
        setLocalPhotos(data.photos);
        if (profile) {
          setProfile({ ...profile, photos: data.photos });
        }
      } catch (err) {
        setLocalPhotos(profile?.photos || []);
        revertProfile();
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to reorder photos.',
          variant: 'destructive',
        });
      }
    },
    [localPhotos, profile, optimisticReorderPhotos, revertProfile, setProfile, toast]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const currentCount = localPhotos.length;
      const remainingSlots = IMAGE_CONSTRAINTS.MAX_PHOTOS - currentCount;

      if (remainingSlots <= 0) {
        toast({
          title: 'Limit reached',
          description: `You can only have up to ${IMAGE_CONSTRAINTS.MAX_PHOTOS} photos.`,
          variant: 'destructive',
        });
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      setUploading(true);

      for (const file of filesToUpload) {
        try {
          const { blob, error: validationError } = await validateAndCompressImage(file);

          if (validationError) {
            toast({
              title: 'Validation Error',
              description: validationError,
              variant: 'destructive',
            });
            continue;
          }

          // ✅ No userId in form data — session provides it
          const formData = new FormData();
          formData.append('file', new File([blob], file.name, { type: blob.type || file.type }));

          const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const tempPhoto: ProfilePhoto = {
            id: tempId,
            url: URL.createObjectURL(blob),
            order: localPhotos.length,
            isPrimary: localPhotos.length === 0,
          };

          setLocalPhotos((prev) => [...prev, tempPhoto]);
          optimisticAddPhoto(tempPhoto);

          const res = await apiFetch('/api/profile/photos', {
            method: 'POST',
            body: formData,
          });

          if (res.status === 401) {
            throw new Error('Please log in to upload photos.');
          }

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Upload failed');
          }

          const data = await res.json();

          setLocalPhotos((prev) =>
            prev.map((p) =>
              p.id === tempId
                ? { ...data.photo, isPrimary: tempPhoto.isPrimary }
                : p
            )
          );

          if (profile) {
            setProfile({
              ...profile,
              photos: profile.photos.map((p) =>
                p.id === tempId ? { ...data.photo, isPrimary: tempPhoto.isPrimary } : p
              ),
            });
          }

          toast({ title: 'Photo uploaded', description: 'Your photo has been added.' });
        } catch (err) {
          setLocalPhotos((prev) => prev.filter((p) => !p.id.startsWith('temp-')));
          revertProfile();
          toast({
            title: 'Upload Error',
            description: err instanceof Error ? err.message : 'Failed to upload photo',
            variant: 'destructive',
          });
        }
      }

      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [localPhotos, profile, setUploading, optimisticAddPhoto, revertProfile, setProfile, toast]
  );

  const handleDelete = useCallback(
    async (photoId: string) => {
      const photo = localPhotos.find((p) => p.id === photoId);
      if (!photo) return;

      const newPhotos = localPhotos.filter((p) => p.id !== photoId);
      setLocalPhotos(newPhotos);
      optimisticRemovePhoto(photoId);

      try {
        // ✅ No userId in query — session provides it
        const res = await apiFetch(
          `/api/profile/photos?photoId=${photoId}`,
          { method: 'DELETE' }
        );

        if (res.status === 401) {
          throw new Error('Please log in to delete photos.');
        }

        if (res.status === 403) {
          throw new Error('You do not have permission to delete this photo.');
        }

        if (!res.ok) throw new Error('Failed to delete');

        toast({ title: 'Photo removed', description: 'The photo has been removed.' });
      } catch (err) {
        setLocalPhotos(profile?.photos || []);
        revertProfile();
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to remove photo.',
          variant: 'destructive',
        });
      }
    },
    [localPhotos, profile, optimisticRemovePhoto, revertProfile, toast]
  );

  const handleSetPrimary = useCallback(
    async (photoId: string) => {
      const newPhotos = localPhotos.map((p) => ({
        ...p,
        isPrimary: p.id === photoId,
      }));
      setLocalPhotos(newPhotos);
      optimisticSetPrimary(photoId);

      try {
        // ✅ No userId in body — session provides it
        const res = await apiFetch('/api/profile/photos/primary', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId }),
        });

        if (res.status === 401) {
          throw new Error('Please log in to set primary photo.');
        }

        if (res.status === 403) {
          throw new Error('You do not have permission to modify this photo.');
        }

        if (!res.ok) throw new Error('Failed to set primary');

        toast({ title: 'Primary photo updated', description: 'Your primary photo has been changed.' });
      } catch (err) {
        setLocalPhotos(profile?.photos || []);
        revertProfile();
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to set primary photo.',
          variant: 'destructive',
        });
      }
    },
    [localPhotos, profile, optimisticSetPrimary, revertProfile, toast]
  );

  const photoCount = localPhotos.length;
  const canAddMore = photoCount < IMAGE_CONSTRAINTS.MAX_PHOTOS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Photos</h3>
          <p className="text-sm text-muted-foreground">
            {photoCount}/{IMAGE_CONSTRAINTS.MAX_PHOTOS} photos • Drag to reorder
          </p>
        </div>
        {canAddMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
            Add Photo
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_CONSTRAINTS.ACCEPTED_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={localPhotos.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-3">
            {localPhotos.map((photo) => (
              <SortablePhoto
                key={photo.id}
                photo={photo}
                onSetPrimary={handleSetPrimary}
                onDelete={handleDelete}
                isUploading={isUploading}
              />
            ))}

            {canAddMore && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="aspect-[3/4] rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-xs">Add Photo</span>
                  </>
                )}
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {photoCount === 0 && !isUploading && (
        <div className="text-center py-8 text-muted-foreground">
          <ImagePlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Add your first photo to get started</p>
          <p className="text-xs mt-1">Your first photo will be set as your primary photo</p>
        </div>
      )}
    </div>
  );
}
