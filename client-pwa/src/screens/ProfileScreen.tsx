import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Loader2 } from 'lucide-react';

export const ProfileScreen = () => {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      // 1. Validate file exists
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files; // 👈 Corrected: Pick the first file
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user logged in');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // 2. Upload to Storage (Upsert: true means it overwrites the old one)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get the Public URL
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // 4. Update the Profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      alert("Profile photo updated successfully!");

    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-10">
      <div className="relative group">
        <div className="w-32 h-32 rounded-[2.5rem] bg-[#1B4332]/20 border-4 border-[#FFB703] overflow-hidden shadow-2xl">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#FFB703]">
               <Camera size={40} />
            </div>
          )}
        </div>
        
        {/* The Hidden File Input */}
        <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]">
          {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
          <input 
            type="file" 
            accept="image/*" 
            onChange={uploadAvatar} 
            disabled={uploading} 
            className="hidden" 
          />
        </label>
      </div>
      
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        Tap to Change Photo
      </p>
    </div>
  );
};