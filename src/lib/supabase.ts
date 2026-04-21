import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type IPSRule = {
  id: string;
  name: string;
  metric: 'login_failures' | 'sql_keyword' | 'request_rate';
  operator: 'greater_than' | 'contains' | 'less_than';
  threshold_value: string;
  time_window: number;
  action: 'block_ip' | 'terminate_connection' | 'enable_captcha';
  enabled: boolean;
  created_at: string;
};

export type Intervention = {
  id: string;
  ip: string;
  rule_id: string | null;
  rule_name: string;
  action: string;
  reason: string;
  unblocked: boolean;
  created_at: string;
};
