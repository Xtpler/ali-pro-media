import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as typedClient } from "@/integrations/supabase/client";

// The app uses tables/RPCs from its own migrations that may not be in the generated types yet,
// so expose a loosely-typed client to app code.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = typedClient as unknown as SupabaseClient<any, "public", any>;
