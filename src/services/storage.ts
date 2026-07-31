import { supabase } from "@/integrations/supabase/client";

/** Camada fina sobre o Supabase Storage — genérica para qualquer bucket/módulo. */
export const storageService = {
  upload: async (bucket: string, path: string, file: File) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) throw new Error(error.message);
    return storageService.getPublicUrl(bucket, path);
  },

  getPublicUrl: (bucket: string, path: string) =>
    supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl,

  remove: async (bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw new Error(error.message);
  },
};
