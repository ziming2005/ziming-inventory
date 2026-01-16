import { api } from "./api";

export const fetchSupabaseProfile = async () => {
  const res = await api.get('/supabase/user');
  const { supabase_profile } = res.data;
  return { user: supabase_profile };
};
