
import { supabase } from "@/integrations/supabase/client";

export function getSupabaseUrl() {
  // Use the hardcoded URL from the client file
  // This is more reliable than trying to access the protected supabaseUrl property
  return "https://wbvixdyotrrcblwewbql.supabase.co";
}

export function getFunctionUrl(functionName: string) {
  const baseUrl = getSupabaseUrl();
  return `${baseUrl}/functions/v1/${functionName}`;
}
