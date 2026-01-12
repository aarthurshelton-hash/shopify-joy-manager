import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, Camera, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { moderateImage, fileToBase64 } from '@/lib/moderation/contentModeration';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  displayName: string;
  onAvatarUpdate: (url: string | null) => Promise<{ error: Error | null }>;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  userId,
  currentAvatarUrl,
  displayName,
  onAvatarUpdate,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = displayName?.slice(0, 2).toUpperCase() || 'U';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setModerationError(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload a JPEG, PNG, WebP, or GIF image',
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large', {
        description: 'Please upload an image smaller than 2MB',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Convert to base64 for moderation
      const base64 = await fileToBase64(file);

      // Moderate the image
      const moderationResult = await moderateImage(base64);

      if (!moderationResult.safe) {
        setPreviewUrl(null);
        setModerationError(moderationResult.reason || 'Image does not meet community guidelines');
        toast.error('Image not allowed', {
          description: moderationResult.reason || 'This image does not meet our community guidelines',
        });
        return;
      }

      // Upload to storage
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/avatar.${fileExt}`;

      // Delete old avatar if exists
      const { data: existingFiles } = await supabase.storage
        .from('visualizations')
        .list(userId, { search: 'avatar' });

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('visualizations')
          .remove(existingFiles.map(f => `${userId}/${f.name}`));
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('visualizations')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('visualizations')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update profile
      const { error: updateError } = await onAvatarUpdate(publicUrl);

      if (updateError) {
        throw updateError;
      }

      toast.success('Avatar updated successfully');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      setPreviewUrl(null);
      toast.error('Failed to upload avatar', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setIsRemoving(true);
    try {
      // Delete from storage
      const { data: existingFiles } = await supabase.storage
        .from('visualizations')
        .list(userId, { search: 'avatar' });

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('visualizations')
          .remove(existingFiles.map(f => `${userId}/${f.name}`));
      }

      // Update profile
      const { error } = await onAvatarUpdate(null);

      if (error) {
        throw error;
      }

      setPreviewUrl(null);
      toast.success('Avatar removed');
    } catch (error: any) {
      console.error('Avatar removal error:', error);
      toast.error('Failed to remove avatar', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-muted-foreground" />
        Profile Picture
      </Label>

      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 border-2 border-border">
          <AvatarImage src={displayUrl || undefined} alt={displayName} />
          <AvatarFallback className="text-lg bg-primary/20 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload avatar"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isRemoving}
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? 'Uploading...' : 'Upload Photo'}
          </Button>

          {currentAvatarUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveAvatar}
              disabled={isUploading || isRemoving}
              className="gap-2 text-destructive hover:text-destructive"
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Remove
            </Button>
          )}
        </div>
      </div>

      {moderationError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{moderationError}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Upload a JPEG, PNG, WebP, or GIF image (max 2MB). Images are reviewed to ensure they meet our community guidelines.
      </p>
    </div>
  );
};

export default AvatarUpload;
