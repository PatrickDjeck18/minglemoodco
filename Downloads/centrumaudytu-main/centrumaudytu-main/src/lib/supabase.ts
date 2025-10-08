import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create singleton instance to avoid multiple client warnings
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
  }
  return supabaseInstance;
})();

// Types
export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'participant';
  group_id?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  two_factor_enabled?: boolean;
  two_factor_secret?: string;
  two_factor_secret_temp?: string;
  two_factor_backup_codes?: string[];
}

export interface Group {
  id: string;
  name: string;
  created_at: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  passing_score: number;
  time_limit?: number;
  max_attempts: number;
  questions_per_exam: number;
  created_by: string;
  created_at: string;
  certificate_template?: {
    szkolenie: string;
    kompetencje: string;
    opisUkonczenia: string;
  };
}

export interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'open_text';
  options?: Record<string, string>;
  correct_answer: string;
  points: number;
  order_index: number;
}

export interface ExamAssignment {
  id: string;
  exam_id: string;
  participant_id?: string;
  group_id?: string;
  assigned_at: string;
  assigned_by: string;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  participant_id: string;
  started_at: string;
  completed_at?: string;
  score?: number;
  passed: boolean;
  answers: Record<string, string>;
  attempt_number: number;
}

export interface Invitation {
  id: string;
  email: string;
  group_id: string;
  invited_by: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  groups?: Group;
}

export interface Certificate {
  id: string;
  attempt_id: string;
  participant_id: string;
  exam_id: string;
  certificate_data: Record<string, any>;
  pdf_url?: string;
  generated_at: string;
  created_at: string;
}

export interface TrainingMaterial {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'link' | 'document' | 'image' | 'audio';
  file_url?: string;
  external_url?: string;
  file_size?: number;
  duration?: number;
  thumbnail_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialAssignment {
  id: string;
  material_id: string;
  participant_id?: string;
  group_id?: string;
  assigned_by: string;
  assigned_at: string;
  due_date?: string;
  is_required: boolean;
  notes?: string;
  training_materials?: TrainingMaterial;
  profiles?: Profile;
  groups?: Group;
}

export interface MaterialProgress {
  id: string;
  material_id: string;
  participant_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  started_at?: string;
  completed_at?: string;
  last_accessed_at?: string;
  notes?: string;
  training_materials?: TrainingMaterial;
}