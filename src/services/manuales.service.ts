import { supabase } from './supabase';
import { storageService } from './storage.service';

const MANUALES_PREFIX = 'Manuales';
const BUCKET = 'ERP';

export interface ManualFolder {
  name: string;
  updated_at?: string;
  created_at?: string;
}

export interface ManualFile {
  name: string;
  path: string;
  updated_at?: string;
  created_at?: string;
  metadata?: {
    mimetype?: string;
    size?: number;
  };
}

export const manualesService = {
  async listFolders(): Promise<ManualFolder[]> {
    const { data, error } = await supabase.storage.from(BUCKET).list(MANUALES_PREFIX, {
      limit: 200,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) throw error;
    if (!data) return [];

    return data
      .filter((item) => item.id === null) // directories have null id
      .map((item) => ({
        name: item.name,
        updated_at: item.updated_at,
        created_at: item.created_at,
      }));
  },

  async listFiles(folder: string): Promise<ManualFile[]> {
    const prefix = folder ? `${MANUALES_PREFIX}/${folder}` : MANUALES_PREFIX;
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: 200,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) throw error;
    if (!data) return [];

    return data
      .filter((item) => item.id !== null)
      .map((item) => ({
        name: item.name,
        path: `${prefix}/${item.name}`,
        updated_at: item.updated_at,
        created_at: item.created_at,
        metadata: item.metadata,
      }));
  },

  async getPublicUrl(path: string): Promise<string> {
    return storageService.getManualFileUrl(path);
  },
};
