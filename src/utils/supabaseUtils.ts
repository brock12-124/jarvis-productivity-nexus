
import { supabase } from "@/integrations/supabase/client";

export function getSupabaseUrl() {
  // Get the project URL from the client's API URL
  const apiUrl = supabase.supabaseUrl;
  // Return the base URL without the trailing slash
  return apiUrl;
}

export function getFunctionUrl(functionName: string) {
  const baseUrl = getSupabaseUrl();
  return `${baseUrl}/functions/v1/${functionName}`;
}
