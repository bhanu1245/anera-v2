'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, MapPin, Heart, User, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useProfileStore } from '@/stores/profile-store';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api-client';
import {
  AVAILABLE_INTERESTS,
  GENDER_OPTIONS,
  RELATIONSHIP_INTENT_OPTIONS,
  type Gender,
  type RelationshipIntent,
  type ProfileFormData,
} from '@/types';
import { cn } from '@/lib/utils';

// zod v4: enum options use `error`, not the v3 `required_error`.
// `.default()` is deliberately omitted — it makes the schema's input and
// output types diverge, which breaks the react-hook-form resolver generic.
// Defaults are supplied by `defaultValues` below instead.
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  age: z.number().min(18, 'Must be at least 18').max(120, 'Invalid age'),
  gender: z.enum(['male', 'female', 'non-binary', 'other'], {
    error: 'Gender is required',
  }),
  bio: z.string().max(500, 'Bio too long (max 500 chars)'),
  interests: z.array(z.string()).max(10, 'Maximum 10 interests'),
  city: z.string().max(100, 'City name too long'),
  relationshipIntent: z.enum(['casual', 'serious', 'networking', 'friendship', 'not-sure', '']),
});

type FormValues = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  userId: string;
}

export function ProfileEditForm({ userId }: ProfileEditFormProps) {
  const { profile, isSaving, setSaving, optimisticUpdateProfile, revertProfile, setProfile } =
    useProfileStore();
  const { toast } = useToast();
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());

  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      age: profile?.age || 25,
      gender: (profile?.gender as Gender) || 'male',
      bio: profile?.bio || '',
      interests: profile?.interests || [],
      city: profile?.city || '',
      relationshipIntent: (profile?.relationshipIntent as RelationshipIntent) || '',
    },
    mode: 'onChange',
  });

  // Reset form values when profile data changes (e.g., after save + refetch)
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || '',
        age: profile.age || 25,
        gender: (profile.gender as Gender) || 'male',
        bio: profile.bio || '',
        interests: profile.interests || [],
        city: profile.city || '',
        relationshipIntent: (profile.relationshipIntent as RelationshipIntent) || '',
      });
    }
  }, [profile, form]);

  const handleInterestToggle = useCallback(
    (interest: string) => {
      const current = form.getValues('interests') || [];
      const next = current.includes(interest)
        ? current.filter((i) => i !== interest)
        : current.length < 10
          ? [...current, interest]
          : current;

      form.setValue('interests', next, { shouldDirty: true, shouldValidate: true });
      setDirtyFields((prev) => new Set(prev).add('interests'));
    },
    [form]
  );

  const onSubmit = useCallback(
    async (data: FormValues) => {
      setSaving(true);
      setDirtyFields(new Set());

      // Optimistic update.
      // The form permits an empty relationshipIntent ('' = not set), matching
      // the database default and the API's accepted values, while the shared
      // RelationshipIntent type does not include ''. Whether '' is a valid
      // domain value — and whether the non-dating intents survive at all — is
      // open (OQ-P01) and is not decided here.
      optimisticUpdateProfile(data as Partial<ProfileFormData>);

      try {
        const res = await apiFetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          // ✅ No userId in body — session provides it
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update profile');
        }

        const responseData = await res.json();
        setProfile(responseData.profile);

        toast({
          title: 'Profile updated',
          description: 'Your changes have been saved.',
        });
      } catch (err) {
        revertProfile();
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to save changes',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    },
    [userId, setSaving, optimisticUpdateProfile, revertProfile, setProfile, toast]
  );

  const isDirty = form.formState.isDirty || dirtyFields.size > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Save Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <Button
            type="submit"
            disabled={isSaving || !isDirty}
            className="gap-2 min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </Button>
        </div>

        {/* Basic Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <User className="w-4 h-4" />
            Basic Information
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={18}
                      max={120}
                      placeholder="Your age"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 18)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Bio Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileText className="w-4 h-4" />
            About You
          </div>

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell people about yourself..."
                    className="resize-none min-h-[100px]"
                    maxLength={500}
                    {...field}
                  />
                </FormControl>
                <div className="flex justify-between">
                  <FormMessage />
                  <span className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/500
                  </span>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Location Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MapPin className="w-4 h-4" />
            Location
          </div>

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Mumbai, Delhi, Bangalore" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Relationship Intent */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Heart className="w-4 h-4" />
            Relationship Intent
          </div>

          <FormField
            control={form.control}
            name="relationshipIntent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What are you looking for?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your intent" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RELATIONSHIP_INTENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Interests Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Interests
          </div>

          <FormField
            control={form.control}
            name="interests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Select your interests ({field.value?.length || 0}/10)
                </FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const isSelected = field.value?.includes(interest);
                    return (
                      <Badge
                        key={interest}
                        variant={isSelected ? 'default' : 'outline'}
                        className={cn(
                          'cursor-pointer transition-all select-none min-h-[36px] px-3 py-1 text-sm',
                          isSelected
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        )}
                        onClick={() => handleInterestToggle(interest)}
                      >
                        {interest}
                      </Badge>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Bottom Save Button (mobile) */}
        <div className="pt-4 pb-8 sm:pb-4">
          <Button
            type="submit"
            disabled={isSaving || !isDirty}
            className="w-full gap-2 h-12 text-base sm:hidden"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
