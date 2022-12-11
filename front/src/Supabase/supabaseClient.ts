import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../Enum/EnvironmentVariable";

const supabaseUrl = SUPABASE_URL || "";
const supabaseAnonKey = SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
