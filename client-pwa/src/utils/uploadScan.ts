import { supabase } from '../lib/supabase';

export const uploadScan = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  // 🎯 Matches your "Billion-Dollar" SQL Policy exactly:
  const filePath = `scans/${userId}/${Date.now()}_${fileName}`;

  const { error } = await supabase.storage
    .from('scans') // Changed from 'avatars' to match the filePath prefix 'scans/'
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  // Get the Public URL to send to your Go Backend
  const { data: { publicUrl } } = supabase.storage
    .from('scans')
    .getPublicUrl(filePath);

  return publicUrl;
};