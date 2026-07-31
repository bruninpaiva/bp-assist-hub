import { supabase } from "@/integrations/supabase/client";

/** Validade padrão de uma signed URL — cobre uma sessão de visualização/download. */
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;

/**
 * Camada fina sobre o Supabase Storage — genérica para qualquer bucket/módulo.
 * Todos os buckets são privados: não existe URL pública, toda leitura passa
 * por uma signed URL de curta duração gerada sob demanda.
 */
export const storageService = {
  upload: async (bucket: string, path: string, file: File) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) throw new Error(error.message);
  },

  createSignedUrl: async (
    bucket: string,
    path: string,
    expiresIn: number = SIGNED_URL_EXPIRES_IN_SECONDS,
  ): Promise<string> => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) throw new Error(error.message);
    return data.signedUrl;
  },

  /** Assina vários caminhos em uma única chamada — usado por galerias com várias fotos. */
  createSignedUrls: async (
    bucket: string,
    paths: string[],
    expiresIn: number = SIGNED_URL_EXPIRES_IN_SECONDS,
  ): Promise<Record<string, string>> => {
    if (paths.length === 0) return {};
    const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, expiresIn);
    if (error) throw new Error(error.message);
    return Object.fromEntries(
      data
        .filter((item): item is { error: null; path: string; signedUrl: string } =>
          Boolean(item.path && item.signedUrl),
        )
        .map((item) => [item.path, item.signedUrl]),
    );
  },

  remove: async (bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw new Error(error.message);
  },
};
