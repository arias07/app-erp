import { supabase } from './supabase';

const DEFAULT_BUCKET = 'ERP';

const getFileExtension = (fileName: string) => {
  const parts = fileName.split('.');
  if (parts.length <= 1) return '';
  return parts.pop()!.toLowerCase();
};

const fetchBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('No se pudo leer el archivo seleccionado');
  }

  // @ts-ignore React Native fetch devuelve blob
  const blob = await response.blob();
  return blob;
};

export const storageService = {
  async uploadFileToBucket(params: {
    bucket?: string;
    path: string;
    uri: string;
    mimeType: string;
    fileName?: string;
    upsert?: boolean;
  }): Promise<{ bucket: string; path: string; publicUrl: string }> {
    const bucket = params.bucket ?? DEFAULT_BUCKET;
    const blob = await fetchBlob(params.uri);
    const filePath = params.path;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: params.mimeType,
        upsert: params.upsert ?? true,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return {
      bucket,
      path: filePath,
      publicUrl: data.publicUrl,
    };
  },

  async uploadOrderEvidence(
    orderId: string,
    uri: string,
    fileName: string,
    mimeType: string
  ): Promise<{ bucket: string; path: string; publicUrl: string }> {
    const extension = getFileExtension(fileName) || mimeType.split('/').pop() || 'dat';
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const baseName = safeFileName.replace(new RegExp(`\\.${extension}$`, 'i'), '');
    const timestamp = Date.now();
    const path = `Ordenes/${orderId}/evidencias/${timestamp}_${baseName}.${extension}`;

    return this.uploadFileToBucket({
      bucket: DEFAULT_BUCKET,
      path,
      uri,
      mimeType,
      fileName: safeFileName,
      upsert: true,
    });
  },

  async getManualFileUrl(path: string): Promise<string> {
    const { data } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  async listManualFolders(): Promise<any[]> {
    const { data, error } = await supabase.storage.from(DEFAULT_BUCKET).list('Manuales', {
      limit: 200,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) throw error;
    return data ?? [];
  },

  async listManualFiles(folder: string): Promise<any[]> {
    const prefix = folder ? `Manuales/${folder}` : 'Manuales';
    const { data, error } = await supabase.storage.from(DEFAULT_BUCKET).list(prefix, {
      limit: 200,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) throw error;
    return data ?? [];
  },
};
