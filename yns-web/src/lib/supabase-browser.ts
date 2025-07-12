"use client";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

const supabaseBrowser = createBrowserSupabaseClient();

export default supabaseBrowser;