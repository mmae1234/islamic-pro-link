import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, X, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/image-compress';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | null) => void;
  fallbackInitials?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageChange,
  fallbackInitials = '?',
  size = 'md'
}) => {
  const [uploading, setUploading] = useState(false);
  const [moderating, setModerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const uploadImage = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload an image.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setModerating(false);

    try {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image must be smaller than 5MB');
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true, // Replace existing file
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setModerating(true);

      // Moderate the image
      const { data: moderationData, error: moderationError } = await supabase.functions
        .invoke('moderate-image', {
          body: { imageUrl: publicUrl }
        });

      if (moderationError || !moderationData.approved) {
        // Delete the uploaded image if moderation fails or content is inappropriate
        await supabase.storage.from('avatars').remove([fileName]);
        
        if (moderationError) {
          console.error('Moderation service error:', moderationError);
          throw new Error('Content moderation is required but currently unavailable. Please try again later.');
        } else {
          const flaggedReason = moderationData.flagged_categories?.length > 0 
            ? `Contains inappropriate content: ${moderationData.flagged_categories.join(', ')}`
            : moderationData.reason || 'Image rejected by content filter';
          throw new Error(`Image rejected: ${flaggedReason}`);
        }
      }

      onImageChange(publicUrl);
      
      toast({
        title: "Image uploaded successfully",
        description: "Your profile picture has been updated.",
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setModerating(false);
    }
  };

  const removeImage = async () => {
    if (!user || !currentImageUrl) return;

    try {
      // Extract filename from URL
      const urlParts = currentImageUrl.split('/');
      const fileName = `${user.id}/${urlParts[urlParts.length - 1]}`;

      await supabase.storage.from('avatars').remove([fileName]);
      onImageChange(null);
      
      toast({
        title: "Image removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Failed to remove image",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const isLoading = uploading || moderating;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={currentImageUrl} alt="Profile picture" />
          <AvatarFallback className="text-lg font-semibold">
            {fallbackInitials}
          </AvatarFallback>
        </Avatar>
        
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
        
        {currentImageUrl && !isLoading && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {currentImageUrl ? 'Change Photo' : 'Upload Photo'}
        </Button>
      </div>

      {moderating && (
        <p className="text-sm text-muted-foreground">
          Checking image content...
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};