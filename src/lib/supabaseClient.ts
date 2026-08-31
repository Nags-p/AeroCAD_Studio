import { createClient } from '@supabase/supabase-js';
import { AircraftModel } from '@/types/aircraft';
import { encryptModelForCloud, decryptModelFromCloud } from './cryptoVault';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bupvisldxeoommofsbly.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cHZpc2xkeGVvb21tb2ZzYmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjExODUsImV4cCI6MjA5MDY5NzE4NX0.0bnIzb-1Gg8C7-MceWjXDBplOnqosGa_6k03JGKEE3o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface CloudAircraftRecord {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  units: string;
  model_json: AircraftModel;
  wingspan?: number;
  length?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Encrypts with client-side AES-256-GCM and saves or updates an aircraft model in Supabase
 */
export async function saveAircraftToCloud(
  model: AircraftModel,
  description?: string,
  cloudRecordId?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return { success: false, error: 'User is not logged in. Please sign in to save to the cloud.' };
    }

    const wingspan = Number(model.wings?.[0]?.span) || 0;
    const length = Number(model.fuselage?.length) || 0;

    // Client-side AES-256-GCM encryption
    const encryptedModel = await encryptModelForCloud(model, user.id, user.email || '');

    const payload = {
      user_id: user.id,
      name: model.name || 'Untitled Aircraft',
      description: description || '',
      units: model.units || 'metric',
      model_json: encryptedModel,
      wingspan,
      length,
      updated_at: new Date().toISOString(),
    };

    // If cloudRecordId is provided, try to update that specific record
    if (cloudRecordId) {
      const { data, error } = await supabase
        .from('aircraft_models')
        .update(payload)
        .eq('id', cloudRecordId)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (!error && data) {
        return { success: true, data };
      }
    }

    // Check if a model with the same name already exists for this user
    const { data: existing } = await supabase
      .from('aircraft_models')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', model.name || 'Untitled Aircraft')
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('aircraft_models')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from('aircraft_models')
        .insert(payload)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected cloud save error' };
  }
}

/**
 * Lists all aircraft models saved by the currently authenticated user and automatically decrypts them
 */
export async function fetchUserAircraftModels(): Promise<{ success: boolean; data?: CloudAircraftRecord[]; error?: string }> {
  try {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return { success: false, error: 'Please sign in to view cloud projects.' };
    }

    const { data, error } = await supabase
      .from('aircraft_models')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Decrypt each model in parallel using user's cryptographic key
    const decryptedRecords: CloudAircraftRecord[] = await Promise.all(
      (data || []).map(async (record: any) => {
        try {
          const decryptedModel = await decryptModelFromCloud(record.model_json, user.id, user.email || '');
          return {
            ...record,
            model_json: decryptedModel,
          };
        } catch (err) {
          console.error(`Failed to decrypt model for record ${record.id}:`, err);
          return {
            ...record,
            model_json: record.model_json,
          };
        }
      })
    );

    return { success: true, data: decryptedRecords };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch cloud projects' };
  }
}

/**
 * Deletes an aircraft model from the cloud
 */
export async function deleteAircraftFromCloud(recordId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('aircraft_models')
      .delete()
      .eq('id', recordId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete project from cloud' };
  }
}
